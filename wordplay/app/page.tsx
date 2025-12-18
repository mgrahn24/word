"use client";

import { useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  StsCardColorSchema,
  StsRaritySchema,
  type GeneratedCard,
  type StsCardColor,
} from "@/lib/cardgen/types";

function formatColor(color: StsCardColor) {
  switch (color) {
    case "ironclad":
      return "Ironclad";
    case "silent":
      return "Silent";
    case "defect":
      return "Defect";
    case "watcher":
      return "Watcher";
    case "colorless":
      return "Colorless";
  }
}

function formatType(t: GeneratedCard["type"]) {
  switch (t) {
    case "attack":
      return "Attack";
    case "skill":
      return "Skill";
    case "power":
      return "Power";
    case "status":
      return "Status";
    case "curse":
      return "Curse";
  }
}

function formatTarget(t: GeneratedCard["targetHint"]) {
  switch (t) {
    case "self":
      return "Self";
    case "single_enemy":
      return "Single enemy";
    case "all_enemies":
      return "All enemies";
    case "random_enemy":
      return "Random enemy";
  }
}

function formatRarity(r: GeneratedCard["rarity"]) {
  switch (r) {
    case "starter":
      return "Starter";
    case "common":
      return "Common";
    case "uncommon":
      return "Uncommon";
    case "rare":
      return "Rare";
  }
}

export default function Home() {
  const [word, setWord] = useState("");
  const [cost, setCost] = useState<number>(1);
  const [color, setColor] = useState<StsCardColor>("ironclad");
  const [rarity, setRarity] = useState<GeneratedCard["rarity"]>("common");

  const inputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<GeneratedCard | null>(null);

  const canSubmit = word.trim().length > 0 && cost >= 0 && cost <= 3;

  const keywordBadges = useMemo(() => {
    if (!card?.keywords) return [];
    const out: string[] = [];
    if (card.keywords.exhaust) out.push("Exhaust");
    if (card.keywords.ethereal) out.push("Ethereal");
    if (card.keywords.innate) out.push("Innate");
    if (card.keywords.retain) out.push("Retain");
    return out;
  }, [card]);

  async function generate() {
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setCard(null);

    try {
      const res = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: word.trim(),
          cost,
          color,
          rarity,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as GeneratedCard;
      setCard(data);
      setWord("");
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-2 py-4 sm:p-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Card Generator</h1>
            <p className="text-sm text-muted-foreground">
              Enter a theme word + cost. I’ll generate a finite, structured Slay the Spire-style card.
            </p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Generate</CardTitle>
            <CardDescription>
              The backend returns a structured JSON representation of the card + its effects.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <div className="mb-1 text-sm font-medium">Theme word</div>
                <Input
                  ref={inputRef}
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder='e.g. "tsunami", "dagger", "regret"'
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) generate();
                  }}
                />
              </div>

              <div>
                <div className="mb-1 text-sm font-medium">Cost (0–3)</div>
                <Input
                  value={String(cost)}
                  inputMode="numeric"
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n)) setCost(n);
                  }}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <div className="mb-1 text-sm font-medium">Color</div>
                <div className="flex flex-wrap gap-2">
                  {StsCardColorSchema.options.map((c) => (
                    <Button
                      key={c}
                      type="button"
                      size="sm"
                      variant={c === color ? "default" : "outline"}
                      onClick={() => setColor(c)}
                    >
                      {formatColor(c)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="mb-1 text-sm font-medium">Rarity</div>
                <div className="flex flex-wrap gap-2">
                  {StsRaritySchema.options.map((r) => (
                    <Button
                      key={r}
                      type="button"
                      size="sm"
                      variant={r === rarity ? "default" : "outline"}
                      onClick={() => setRarity(r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={generate} disabled={!canSubmit || loading}>
                {loading ? "Generating..." : "Generate card"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCard(null);
                  setError(null);
                  setWord("");
                  setCost(1);
                  setColor("ironclad");
                  setRarity("common");
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
              >
                Reset
              </Button>
            </div>

            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
                <div className="font-medium">Error</div>
                <div className="whitespace-pre-wrap break-words opacity-90">{error}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {card ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-xl">{card.name}</CardTitle>
                  <CardDescription>
                    <span className="font-medium">{formatColor(card.color)}</span> · {formatType(card.type)} · {formatRarity(card.rarity)} · {formatTarget(card.targetHint)}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Cost: {card.cost}</Badge>
                  {keywordBadges.map((k) => (
                    <Badge key={k} variant="outline">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              <div className="text-sm text-muted-foreground">{card.concept}</div>

              <Separator />

              <div className="rounded-md border bg-muted/20 p-3 text-sm">
                <div className="mb-2 font-medium">Card text</div>
                <div className="flex flex-col gap-1">
                  {card.text.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border p-3 text-sm">
                <div className="mb-2 font-medium">Effects (structured)</div>
                <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
{JSON.stringify(card.effects, null, 2)}
                </pre>
              </div>

              <div className="rounded-md border border-dashed p-3 text-sm">
                <div className="mb-1 font-medium">Balance notes</div>
                <div className="text-muted-foreground">{card.balanceNotes}</div>
              </div>

              <div className="rounded-md border p-3 text-sm">
                <div className="mb-2 font-medium">Full JSON</div>
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
{JSON.stringify(card, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
