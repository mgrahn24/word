import type { GenerateCardRequest, GeneratedCard } from "@/lib/cardgen/types";

export const generateCardSystemPrompt = `You are a Slay-the-Spire-inspired card designer.
Return ONLY a JSON object that matches the provided schema.

Hard constraints:
- You MUST ONLY use effect kinds and enums from the schema.
- Keep the card finite: 1-4 effects max.
- Do not invent new statuses, keywords, or mechanics.
- Cost is provided and MUST be used as-is.
- The card name MUST be EXACTLY the input theme word (same spelling and casing).
- Keep numbers within the schema bounds.

Design guidance:
- The input word is the theme. Use it to name the card and pick a coherent effect.
- Keep the card reasonably balanced for its cost.
  * cost 0: small effect
  * cost 1: modest effect
  * cost 2: strong effect
  * cost 3: very strong effect
- Prefer simple classic STS patterns (damage, block, apply status, draw).
- If adding a downside, use discard_cards or exhaust keyword/effect.

Output fields:
- id: a short slug (kebab-case) derived from name.
- text: 1-4 short player-facing lines describing what the card does.
- effects: structured representation matching the text.
- balanceNotes: one short sentence explaining why the numbers make sense.
`;

export function buildGenerateCardPrompt(params: GenerateCardRequest) {
  const color = params.color ?? "ironclad";

  // We pass a tiny bit of guidance about each color identity to keep output consistent.
  const colorGuides: Record<string, string> = {
    ironclad: "Ironclad leans toward strength, damage, self-buffs, and aggressive block.",
    silent: "Silent leans toward poison, weak, multiple hits, and card draw/discard.",
    defect: "Defect leans toward dexterity-like defense, energy manipulation, and multi-hit attacks.",
    watcher: "Watcher leans toward big hits, vulnerable/weak manipulation, and efficient scaling.",
    colorless: "Colorless should be generic and broadly usable, lower synergy.",
  };

  return `Create ONE new card.

Theme word (MUST equal card.name exactly): "${params.word}"
Cost: ${params.cost}
Color: ${color}
Rarity: ${params.rarity ?? "(choose)"}
Color identity note: ${colorGuides[color] ?? ""}

Hard requirements:
- card.name MUST be exactly: ${params.word}
- If rarity is provided, set card.rarity to that value.

Make a coherent STS-style card using ONLY schema mechanics.`;
}

/**
 * A tiny helper for UI: renders a compact, readable text line for an effect.
 * (Not used by the API route; safe for client usage.)
 */
export function effectToText(e: GeneratedCard["effects"][number]): string {
  switch (e.kind) {
    case "deal_damage":
      return `Deal ${e.amount}${e.times > 1 ? ` x${e.times}` : ""} damage to ${e.target.replace("_", " ")}.`;
    case "gain_block":
      return `Gain ${e.amount} Block.`;
    case "apply_status":
      return `Apply ${e.amount} ${e.status}${e.durationTurns ? ` for ${e.durationTurns} turns` : ""} to ${e.target.replace("_", " ")}.`;
    case "draw_cards":
      return `Draw ${e.amount}.`;
    case "gain_energy":
      return `Gain ${e.amount} Energy.`;
    case "discard_cards":
      return `Discard ${e.amount}${e.random ? " at random" : ""}.`;
    case "exhaust":
      return `Exhaust.`;
    default:
      return "";
  }
}
