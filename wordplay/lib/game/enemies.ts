export type MinorWeakness = {
  id: string;
  /** What the player sees */
  display: string;
  /** What the LLM should use to evaluate whether the word exploits this */
  instruction: string;
};

export type EnemyTheme = {
  id: string;
  /** The player sees only a clue, not the actual weakness. */
  clues: [easy: string, medium: string, hard: string, nightmare: string];
  /** LLM instruction describing the actual weakness/theme */
  instruction: string;
  /** Level at which this theme can start appearing */
  unlockLevel: number;
};

export type EnemyAbility = {
  id: string;
  /** Player-facing text (may include emoji) */
  display: string;
  /** LLM instruction that controls abilityMultiplier */
  instruction: string;
};

export type Enemy = {
  id: string;
  /** Short player-facing name */
  name: string;
  maxHp: number;
  turns: number;
  weakness: {
    /** Player-facing clue */
    display: string;
    instruction: string;
  };
  /**
   * One minor weakness assigned when the enemy is generated.
   * Designed to trigger often but is balanced by a small multiplier cap.
   */
  minorWeakness: MinorWeakness;
  ability: {
    display: string;
    instruction: string;
  };
};

export type EnemyLevelSpec = {
  level: number;
  themes: EnemyTheme[];
  abilities: EnemyAbility[];
  /** Base stats for enemies generated at this level */
  stats: {
    maxHp: number;
    turns: number;
  };
};

/**
 * Shared pool for minor weaknesses.
 * These are intentionally broad so they trigger often, but they are balanced by a small multiplier cap.
 */
export const MINOR_WEAKNESS_POOL: MinorWeakness[] = [
  {
    id: "minor-natural",
    display: "🌿 Nature",
    instruction:
      "Minor weakness is nature: animals, plants, weather, landscapes, natural phenomena.",
  },
  {
    id: "minor-objects",
    display: "🧰 Objects",
    instruction:
      "Minor weakness is objects: tools, machines, vehicles, furniture, everyday items.",
  },
  {
    id: "minor-place",
    display: "🗺️ Places",
    instruction:
      "Minor weakness is places: locations, buildings, cities, rooms, environments.",
  },
  {
    id: "minor-action",
    display: "🏃 Actions",
    instruction:
      "Minor weakness is actions: movement, verbs, doing/causing/impactful actions.",
  },
  {
    id: "minor-feelings",
    display: "💗 Feelings",
    instruction:
      "Minor weakness is feelings: emotions, moods, social dynamics, relationships.",
  },
  {
    id: "minor-elements",
    display: "⚗️ Elements",
    instruction:
      "Minor weakness is elements: fire, water, ice, electricity, metal, stone, air.",
  },
  {
    id: "minor-abstract",
    display: "🔷 Abstract",
    instruction:
      "Minor weakness is abstract concepts: time, fate, knowledge, ideas, numbers, shapes, colors.",
  },
];

function tierIndex(level: number): 0 | 1 | 2 | 3 {
  if (level <= 3) return 0;
  if (level <= 7) return 1;
  if (level <= 11) return 2;
  return 3;
}

export function getThemeClue(theme: EnemyTheme, level: number): string {
  return theme.clues[tierIndex(level)];
}

// --- Themes (main weaknesses). Player sees clues; evaluator sees instructions. ---
const THEME_POOL: EnemyTheme[] = [
  // Elemental / obvious early-game
  {
    id: "t-fire",
    unlockLevel: 1,
    clues: ["🔥 Warmth", "Ash & ember", "A hungry reaction", "The dance of oxidation"],
    instruction:
      "Enemy weakness is fire: flames, burning, heat, embers, smoke, combustion.",
  },
  {
    id: "t-water",
    unlockLevel: 1,
    clues: ["🌊 Tide", "Rain on stone", "A moving mirror", "The shape that never holds"],
    instruction:
      "Enemy weakness is water: ocean, rivers, rain, waves, drowning, wetness, fluid flow.",
  },
  {
    id: "t-ice",
    unlockLevel: 1,
    clues: ["❄️ Chill", "Crystal breath", "Stillness that bites", "Entropy made visible"],
    instruction:
      "Enemy weakness is ice: cold, frost, snow, freezing, glaciers, hail, icy surfaces.",
  },
  {
    id: "t-electric",
    unlockLevel: 1,
    clues: ["⚡ Spark", "A sudden jolt", "Invisible threads", "The anger in copper"],
    instruction:
      "Enemy weakness is electricity: lightning, power, current, charge, shocks, circuits.",
  },
  {
    id: "t-nature",
    unlockLevel: 1,
    clues: ["🌿 Green", "Roots & soil", "Life that returns", "A patient ecosystem"],
    instruction:
      "Enemy weakness is nature: plants, forests, growth, soil, ecosystems, wilderness.",
  },
  {
    id: "t-animals",
    unlockLevel: 1,
    clues: ["🐾 Tracks", "Fur & feather", "A moving heartbeat", "An ancient taxonomy"],
    instruction:
      "Enemy weakness is animals: creatures, species, beasts, pets, wildlife, anatomy.",
  },
  {
    id: "t-food",
    unlockLevel: 1,
    clues: ["🍜 Hunger", "A familiar taste", "Comfort in steam", "A recipe remembered"],
    instruction:
      "Enemy weakness is food: dishes, ingredients, cooking, flavors, eating, kitchens.",
  },

  // Mid game: still guessable
  {
    id: "t-weather",
    unlockLevel: 2,
    clues: ["🌩️ Storm", "Pressure shift", "A sky argument", "Chaos with a forecast"],
    instruction:
      "Enemy weakness is weather: storms, wind, thunder, lightning, fog, climate, seasons.",
  },
  {
    id: "t-ocean",
    unlockLevel: 2,
    clues: ["🐙 Depth", "Salt and time", "A dark ceiling", "An abyssal map"],
    instruction:
      "Enemy weakness is ocean: sea, tides, depth, ships, sea life, saltwater, currents.",
  },
  {
    id: "t-metal",
    unlockLevel: 2,
    clues: ["🧲 Alloy", "Cold shine", "A forged promise", "A lattice of restraint"],
    instruction:
      "Enemy weakness is metal: iron, steel, magnets, blades, rust, metallurgy, machines.",
  },
  {
    id: "t-cities",
    unlockLevel: 2,
    clues: ["🏙️ Streets", "Neon hum", "Concrete veins", "A million small routines"],
    instruction:
      "Enemy weakness is cities: urban life, buildings, streets, crowds, infrastructure.",
  },
  {
    id: "t-space",
    unlockLevel: 2,
    clues: ["🌌 Stars", "Vacuum hush", "Cold distances", "A gravity well"],
    instruction:
      "Enemy weakness is space: planets, stars, cosmos, orbit, vacuum, astronauts, galaxies.",
  },

  // Creative domains
  {
    id: "t-music",
    unlockLevel: 3,
    clues: ["🎵 Melody", "A repeating hook", "Vibration made meaning", "The math of feeling"],
    instruction:
      "Enemy weakness is music: instruments, songs, rhythm, harmony, genres, performance.",
  },
  {
    id: "t-machines",
    unlockLevel: 3,
    clues: ["⚙️ Mechanism", "Gears & grease", "A logic of parts", "A system that obeys"],
    instruction:
      "Enemy weakness is machines: technology, robots, engines, devices, mechanics, tools.",
  },
  {
    id: "t-magic",
    unlockLevel: 3,
    clues: ["✨ Sparkle", "A strange ritual", "Rules you can’t prove", "An impossible contract"],
    instruction:
      "Enemy weakness is magic: spells, wizards, enchantment, curses, arcane artifacts.",
  },
  {
    id: "t-night",
    unlockLevel: 3,
    clues: ["🌙 Dusk", "A quiet hour", "The world unlit", "A sky without witnesses"],
    instruction:
      "Enemy weakness is night: darkness, sleep, moon, stars, nocturnal things.",
  },
  {
    id: "t-light",
    unlockLevel: 3,
    clues: ["💡 Bright", "A sharp glare", "A revealed detail", "A truth with photons"],
    instruction:
      "Enemy weakness is light: illumination, lasers, sunlight, lamps, brilliance, glow.",
  },
  {
    id: "t-shadow",
    unlockLevel: 4,
    clues: ["🕳️ Shade", "A missing edge", "A second self", "The outline of fear"],
    instruction:
      "Enemy weakness is shadow/darkness: shadows, gloom, silhouettes, hiddenness.",
  },

  // Darker / weirder
  {
    id: "t-poison",
    unlockLevel: 4,
    clues: ["☠️ Bitter", "A tainted sip", "A slow clock", "A friendly-looking threat"],
    instruction:
      "Enemy weakness is poison/toxins: venom, poison, toxins, contamination, sickness.",
  },
  {
    id: "t-dream",
    unlockLevel: 4,
    clues: ["💤 Sleep", "A soft blur", "A scene that shifts", "A narrative without physics"],
    instruction:
      "Enemy weakness is dreams: sleep, nightmares, imagination, surreal imagery.",
  },
  {
    id: "t-myth",
    unlockLevel: 4,
    clues: ["🏛️ Legend", "Old names", "A heroic pattern", "A story older than truth"],
    instruction:
      "Enemy weakness is mythology: gods, heroes, monsters, legends, ancient myths.",
  },
  {
    id: "t-undead",
    unlockLevel: 5,
    clues: ["🧟 Grave", "A cold return", "A borrowed heartbeat", "A life that forgot to end"],
    instruction:
      "Enemy weakness is undead: ghosts, zombies, graves, curses, death imagery.",
  },
  {
    id: "t-insects",
    unlockLevel: 5,
    clues: ["🪲 Swarm", "Tiny legs", "A hive mind", "A planet of exoskeletons"],
    instruction:
      "Enemy weakness is insects/bugs: insects, hives, swarms, larvae, webs.",
  },
  {
    id: "t-crystal",
    unlockLevel: 5,
    clues: ["💎 Gem", "Facets", "Light split", "A hard prism"],
    instruction:
      "Enemy weakness is crystals/gems/glass: gems, crystals, glass, facets, refraction.",
  },
  {
    id: "t-knowledge",
    unlockLevel: 5,
    clues: ["📚 Study", "A small fact", "A theory’s spine", "A library without walls"],
    instruction:
      "Enemy weakness is knowledge: learning, books, research, science, facts, education.",
  },
  {
    id: "t-time",
    unlockLevel: 5,
    clues: ["⏳ Hour", "A ticking line", "A memory’s erosion", "The cost of change"],
    instruction:
      "Enemy weakness is time: clocks, ages, moments, history, waiting, deadlines.",
  },
  {
    id: "t-fate",
    unlockLevel: 5,
    clues: ["🧵 Thread", "A lucky sign", "A foretold turn", "A path that thinks it’s free"],
    instruction:
      "Enemy weakness is fate: destiny, prophecy, luck, inevitability, omens.",
  },

  // New interesting themes requested
  {
    id: "t-fear",
    unlockLevel: 6,
    clues: ["😱 Fright", "Racing pulse", "A shadow in the corner", "Anticipation’s hunger"],
    instruction:
      "Enemy weakness is fear: frightening things, phobias, horror, danger, dread, panic.",
  },
  {
    id: "t-weapons",
    unlockLevel: 6,
    clues: ["🗡️ Edge", "Tool of harm", "Forged intent", "Purpose-built violence"],
    instruction:
      "Enemy weakness is weapons: weapons, arms, blades, guns, tools of combat, warfare.",
  },
  {
    id: "t-love",
    unlockLevel: 7,
    clues: ["💌 Crush", "A tender thought", "A text you delete", "A promise that hurts"],
    instruction:
      "Enemy weakness is love/relationships: affection, romance, heartbreak, devotion, jealousy.",
  },
  {
    id: "t-money",
    unlockLevel: 7,
    clues: ["💰 Coin", "A price tag", "A silent agreement", "A number that changes people"],
    instruction:
      "Enemy weakness is money/greed: wealth, trade, currency, debt, bargains, luxury.",
  },
  {
    id: "t-secrets",
    unlockLevel: 8,
    clues: ["🔒 Secret", "A hidden note", "A locked smile", "Knowledge you shouldn’t have"],
    instruction:
      "Enemy weakness is secrets: secrecy, spying, hidden truths, codes, whispers, conspiracies.",
  },
  {
    id: "t-law",
    unlockLevel: 8,
    clues: ["⚖️ Rule", "A formal tone", "A stamped paper", "Order that pretends to be fair"],
    instruction:
      "Enemy weakness is law/authority: rules, courts, police, contracts, authority, justice.",
  },
  {
    id: "t-memory",
    unlockLevel: 9,
    clues: ["🧠 Recall", "A familiar scent", "A scene on repeat", "A past that edits itself"],
    instruction:
      "Enemy weakness is memory/nostalgia: memories, past, nostalgia, forgetting, déjà vu.",
  },
  {
    id: "t-silence",
    unlockLevel: 10,
    clues: ["🤫 Quiet", "No echo", "A room holding breath", "Meaning between words"],
    instruction:
      "Enemy weakness is silence: quietness, stillness, hush, absence of sound, mute moments.",
  },
  {
    id: "t-chaos",
    unlockLevel: 10,
    clues: ["🌀 Chaos", "A messy desk", "Unstable patterns", "A system losing its story"],
    instruction:
      "Enemy weakness is chaos/entropy: disorder, randomness, instability, turbulence, decay.",
  },
  {
    id: "t-identity",
    unlockLevel: 11,
    clues: ["🎭 Mask", "A chosen name", "A mirror lie", "A self built from others"],
    instruction:
      "Enemy weakness is identity: masks, personas, names, roles, disguise, selfhood.",
  },
  {
    id: "t-keys",
    unlockLevel: 11,
    clues: ["🗝️ Key", "A small solution", "A door’s question", "Access without permission"],
    instruction:
      "Enemy weakness is keys/locks/doors: keys, locks, doors, access, passwords, gates.",
  },
  {
    id: "t-hunger",
    unlockLevel: 12,
    clues: ["🍽️ Appetite", "An empty plate", "A craving spiral", "Consumption as a religion"],
    instruction:
      "Enemy weakness is hunger/consumption: eating, appetite, craving, devouring, need.",
  },
  {
    id: "t-lies",
    unlockLevel: 12,
    clues: ["🤥 Lie", "A polite story", "A practiced answer", "Truth with makeup"],
    instruction:
      "Enemy weakness is lies/deception: deception, trickery, scams, illusions, misinformation.",
  },
  {
    id: "t-paradox",
    unlockLevel: 13,
    clues: ["♾️ Loop", "A knot in logic", "A statement that eats itself", "A proof that breaks reality"],
    instruction:
      "Enemy weakness is paradox: contradictions, self-reference, impossible loops, logical paradoxes.",
  },
  {
    id: "t-bureaucracy",
    unlockLevel: 13,
    clues: ["🗂️ Form", "A numbered queue", "A rubber stamp", "A maze of polite no’s"],
    instruction:
      "Enemy weakness is bureaucracy: paperwork, administration, forms, offices, red tape, systems.",
  },
  {
    id: "t-decay",
    unlockLevel: 14,
    clues: ["🍂 Rot", "A rusty edge", "A soft collapse", "Time’s bite on matter"],
    instruction:
      "Enemy weakness is decay: rot, rust, mold, erosion, decomposition, crumbling.",
  },
  {
    id: "t-void",
    unlockLevel: 14,
    clues: ["🕸️ Void", "An empty chair", "A missing center", "Meaninglessness with gravity"],
    instruction:
      "Enemy weakness is the void: emptiness, nothingness, abyss, absence, null.",
  },
  {
    id: "t-cosmic",
    unlockLevel: 15,
    clues: [
      "👁️ Unease",
      "A wrong geometry",
      "A name you shouldn’t say",
      "The universe noticing you",
    ],
    instruction:
      "Enemy weakness is cosmic horror: eldritch, madness, forbidden knowledge, incomprehensible beings.",
  },
];

// --- Abilities ---
const ABILITY_POOL: EnemyAbility[] = [
  {
    id: "ab-long-weak",
    display: "📏 Long words are weaker",
    instruction:
      "If the word is long (8+ characters), reduce damage via abilityMultiplier. If not long, abilityMultiplier should be 1.",
  },
  {
    id: "ab-short-weak",
    display: "✂️ Short words are weaker",
    instruction:
      "If the word is short (<=4 letters), reduce damage via abilityMultiplier. If not short, abilityMultiplier should be 1.",
  },
  {
    id: "ab-only-nouns",
    display: "🎯 Only nouns are effective",
    instruction:
      "If the word is not a noun, reduce damage significantly via abilityMultiplier (often <0.5). If it is a noun, abilityMultiplier should be 1.",
  },
  {
    id: "ab-only-verbs",
    display: "🎯 Only verbs are effective",
    instruction:
      "If the word is not a verb, reduce damage significantly via abilityMultiplier (often <0.5). If it is a verb, abilityMultiplier should be 1.",
  },
  {
    id: "ab-proper-weak",
    display: "🚫 Proper nouns are weaker",
    instruction:
      "If the word is a proper noun, reduce damage via abilityMultiplier. Otherwise abilityMultiplier should be 1.",
  },
  {
    id: "ab-no-i",
    display: "🚫 No letter 'i'",
    instruction:
      "If the word contains the letter 'i' (case-insensitive), heavily reduce damage via abilityMultiplier (often <0.3). Otherwise abilityMultiplier should be 1.",
  },
  {
    id: "ab-no-a",
    display: "🚫 No letter 'a'",
    instruction:
      "If the word contains the letter 'a' (case-insensitive), heavily reduce damage via abilityMultiplier (often <0.3). Otherwise abilityMultiplier should be 1.",
  },
  {
    id: "ab-length-5-8",
    display: "📐 Only 5–8 letters",
    instruction:
      "If the normalized word length is outside 5..8 inclusive, reduce damage via abilityMultiplier. If inside, abilityMultiplier should be 1.",
  },
  {
    id: "ab-starts-vowel",
    display: "🅰️ Must start with a vowel",
    instruction:
      "If the normalized word does NOT start with a vowel (a,e,i,o,u), reduce damage via abilityMultiplier. If it starts with a vowel, abilityMultiplier should be 1.",
  },
  {
    id: "ab-ends-consonant",
    display: "🔚 Must end with a consonant",
    instruction:
      "If the normalized word ends with a vowel (a,e,i,o,u), reduce damage via abilityMultiplier. Otherwise abilityMultiplier should be 1.",
  },
  {
    id: "ab-double-letter",
    display: "🔁 Double letters favored",
    instruction:
      "If the word contains a doubled letter (same letter twice in a row), abilityMultiplier can be slightly >1 (up to 1.3). If not, slightly reduce (down to ~0.8).",
  },
  {
    id: "ab-rare-letters",
    display: "🃏 Rare letters favored",
    instruction:
      "If the word contains j/q/x/z, abilityMultiplier can be >1 (up to 1.4). If not, abilityMultiplier should be 1.",
  },
  {
    id: "ab-no-repeat-letter",
    display: "🧩 No repeated letters",
    instruction:
      "If the normalized word repeats any letter (e.g. has two of the same letter anywhere), reduce damage via abilityMultiplier (down to ~0.6). If all letters are unique, abilityMultiplier should be 1.",
  },
  {
    id: "ab-palindrome-bonus",
    display: "🪞 Palindromes rewarded",
    instruction:
      "If the word is a palindrome, abilityMultiplier can be >1 (up to 1.5). If not, abilityMultiplier should be 1.",
  },
];

function take<T>(arr: T[], count: number): T[] {
  return arr.slice(0, Math.min(count, arr.length));
}

function themesForLevel(level: number): EnemyTheme[] {
  return THEME_POOL.filter((t) => t.unlockLevel <= level);
}

function abilitiesForLevel(level: number): EnemyAbility[] {
  // start with 6 and unlock +1 per level up to pool size
  return take(ABILITY_POOL, Math.min(5 + level, ABILITY_POOL.length));
}

function statsForLevel(level: number): { maxHp: number; turns: number } {
  // Slightly tankier enemies, fewer turns (more pressure).
  const maxHp = Math.round(170 + Math.pow(level, 1.35) * 92);

  // Start lower and grow slower than before.
  // Level 1: 5 turns, midgame ~7, late game tops at 9.
  const turns = Math.min(9, 5 + Math.floor(level / 4));

  return { maxHp, turns };
}

export const ENEMY_LEVEL_SPECS: EnemyLevelSpec[] = Array.from({ length: 15 }, (_, i) => {
  const level = i + 1;
  return {
    level,
    themes: themesForLevel(level),
    abilities: abilitiesForLevel(level),
    stats: statsForLevel(level),
  };
});
