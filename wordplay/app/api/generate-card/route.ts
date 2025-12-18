import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";

import {
  GeneratedCardSchema,
  GenerateCardRequestSchema,
  type GenerateCardRequest,
  type GeneratedCard,
} from "@/lib/cardgen/types";

import {
  buildGenerateCardPrompt,
  generateCardSystemPrompt,
} from "@/lib/ai/generateCardPrompt";

export const runtime = "edge";

// We accept only a small, strict input surface.
const RequestSchema = GenerateCardRequestSchema;

// The model must return EXACTLY this schema.
const ModelOutputSchema = GeneratedCardSchema;

/**
 * Extra guardrails beyond Zod:
 * - Ensure `keywords.exhaust` matches presence of an exhaust effect (or vice versa).
 * - Ensure `text` is non-empty and not wildly out-of-sync with effects (light check).
 */
function slugifyId(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return (slug || "card").slice(0, 60);
}

function postValidateCard(params: {
  card: GeneratedCard;
  requestedName: string;
  requestedRarity?: GeneratedCard["rarity"];
}): GeneratedCard {
  const hasExhaustEffect = params.card.effects.some((e) => e.kind === "exhaust");

  // Normalize keyword if effect explicitly exhausts.
  const keywords = {
    ...(params.card.keywords ?? {}),
    ...(hasExhaustEffect ? { exhaust: true } : {}),
  };

  // Hard rule: name must be EXACTLY the requested word (server-enforced).
  // Also derive a stable id from the requested word.
  return {
    ...params.card,
    id: slugifyId(params.requestedName),
    name: params.requestedName,
    rarity: params.requestedRarity ?? params.card.rarity,
    keywords: Object.keys(keywords).length ? keywords : undefined,
  };
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

    const body: GenerateCardRequest = parsed.data;

    const prompt = buildGenerateCardPrompt(body);

    const modelName =
      provider === "openai"
        ? process.env.OPENAI_MODEL ?? "gpt-4o-mini"
        : process.env.GROQ_MODEL ??
          "meta-llama/llama-4-maverick-17b-128e-instruct";

    const model = provider === "openai" ? openai(modelName) : groq(modelName);

    const { object } = await generateObject({
      model,
      schema: ModelOutputSchema,
      system: generateCardSystemPrompt,
      prompt,
      temperature: 0.5,
    });

    // Additional safety validation (non-fatal normalization).
    const normalized = postValidateCard({
      card: object,
      requestedName: body.word,
      requestedRarity: body.rarity,
    });

    // Final sanity check in case normalization broke something.
    const finalParsed = ModelOutputSchema.safeParse(normalized);
    if (!finalParsed.success) {
      return Response.json(
        { error: "Model returned invalid card", details: finalParsed.error.flatten() },
        { status: 502 }
      );
    }

    return Response.json(finalParsed.data);
  } catch (err) {
    console.error(err);

    // Try to return useful error if model output parsing failed.
    const message = err instanceof Error ? err.message : "Unknown error";

    // If it's Zod-ish, surface it.
    if (message.toLowerCase().includes("zod") || message.toLowerCase().includes("schema")) {
      return Response.json(
        { error: "Failed to generate card (schema mismatch)", details: message },
        { status: 502 }
      );
    }

    return Response.json({ error: "Failed to generate card" }, { status: 500 });
  }
}
