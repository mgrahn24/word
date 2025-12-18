/*
Quick local harness for /api/generate-card

Usage:
  cd wordplay
  node scripts/test-generate-card.mjs

Requires:
  - next dev running on http://localhost:3000
  - env vars configured (.env.local) for AI provider
*/

const endpoint =
  process.env.CARD_URL ?? "http://localhost:3000/api/generate-card";

const payload = {
  word: process.env.WORD ?? "tsunami",
  cost: Number(process.env.COST ?? 2),
  color: process.env.COLOR ?? "silent",
  rarity: process.env.RARITY ?? "uncommon",
};

console.log("POST", endpoint);
console.log("Payload:", payload);

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
