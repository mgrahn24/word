import type { CardMultiplier } from "./cards";
import type { Enemy } from "./enemies";

export type EvaluateWordRequest = {
  word: string;
  enemy: Enemy;
  cards: CardMultiplier[];
  usedWords: string[];
};

export type WordMultiplierBreakdown = {
  id: string;
  label: string;
  applied: boolean;
  multiplier?: number;
  bonus?: number;
  reason: string;
};

export type EvaluateWordResponse = {
  normalizedWord: string;
  baseScore: number;
  multipliers: WordMultiplierBreakdown[];
  totalMultiplier: number;
  totalBonus: number;
  finalScore: number;
  tags: {
    partOfSpeech?: string;
    categories: string[];
  };
  explanation: string;
};
