import { z } from "zod";

/**
 * Finite Slay-the-Spire-inspired card model.
 *
 * NOTE: We intentionally keep this schema small + enum-based so the model
 * cannot invent unlimited mechanics.
 */

export const StsCardColorSchema = z.enum([
  "ironclad",
  "silent",
  "defect",
  "watcher",
  "colorless",
]);
export type StsCardColor = z.infer<typeof StsCardColorSchema>;

export const StsCardTypeSchema = z.enum([
  "attack",
  "skill",
  "power",
  "status",
  "curse",
]);
export type StsCardType = z.infer<typeof StsCardTypeSchema>;

export const StsRaritySchema = z.enum(["starter", "common", "uncommon", "rare"]);
export type StsRarity = z.infer<typeof StsRaritySchema>;

export const StsTargetSchema = z.enum([
  "self",
  "single_enemy",
  "all_enemies",
  "random_enemy",
]);
export type StsTarget = z.infer<typeof StsTargetSchema>;

export const StsStatusSchema = z.enum([
  "weak",
  "vulnerable",
  "frail",
  "strength",
  "dexterity",
  "poison",
  "thorns",
  "artifact",
]);
export type StsStatus = z.infer<typeof StsStatusSchema>;

export const StsEffectSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("deal_damage"),
    target: StsTargetSchema.exclude(["self"]),
    amount: z.number().int().min(1).max(60),
    times: z.number().int().min(1).max(6).default(1),
  }),
  z.object({
    kind: z.literal("gain_block"),
    target: z.literal("self"),
    amount: z.number().int().min(1).max(60),
  }),
  z.object({
    kind: z.literal("apply_status"),
    target: StsTargetSchema,
    status: StsStatusSchema,
    amount: z.number().int().min(1).max(8),
    /**
     * Duration in turns for statuses that have a duration.
     * For stacking statuses like poison, this can be omitted.
     */
    durationTurns: z.number().int().min(1).max(5).optional(),
  }),
  z.object({
    kind: z.literal("draw_cards"),
    target: z.literal("self"),
    amount: z.number().int().min(1).max(6),
  }),
  z.object({
    kind: z.literal("gain_energy"),
    target: z.literal("self"),
    amount: z.number().int().min(1).max(3),
  }),
  z.object({
    kind: z.literal("discard_cards"),
    target: z.literal("self"),
    amount: z.number().int().min(1).max(6),
    /** If true, it is random discard (harder downside). */
    random: z.boolean().default(false),
  }),
  z.object({
    kind: z.literal("exhaust"),
    target: z.literal("self"),
    /** Exhaust this card after play */
    self: z.literal(true),
  }),
]);
export type StsEffect = z.infer<typeof StsEffectSchema>;

export const GeneratedCardSchema = z.object({
  id: z.string().min(3).max(60),
  name: z.string().min(1).max(40),
  cost: z.number().int().min(0).max(3),
  color: StsCardColorSchema,
  type: StsCardTypeSchema,
  rarity: StsRaritySchema,
  targetHint: StsTargetSchema,

  /** Short designer intent / theme based on the input word. */
  concept: z.string().min(1).max(200),

  /** Player-facing card text (1-4 lines). */
  text: z.array(z.string().min(1).max(80)).min(1).max(4),

  /** Structured effects: apply these in order. */
  effects: z.array(StsEffectSchema).min(1).max(4),

  /**
   * Additional finite flags commonly seen in STS-like designs.
   * These are optional to keep the model from overusing them.
   */
  keywords: z
    .object({
      exhaust: z.boolean().optional(),
      ethereal: z.boolean().optional(),
      innate: z.boolean().optional(),
      retain: z.boolean().optional(),
    })
    .optional(),

  /** Short balance note, not shown to player by default. */
  balanceNotes: z.string().min(1).max(300),
});
export type GeneratedCard = z.infer<typeof GeneratedCardSchema>;

export const GenerateCardRequestSchema = z.object({
  word: z.string().min(1).max(40),
  cost: z.number().int().min(0).max(3),
  /** Optional; defaults to ironclad */
  color: StsCardColorSchema.optional(),
  /** Optional; if omitted the model chooses */
  rarity: StsRaritySchema.optional(),
});
export type GenerateCardRequest = z.infer<typeof GenerateCardRequestSchema>;
