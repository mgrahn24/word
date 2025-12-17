import type { CardMultiplier } from "@/lib/game/cards";
import type { Enemy } from "@/lib/game/enemies";

export const evaluateWordSystemPrompt = `You are a game word evaluator.
Return ONLY a JSON object that matches the provided schema.

We are in a battle. The player submits ONE word per turn.

Scoring rules:
- baseScore (0-100) should be based on:
  1) inherent strength/impact of the concept (e.g. "tsunami" > "puddle")
  2) creativity/interestingness (reward unusual but sensible words)
  3) Carefully consider ANY way that the word might connect to the weakness or theme even more creative ones, don't assume the most common meaning of the word, think of all possible meanings and associations including from different cultures or contexts.
- DO NOT penalize small misspellings. If the word is likely a misspelling, interpret the intended word and score it.

Main weakness multiplier:
- The enemy has a MAIN weakness/theme.
- Output mainWeaknessMultiplier in the range 0.0 to 3.0.
  - If the word is NOT relevant to the main weakness/theme, mainWeaknessMultiplier should be 0.0 (so final damage is 0).
  - If the word matches strongly, mainWeaknessMultiplier should be >1.0 (up to 3.0).

Minor weakness:
- The enemy has 1 minor weakness.
- Minor weaknesses should be fairly easy to trigger, but not very strong.
- Decide if the word exploits it.
- If exploited, output a multiplier between 1.0 and 1.5 (higher for strong match). If not exploited, multiplier should be 1.0.

You must compute separate multipliers:
- mainWeaknessMultiplier: based on enemy weakness/theme.
- abilityMultiplier: based on enemy ability instruction.
- minorWeaknessMultiplier: based on the minor weakness.

Cards:
- Each card includes an instruction for how to decide if it applies.
- For each card, decide applied=true/false and provide a brief reason.

Be concise in reasons. Do not invent cards or rules beyond what is provided.`;

export function buildEvaluateWordPrompt(params: {
  word: string;
  enemy: Enemy;
  cards: CardMultiplier[];
  usedWords: string[];
}) {
  return `Enemy (player-facing):\n${JSON.stringify(
    {
      id: params.enemy.id,
      name: params.enemy.name,
      weakness: params.enemy.weakness.display,
      ability: params.enemy.ability.display,
    },
    null,
    2
  )}\n\nEnemy (evaluation instructions):\n${JSON.stringify(
    {
      weaknessInstruction: params.enemy.weakness.instruction,
      minorWeakness: {
        id: params.enemy.minorWeakness.id,
        instruction: params.enemy.minorWeakness.instruction,
      },
      abilityInstruction: params.enemy.ability.instruction,
    },
    null,
    2
  )}\n\nCards (player-facing):\n${JSON.stringify(
    params.cards.map((c) => ({
      id: c.id,
      label: c.label,
      description: c.description,
      multiplier: c.multiplier,
      bonus: c.bonus,
    })),
    null,
    2
  )}\n\nCards (evaluation instructions):\n${JSON.stringify(
    params.cards.map((c) => ({
      id: c.id,
      instruction: c.ability.instruction,
    })),
    null,
    2
  )}\n\nPreviously used words:\n${JSON.stringify(params.usedWords.slice(-50), null, 2)}\n\nWord: "${params.word}"\n\nEvaluate this word.`;
}
