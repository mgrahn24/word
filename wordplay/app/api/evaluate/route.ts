import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import type {
  EvaluateWordRequest,
  EvaluateWordResponse,
  WordMultiplierBreakdown,
} from "@/lib/game/types";

import {
  buildEvaluateWordPrompt,
  evaluateWordSystemPrompt,
} from "@/lib/ai/evaluateWordPrompt";

export const runtime = "edge";

const RequestSchema = z.object({
  word: z.string().min(1).max(40),
  enemy: z.object({
    id: z.string(),
    name: z.string(),
    maxHp: z.number(),
    turns: z.number(),
    weakness: z.object({
      display: z.string(),
      instruction: z.string(),
    }),
    minorWeakness: z.object({
      id: z.string(),
      display: z.string(),
      instruction: z.string(),
    }),
    ability: z.object({
      display: z.string(),
      instruction: z.string(),
    }),
  }),
  cards: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
      ability: z.object({
        display: z.string(),
        instruction: z.string(),
      }),
      multiplier: z.number(),
      bonus: z.number().optional(),
    })
  ),
  usedWords: z.array(z.string()),
});

const ModelOutputSchema = z.object({
  normalizedWord: z.string(),
  tags: z.object({
    partOfSpeech: z
      .enum([
        "noun",
        "verb",
        "adjective",
        "adverb",
        "proper_noun",
        "other",
      ])
      .optional(),
    categories: z.array(z.string()),
  }),
  // baseScore is the "raw" damage before cards and ability/weakness scaling.
  baseScore: z.number().int().min(0).max(100),
  // multipliers (server will combine with cards and return breakdown)
  mainWeaknessMultiplier: z.number().min(0).max(3),
  mainWeaknessReason: z.string(),
  abilityMultiplier: z.number().min(0).max(10),
  abilityReason: z.string(),
  minorWeakness: z.object({
    applied: z.boolean(),
    // Model output can occasionally drift; we clamp server-side too.
    multiplier: z.number().min(1).max(2),
    reason: z.string(),
  }),
  // card application decisions
  cardBreakdown: z.array(
    z.object({
      id: z.string(),
      applied: z.boolean(),
      multiplier: z.number().optional(),
      bonus: z.number().optional(),
      reason: z.string(),
    })
  ),
  explanation: z.string(),
});

function computeTotals(params: {
  baseScore: number;
  breakdown: WordMultiplierBreakdown[];
}): { totalMultiplier: number; totalBonus: number; finalScore: number } {
  const totalMultiplier = params.breakdown.reduce((acc, m) => {
    if (!m.applied) return acc;
    if (typeof m.multiplier !== "number") return acc;
    return acc * m.multiplier;
  }, 1);

  const totalBonus = params.breakdown.reduce((acc, m) => {
    if (!m.applied) return acc;
    if (typeof m.bonus !== "number") return acc;
    return acc + m.bonus;
  }, 0);

  const finalScore = Math.max(
    0,
    Math.round(params.baseScore * totalMultiplier + totalBonus)
  );

  return { totalMultiplier, totalBonus, finalScore };
}

export async function POST(req: Request) {
  try {
    const provider = (process.env.AI_PROVIDER ?? "groq").toLowerCase();

    if (provider === "openai") {
      if (!process.env.OPENAI_API_KEY) {
        return Response.json(
          {
            error:
              "Missing OPENAI_API_KEY. Add it to .env.local (see .env.local.example).",
          },
          { status: 500 }
        );
      }
    } else {
      // default: groq
      if (!process.env.GROQ_API_KEY) {
        return Response.json(
          {
            error:
              "Missing GROQ_API_KEY. Add it to .env.local (see .env.local.example).",
          },
          { status: 500 }
        );
      }
    }

    const json = (await req.json()) as unknown;
    const parsed = RequestSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const body: EvaluateWordRequest = parsed.data;

    const normalizedIncoming = body.word.trim().toLowerCase();
    const alreadyUsed = body.usedWords.some(
      (w) => w.trim().toLowerCase() === normalizedIncoming
    );

    // Exact repeats should score 0 (hard rule)
    if (alreadyUsed) {
      const response: EvaluateWordResponse = {
        normalizedWord: normalizedIncoming,
        baseScore: 0,
        multipliers: [
          {
            id: "repeat",
            label: "Repeat",
            applied: true,
            multiplier: 0,
            reason: "Exact repeat of a previously used word.",
          },
          {
            id: "main-weakness",
            label: "Main weakness",
            applied: true,
            multiplier: 0,
            reason: "Exact repeats deal 0 damage.",
          },
        ],
        totalMultiplier: 0,
        totalBonus: 0,
        finalScore: 0,
        tags: {
          categories: [],
        },
        explanation: "Exact repeats deal 0 damage.",
      };

      return Response.json(response);
    }

    const prompt = buildEvaluateWordPrompt({
      word: body.word,
      enemy: body.enemy,
      cards: body.cards,
      usedWords: body.usedWords,
    });

    const modelName =
      provider === "openai"
        ? process.env.OPENAI_MODEL ?? "gpt-4o-mini"
        : process.env.GROQ_MODEL ??
          "meta-llama/llama-4-maverick-17b-128e-instruct";

    const model =
      provider === "openai" ? openai(modelName) : groq(modelName);

    const { object } = await generateObject({
      model,
      schema: ModelOutputSchema,
      system: evaluateWordSystemPrompt,
      prompt,
      temperature: 0.2,
    });

    const multipliers: WordMultiplierBreakdown[] = [
      {
        id: "main-weakness",
        label: "Main weakness",
        applied: true,
        multiplier: object.mainWeaknessMultiplier,
        reason: object.mainWeaknessReason,
      },
      {
        id: "ability",
        label: "Enemy ability",
        applied: true,
        multiplier: object.abilityMultiplier,
        reason: object.abilityReason,
      },
      {
        id: body.enemy.minorWeakness.id,
        label: `Minor weakness: ${body.enemy.minorWeakness.display}`,
        applied: true,
        multiplier: Math.min(1.5, Math.max(1, object.minorWeakness.multiplier)),
        reason: object.minorWeakness.reason,
      },
      ...body.cards.map((c) => {
        const found = object.cardBreakdown.find((b) => b.id === c.id);
        return {
          id: c.id,
          label: c.label,
          applied: found?.applied ?? false,
          multiplier: found?.multiplier ?? (c.multiplier !== 1 ? c.multiplier : undefined),
          bonus: found?.bonus ?? c.bonus,
          reason:
            found?.reason ??
            (found?.applied
              ? "Applied"
              : "Not applied (no reason provided by model)"),
        };
      }),
    ];

    const totals = computeTotals({ baseScore: object.baseScore, breakdown: multipliers });

    const response: EvaluateWordResponse = {
      normalizedWord: object.normalizedWord,
      baseScore: object.baseScore,
      multipliers,
      totalMultiplier: totals.totalMultiplier,
      totalBonus: totals.totalBonus,
      finalScore: totals.finalScore,
      tags: {
        partOfSpeech: object.tags.partOfSpeech,
        categories: object.tags.categories,
      },
      explanation: object.explanation,
    };

    return Response.json(response);
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Failed to evaluate word" },
      { status: 500 }
    );
  }
}
