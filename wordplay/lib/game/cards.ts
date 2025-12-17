export type CardMultiplier = {
  id: string;
  label: string;
  /** Short text shown on the card front. */
  description: string;
  /**
   * Player-facing ability text (shown on hover).
   * Keep it short and readable.
   */
  ability: {
    display: string;
    /**
     * Evaluator instruction: how to decide if this card applies.
     * (Separate from display to allow more precise LLM instructions.)
     */
    instruction: string;
  };
  /**
   * Multiplier to apply when condition matches.
   * Use 1.0 for no change.
   */
  multiplier: number;
  /**
   * Optional flat bonus when condition matches.
   * Applied after multipliers.
   */
  bonus?: number;
};

export const POSSIBLE_CARDS: CardMultiplier[] = [
  // --- Part of speech / grammar ---
  {
    id: "verbs-plus-10",
    label: "Action Surge",
    description: "Verbs deal +10 damage",
    ability: {
      display: "If the word is a verb: +10 damage.",
      instruction:
        "Apply if the word is a verb. If applied, add bonus +10.",
    },
    multiplier: 1,
    bonus: 10,
  },
  {
    id: "nouns-x15",
    label: "Name Power",
    description: "Nouns deal x1.5",
    ability: {
      display: "If the word is a noun: x1.5 damage.",
      instruction: "Apply if the word is a noun. If applied, multiplier x1.5.",
    },
    multiplier: 1.5,
  },
  {
    id: "adjectives-x14",
    label: "Vivid وصف",
    description: "Adjectives deal x1.4",
    ability: {
      display: "If the word is an adjective: x1.4 damage.",
      instruction:
        "Apply if the word is an adjective (describes a noun). If applied, multiplier x1.4.",
    },
    multiplier: 1.4,
  },
  {
    id: "adverbs-plus-8",
    label: "Swiftly",
    description: "Adverbs deal +8 damage",
    ability: {
      display: "If the word is an adverb: +8 damage.",
      instruction: "Apply if the word is an adverb. If applied, bonus +8.",
    },
    multiplier: 1,
    bonus: 8,
  },

  // --- Length / letters ---
  {
    id: "four-letter-x14",
    label: "Compact Power",
    description: "4-letter words deal x1.4",
    ability: {
      display: "If the word has exactly 4 letters: x1.4 damage.",
      instruction:
        "Apply if the normalized word length is exactly 4 letters. If applied, multiplier x1.4.",
    },
    multiplier: 1.4,
  },
  {
    id: "five-letter-plus-6",
    label: "Quint",
    description: "5-letter words deal +6",
    ability: {
      display: "If the word has exactly 5 letters: +6 damage.",
      instruction:
        "Apply if the normalized word length is exactly 5 letters. If applied, bonus +6.",
    },
    multiplier: 1,
    bonus: 6,
  },
  {
    id: "seven-letter-x16",
    label: "Lucky Seven",
    description: "7-letter words deal x1.6",
    ability: {
      display: "If the word has exactly 7 letters: x1.6 damage.",
      instruction:
        "Apply if the normalized word length is exactly 7 letters. If applied, multiplier x1.6.",
    },
    multiplier: 1.6,
  },
  {
    id: "starts-with-s-x13",
    label: "S-Starter",
    description: "Words starting with S deal x1.3",
    ability: {
      display: "If the word starts with 's': x1.3 damage.",
      instruction:
        "Apply if the normalized word starts with the letter 's'. If applied, multiplier x1.3.",
    },
    multiplier: 1.3,
  },
  {
    id: "double-letter-plus-12",
    label: "Echo",
    description: "Double letters +12",
    ability: {
      display: "If the word contains a double letter (like 'oo'): +12 damage.",
      instruction:
        "Apply if the word contains a doubled letter (same letter twice in a row). If applied, bonus +12.",
    },
    multiplier: 1,
    bonus: 12,
  },

  // --- Categories / pop culture ---
  {
    id: "pokemon-x10",
    label: "Pokédex",
    description: "Pokémon names deal x10",
    ability: {
      display: "If the word is a Pokémon name: x10 damage.",
      instruction:
        "Apply if the word is (or is very likely intended to be) a Pokémon name. If applied, multiplier x10.",
    },
    multiplier: 10,
  },
  {
    id: "food-x8",
    label: "Snack Attack",
    description: "Food words deal x8",
    ability: {
      display: "If the word is food-related: x8 damage.",
      instruction:
        "Apply if the word is food-related (dish, ingredient, cooking term). If applied, multiplier x8.",
    },
    multiplier: 8,
  },
  {
    id: "animal-x2",
    label: "Menagerie",
    description: "Animals deal x2",
    ability: {
      display: "If the word is an animal: x2 damage.",
      instruction:
        "Apply if the word refers to an animal/creature/species. If applied, multiplier x2.",
    },
    multiplier: 2,
  },
  {
    id: "mythology-x3",
    label: "Legend Lore",
    description: "Myths deal x3",
    ability: {
      display: "If the word is from mythology: x3 damage.",
      instruction:
        "Apply if the word is a mythological figure, monster, or concept. If applied, multiplier x3.",
    },
    multiplier: 3,
  },
  {
    id: "science-plus-15",
    label: "Peer Review",
    description: "Science words +15",
    ability: {
      display: "If the word is scientific/technical: +15 damage.",
      instruction:
        "Apply if the word is a scientific/technical term. If applied, bonus +15.",
    },
    multiplier: 1,
    bonus: 15,
  },
  {
    id: "music-x18",
    label: "Resonance",
    description: "Music words x1.8",
    ability: {
      display: "If the word is music-related: x1.8 damage.",
      instruction:
        "Apply if the word is music-related (instrument, genre, theory). If applied, multiplier x1.8.",
    },
    multiplier: 1.8,
  },
  {
    id: "sports-x17",
    label: "Home Field",
    description: "Sports words x1.7",
    ability: {
      display: "If the word is sports-related: x1.7 damage.",
      instruction:
        "Apply if the word is related to sports/athletics. If applied, multiplier x1.7.",
    },
    multiplier: 1.7,
  },

  // --- Elemental leanings ---
  {
    id: "fire-x2",
    label: "Kindling",
    description: "Fire words x2",
    ability: {
      display: "If the word is fire-related: x2 damage.",
      instruction:
        "Apply if the word is fire-related (flame, burn, ember, heat). If applied, multiplier x2.",
    },
    multiplier: 2,
  },
  {
    id: "water-x2",
    label: "Undertow",
    description: "Water words x2",
    ability: {
      display: "If the word is water-related: x2 damage.",
      instruction:
        "Apply if the word is water-related (ocean, river, rain, flood). If applied, multiplier x2.",
    },
    multiplier: 2,
  },
  {
    id: "ice-x2",
    label: "Permafrost",
    description: "Ice words x2",
    ability: {
      display: "If the word is ice-related: x2 damage.",
      instruction:
        "Apply if the word is ice/snow/frost-related. If applied, multiplier x2.",
    },
    multiplier: 2,
  },
  {
    id: "electric-x2",
    label: "Arc",
    description: "Electric words x2",
    ability: {
      display: "If the word is electricity-related: x2 damage.",
      instruction:
        "Apply if the word is electricity-related. If applied, multiplier x2.",
    },
    multiplier: 2,
  },

  // --- Risk/reward ---
  {
    id: "all-in-x22",
    label: "All In",
    description: "If base >= 70, x2.2",
    ability: {
      display: "If base score is 70+: x2.2 damage.",
      instruction:
        "Apply if baseScore is 70 or higher. If applied, multiplier x2.2.",
    },
    multiplier: 2.2,
  },
  {
    id: "scrabble-ish-plus-20",
    label: "Rare Letters",
    description: "Contains J/Q/X/Z +20",
    ability: {
      display: "If the word contains J/Q/X/Z: +20 damage.",
      instruction:
        "Apply if the word contains any of the letters j,q,x,z. If applied, bonus +20.",
    },
    multiplier: 1,
    bonus: 20,
  },
  {
    id: "vowel-less-x25",
    label: "Consonant Crush",
    description: "No vowels x2.5",
    ability: {
      display: "If the word has no vowels: x2.5 damage.",
      instruction:
        "Apply if the word contains no a/e/i/o/u (y can count as consonant). If applied, multiplier x2.5.",
    },
    multiplier: 2.5,
  },
  {
    id: "palindrome-x2",
    label: "Mirror",
    description: "Palindromes x2",
    ability: {
      display: "If the word is a palindrome: x2 damage.",
      instruction:
        "Apply if the normalized word is a palindrome. If applied, multiplier x2.",
    },
    multiplier: 2,
  },

  // --- LLM-only / fuzzy / creative checks ---
  {
    id: "fits-in-pocket-plus-18",
    label: "Pocketable",
    description: "If it fits in a pocket: +18",
    ability: {
      display: "If the thing could reasonably fit in a pocket: +18 damage.",
      instruction:
        "Apply if the word refers to something that could reasonably fit in a typical pocket. If applied, bonus +18.",
    },
    multiplier: 1,
    bonus: 18,
  },
  {
    id: "is-cute-x16",
    label: "Aww Factor",
    description: "Cute things x1.6",
    ability: {
      display: "If it’s cute: x1.6 damage.",
      instruction:
        "Apply if the word refers to something commonly considered cute/adorable. If applied, multiplier x1.6.",
    },
    multiplier: 1.6,
  },
  {
    id: "household-object-x14",
    label: "Domestic",
    description: "Household objects x1.4",
    ability: {
      display: "If it’s a household object: x1.4 damage.",
      instruction:
        "Apply if the word refers to a common household object/appliance/furniture item. If applied, multiplier x1.4.",
    },
    multiplier: 1.4,
  },
  {
    id: "not-dictionary-word-x22",
    label: "Neologism",
    description: "Not a dictionary word x2.2",
    ability: {
      display: "If it’s likely NOT a standard dictionary word: x2.2 damage.",
      instruction:
        "Apply if the word is likely not a standard dictionary word (e.g. invented, gibberish, playful neologism) while still being plausible in context. Do NOT apply for common misspellings of real words. If applied, multiplier x2.2.",
    },
    multiplier: 2.2,
  },
  {
    id: "smells-good-plus-12",
    label: "Scent Memory",
    description: "If it smells good: +12",
    ability: {
      display: "If the thing is associated with a pleasant smell: +12 damage.",
      instruction:
        "Apply if the word refers to something commonly associated with a pleasant smell (e.g. flowers, baked goods, perfume). If applied, bonus +12.",
    },
    multiplier: 1,
    bonus: 12,
  },
  {
    id: "would-hurt-to-step-on-plus-15",
    label: "Lego Test",
    description: "Painful to step on +15",
    ability: {
      display: "If it would hurt to step on: +15 damage.",
      instruction:
        "Apply if the word refers to an object that would likely hurt to step on barefoot (sharp or hard small object). If applied, bonus +15.",
    },
    multiplier: 1,
    bonus: 15,
  },
  {
    id: "can-be-stolen-x15",
    label: "Sticky Fingers",
    description: "Easy to steal x1.5",
    ability: {
      display: "If it’s something people might steal: x1.5 damage.",
      instruction:
        "Apply if the word refers to something small/valuable/tempting that people might steal (shoplift, pocket, swipe). If applied, multiplier x1.5.",
    },
    multiplier: 1.5,
  },
  {
    id: "makes-you-nostalgic-plus-10",
    label: "Nostalgia",
    description: "Nostalgic +10",
    ability: {
      display: "If it evokes nostalgia: +10 damage.",
      instruction:
        "Apply if the word is commonly nostalgic (childhood things, old tech, retro media) or is likely to evoke nostalgia for many people. If applied, bonus +10.",
    },
    multiplier: 1,
    bonus: 10,
  },

  // --- Weird physical/world knowledge ---
  {
    id: "is-fragile-x13",
    label: "Fragile",
    description: "Fragile things x1.3",
    ability: {
      display: "If it’s fragile/breakable: x1.3 damage.",
      instruction:
        "Apply if the word refers to something fragile/breakable (glass, porcelain, delicate items). If applied, multiplier x1.3.",
    },
    multiplier: 1.3,
  },
  {
    id: "is-dangerous-x17",
    label: "Hazard",
    description: "Dangerous things x1.7",
    ability: {
      display: "If it’s dangerous: x1.7 damage.",
      instruction:
        "Apply if the word refers to something dangerous/harmful/threatening. If applied, multiplier x1.7.",
    },
    multiplier: 1.7,
  },
  {
    id: "is-comforting-plus-9",
    label: "Comfort",
    description: "Comforting +9",
    ability: {
      display: "If it’s comforting: +9 damage.",
      instruction:
        "Apply if the word refers to something comforting/soothing/safe. If applied, bonus +9.",
    },
    multiplier: 1,
    bonus: 9,
  },
  {
    id: "is-weapon-x18",
    label: "Arsenal",
    description: "Weapons x1.8",
    ability: {
      display: "If the word is a weapon: x1.8 damage.",
      instruction:
        "Apply if the word refers to a weapon or tool designed to harm in combat. If applied, multiplier x1.8.",
    },
    multiplier: 1.8,
  },

  // --- Language / meta ---
  {
    id: "is-slang-plus-8",
    label: "Slang",
    description: "Slang +8",
    ability: {
      display: "If it’s slang/informal: +8 damage.",
      instruction:
        "Apply if the word is slang, informal internet language, or colloquial shorthand (not formal dictionary usage). If applied, bonus +8.",
    },
    multiplier: 1,
    bonus: 8,
  },
  {
    id: "sounds-like-onoma-x14",
    label: "Onomatopoeia",
    description: "Sound words x1.4",
    ability: {
      display: "If it’s an onomatopoeia: x1.4 damage.",
      instruction:
        "Apply if the word is an onomatopoeia (a word that imitates a sound, like 'buzz' or 'bang'). If applied, multiplier x1.4.",
    },
    multiplier: 1.4,
  },
  {
    id: "is-brand-name-x16",
    label: "Brand Aura",
    description: "Brand names x1.6",
    ability: {
      display: "If it’s a brand name: x1.6 damage.",
      instruction:
        "Apply if the word is a brand/trademark/company/product line name. If applied, multiplier x1.6.",
    },
    multiplier: 1.6,
  },

  // --- High risk / high reward ---
  {
    id: "is-abstract-concept-x19",
    label: "Concept",
    description: "Abstract concepts x1.9",
    ability: {
      display: "If it’s an abstract concept: x1.9 damage.",
      instruction:
        "Apply if the word refers to an abstract concept (not a physical object): ideas like justice, fear, entropy, love. If applied, multiplier x1.9.",
    },
    multiplier: 1.9,
  },
  {
    id: "is-taboo-x2",
    label: "Taboo",
    description: "Taboo topics x2",
    ability: {
      display: "If it’s taboo/forbidden: x2 damage.",
      instruction:
        "Apply if the word refers to taboo/forbidden topics in a general sense (e.g. profanity, illegal acts, disturbing concepts) while remaining within normal conversation safety. If applied, multiplier x2.",
    },
    multiplier: 2,
  },
];
