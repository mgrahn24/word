import type { CardMultiplier } from "./cards";
import {
  ENEMY_LEVEL_SPECS,
  MINOR_WEAKNESS_POOL,
  getThemeClue,
  type Enemy,
  type EnemyAbility,
  type EnemyLevelSpec,
  type EnemyTheme,
  type MinorWeakness,
} from "./enemies";

export type Phase = "intro" | "battle" | "card" | "victory" | "defeat";

export type GameState = {
  levelIndex: number;
  enemy: Enemy;
  enemyHp: number;
  turnsLeft: number;
  cards: CardMultiplier[];
  usedWords: string[];
  phase: Phase;
};

function pickOne<T>(arr: T[]): T {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx]!;
}

function pickMinorWeaknessForTheme(theme: EnemyTheme): MinorWeakness {
  // Keep the main weakness and minor weakness distinct to avoid repetitive runs.
  // We only have a few broad minor categories, so we map themes to categories to avoid.
  const forbiddenByTheme: Record<string, MinorWeakness["id"][]> = {
    // Elemental-ish themes
    "t-fire": ["minor-elements"],
    "t-water": ["minor-elements"],
    "t-ice": ["minor-elements"],
    "t-electric": ["minor-elements"],
    "t-metal": ["minor-elements"],

    // Nature-ish themes
    "t-nature": ["minor-natural"],
    "t-animals": ["minor-natural"],
    "t-insects": ["minor-natural"],
    "t-ocean": ["minor-natural", "minor-elements"],
    "t-weather": ["minor-natural", "minor-elements"],

    // Place-ish themes
    "t-cities": ["minor-place"],
    "t-space": ["minor-place"],

    // Object/tech themes
    "t-machines": ["minor-objects"],
    "t-weapons": ["minor-objects"],
    "t-keys": ["minor-objects"],

    // Abstract themes
    "t-time": ["minor-abstract"],
    "t-fate": ["minor-abstract"],
    "t-knowledge": ["minor-abstract"],
    "t-law": ["minor-abstract"],
    "t-paradox": ["minor-abstract"],
    "t-bureaucracy": ["minor-abstract"],
    "t-identity": ["minor-abstract"],

    // Feelings themes
    "t-fear": ["minor-feelings"],
    "t-love": ["minor-feelings"],

    // General
    "t-lies": ["minor-abstract"],
    "t-secrets": ["minor-abstract"],
    "t-memory": ["minor-abstract"],
    "t-silence": ["minor-abstract"],
    "t-chaos": ["minor-abstract"],
    "t-decay": ["minor-natural"],
    "t-undead": ["minor-feelings"],
    "t-dream": ["minor-abstract"],
    "t-myth": ["minor-abstract"],
    "t-cosmic": ["minor-abstract"],
    "t-void": ["minor-abstract"],
    "t-hunger": ["minor-feelings"],
  };

  const forbidden = new Set(forbiddenByTheme[theme.id] ?? []);

  const candidates = MINOR_WEAKNESS_POOL.filter((m) => !forbidden.has(m.id));
  if (candidates.length > 0) return pickOne(candidates);
  return pickOne(MINOR_WEAKNESS_POOL);
}

function generateEnemyForLevel(level: EnemyLevelSpec): Enemy {
  const theme: EnemyTheme = pickOne(level.themes);
  const ability: EnemyAbility = pickOne(level.abilities);
  const minorWeakness: MinorWeakness = pickMinorWeaknessForTheme(theme);

  const clue = getThemeClue(theme, level.level);

  return {
    id: `lvl${level.level}-${theme.id}-${ability.id}-${minorWeakness.id}`,
    // Short + readable. Avoid repeating the clue text here.
    name: `Foe ${level.level}`,
    maxHp: level.stats.maxHp,
    turns: level.stats.turns,
    weakness: { display: clue, instruction: theme.instruction },
    minorWeakness,
    ability: { display: ability.display, instruction: ability.instruction },
  };
}

export function startGame(): GameState {
  const enemy = generateEnemyForLevel(ENEMY_LEVEL_SPECS[0]!);
  return {
    levelIndex: 0,
    enemy,
    enemyHp: enemy.maxHp,
    turnsLeft: enemy.turns,
    cards: [],
    usedWords: [],
    phase: "intro",
  };
}

export function startNextLevel(state: GameState): GameState {
  const nextLevelIndex = state.levelIndex + 1;
  const spec = ENEMY_LEVEL_SPECS[nextLevelIndex]!;
  const enemy = generateEnemyForLevel(spec);

  return {
    ...state,
    levelIndex: nextLevelIndex,
    enemy,
    enemyHp: enemy.maxHp,
    turnsLeft: enemy.turns,
    usedWords: [],
    phase: "battle",
  };
}

export function startEnemy(state: GameState, enemy: Enemy): GameState {
  return {
    ...state,
    enemy,
    enemyHp: enemy.maxHp,
    turnsLeft: enemy.turns,
    usedWords: [],
    phase: "battle",
  };
}

export function applyDamage(state: GameState, damage: number): GameState {
  return {
    ...state,
    enemyHp: Math.max(0, state.enemyHp - damage),
    turnsLeft: Math.max(0, state.turnsLeft - 1),
  };
}
