/*
Quick local harness for /api/evaluate

Usage:
  cd wordplay
  node scripts/test-evaluate.mjs

Requires:
  - next dev running on http://localhost:3000
  - env vars configured (.env.local) for AI provider
*/

const endpoint = process.env.EVAL_URL ?? "http://localhost:3000/api/evaluate";

const payload = {
  word: "burn",
  enemy: {
    id: "test",
    name: "🔥 Fire 1Foe",
    maxHp: 140,
    turns: 6,
    weakness: {
      display: "🔥 Fire",
      instruction: "Enemy weakness is fire.",
    },
    minorWeakness: {
      id: "minor-action",
      display: "🏃 Actions",
      instruction:
        "Minor weakness is actions: movement, verbs, doing/causing/impactful actions.",
    },
    ability: {
      display: "🎯 Only verbs are effective",
      instruction:
        "If the word is not a verb, reduce damage significantly via abilityMultiplier (often <0.5). If it is a verb, abilityMultiplier should be 1.",
    },
  },
  cards: [],
  usedWords: [],
};

console.log("POST", endpoint);

const res = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
});

const text = await res.text();

console.log("Status:", res.status);

try {
  const json = JSON.parse(text);
  console.dir(json, { depth: null });
} catch {
  console.log(text);
}
