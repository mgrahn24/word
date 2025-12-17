"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { POSSIBLE_CARDS, type CardMultiplier } from "@/lib/game/cards";
import { ENEMY_LEVEL_SPECS } from "@/lib/game/enemies";
import type { EvaluateWordResponse } from "@/lib/game/types";
import { ScoreReveal } from "@/components/score-reveal";
import {
  applyDamage,
  startGame,
  startNextLevel,
  type GameState,
} from "@/lib/game/state";

function pickRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length > 0 && out.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]!);
    copy.splice(idx, 1);
  }
  return out;
}

export default function Home() {
  // IMPORTANT: Start with null so the server render is deterministic.
  // We then initialize the run client-side in useEffect to avoid hydration mismatches
  // from Math.random() usage in enemy/minor-weakness selection.
  const [game, setGame] = useState<GameState | null>(null);

  const [word, setWord] = useState("");
  const wordInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [lastEval, setLastEval] = useState<EvaluateWordResponse | null>(null);
  // When set, we have an eval result that is currently being animated.
  // We only apply the damage to the enemy once the animation finishes.
  const [pendingTurn, setPendingTurn] = useState<EvaluateWordResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFullCards, setShowFullCards] = useState(false);

  const MAX_CARDS = 3;
  const [pendingCard, setPendingCard] = useState<CardMultiplier | null>(null);

  useEffect(() => {
    setGame(startGame());
  }, []);

  // Auto-focus the input whenever we're in battle.
  useEffect(() => {
    if (game?.phase !== "battle") return;
    // Small timeout helps when the DOM just transitioned between phases.
    const t = setTimeout(() => wordInputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [game?.phase]);

  const enemy = game?.enemy;

  const cardChoices = useMemo(() => {
    if (!game) return [];

    // Offer 3 random cards that the player doesn't already have
    const owned = new Set(game.cards.map((c) => c.id));
    const available = POSSIBLE_CARDS.filter((c) => !owned.has(c.id));
    return pickRandom(available, 3);
  }, [game]);

  const enemyHpPct =
    game && enemy ? Math.round((game.enemyHp / enemy.maxHp) * 100) : 0;

  function commitTurnResult(result: EvaluateWordResponse) {
    // Apply damage only after the ScoreReveal animation completes.
    setGame((prev) => {
      if (!prev) return prev;

      const next = applyDamage(
        { ...prev, usedWords: [...prev.usedWords, result.normalizedWord] },
        result.finalScore
      );

      const dead = next.enemyHp <= 0;
      const outOfTurns = next.turnsLeft <= 0;

      // If enemy defeated => card phase (unless it was last level)
      if (dead) {
        const isLastLevel = next.levelIndex >= ENEMY_LEVEL_SPECS.length - 1;
        return { ...next, phase: isLastLevel ? "victory" : "card" };
      }

      // If out of turns => defeat
      if (outOfTurns) {
        return { ...next, phase: "defeat" };
      }

      return next;
    });

    setPendingTurn(null);
    // Keep input focused for rapid turns (battle only; harmless otherwise).
    setTimeout(() => wordInputRef.current?.focus(), 0);
  }

  async function submitTurn() {
    if (!game || !enemy) return;
    if (pendingTurn) return;

    setError(null);
    setLastEval(null);
    setPendingTurn(null);

    const trimmed = word.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: trimmed,
          enemy,
          cards: game.cards,
          usedWords: game.usedWords,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as EvaluateWordResponse;
      setLastEval(data);
      setPendingTurn(data);

      setWord("");
      setShowDetails(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function pickCard(card: CardMultiplier) {
    // If deck is full, enter swap flow
    if (game && game.cards.length >= MAX_CARDS) {
      setPendingCard(card);
      return;
    }

    setGame((prev) => {
      if (!prev) return prev;

      return startNextLevel({
        ...prev,
        cards: [...prev.cards, card],
      });
    });
    setLastEval(null);
  }

  function swapCard(replaceId: string) {
    if (!pendingCard) return;

    setGame((prev) => {
      if (!prev) return prev;

      const nextCards = prev.cards.map((c) => (c.id === replaceId ? pendingCard : c));
      return startNextLevel({
        ...prev,
        cards: nextCards,
      });
    });

    setPendingCard(null);
    setLastEval(null);
  }

  function resetRun() {
    setGame(startGame());
    setLastEval(null);
    setPendingTurn(null);
    setError(null);
    setWord("");
    setShowDetails(false);
    setPendingCard(null);
  }

  if (!game || !enemy) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
          <header className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                WordGame Prototype
              </h1>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-2 py-4 sm:p-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              WordGame Prototype
            </h1>
          </div>
          <Button variant="outline" onClick={resetRun}>
            Reset run
          </Button>
        </header>

        {game.phase === "intro" ? (
          <Card>
            <CardHeader>
              <CardTitle>How to play</CardTitle>
              <CardDescription>A quick intro before you start.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>You get a limited number of turns to defeat the enemy.</li>
                <li>
                  Each turn you enter <span className="font-medium">one word</span>.
                </li>
                <li>
                  Your <span className="font-medium">base damage (0–100)</span> depends
                  heavily on matching the enemy weakness, plus inherent power and
                  creativity.
                </li>
                <li>
                  Be creative and varied! Don’t reuse words.
                </li>
              </ul>
              <Button
                onClick={() =>
                  setGame((prev) => (prev ? { ...prev, phase: "battle" } : prev))
                }
              >
                Start
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Enemy: {enemy.name}</span>
              <Badge variant="secondary">Phase: {game.phase}</Badge>
            </CardTitle>
            <CardDescription>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Weakness Clue</Badge>
                <span className="font-medium">{enemy.weakness.display}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Minor Weakness</Badge>
                <span className="font-medium">{enemy.minorWeakness.display}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="destructive">Ability</Badge>
                <span className="font-medium">{enemy.ability.display}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  HP: {game.enemyHp} / {enemy.maxHp}
                </span>
                <span>Turns left: {game.turnsLeft}</span>
              </div>
              <Progress value={enemyHpPct} />
            </div>

            <Separator />

            {game.phase === "battle" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                  <span className="font-medium">Used:</span>
                  {game.usedWords.length === 0 ? (
                    <span className="text-muted-foreground">None yet</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {game.usedWords.slice(-20).map((w, idx) => (
                        <span
                          key={`${w}-${idx}`}
                          className="rounded-md border bg-background/60 px-2 py-0.5 text-xs"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    (exact repeats deal 0)
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    ref={wordInputRef}
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Type a single word (e.g. tsunami)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !loading && !pendingTurn) submitTurn();
                    }}
                    disabled={loading || Boolean(pendingTurn)}
                  />
                  <Button
                    onClick={submitTurn}
                    disabled={loading || Boolean(pendingTurn) || !word.trim()}
                    className="shrink-0"
                  >
                    {loading
                      ? "Evaluating..."
                      : pendingTurn
                        ? "Resolving..."
                        : "Attack"}
                  </Button>
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
                    <div className="font-medium">Error</div>
                    <div className="whitespace-pre-wrap break-words opacity-90">{error}</div>
                  </div>
                )}

                {lastEval ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Damage</CardTitle>
                      <CardDescription>
                        Word: <span className="font-medium">{lastEval.normalizedWord}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <ScoreReveal
                        eval={lastEval}
                        onComplete={() => {
                          // Only commit if this is the currently pending turn.
                          if (!pendingTurn) return;
                          if (pendingTurn !== lastEval) return;
                          commitTurnResult(lastEval);
                        }}
                      />

                      <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="w-fit">
                            {showDetails ? "Hide details" : "Show details"}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <div className="text-sm">
                            <div className="mb-2 font-medium">Multipliers / bonuses</div>
                            <div className="flex flex-col gap-2">
                              {lastEval.multipliers.map((m) => (
                                <div
                                  key={m.id}
                                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                                >
                                  <div>
                                    <div className="font-medium">
                                      {m.label}{" "}
                                      {!m.applied && (
                                        <span className="text-muted-foreground">(not applied)</span>
                                      )}
                                    </div>
                                    <div className="whitespace-pre-wrap text-muted-foreground">{m.reason}</div>
                                  </div>
                                  <div className="text-right tabular-nums">
                                    {typeof m.multiplier === "number" ? (
                                      <div>x{m.multiplier.toFixed(2)}</div>
                                    ) : null}
                                    {typeof m.bonus === "number" ? <div>+{m.bonus}</div> : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator className="my-3" />

                          <div className="text-sm">
                            {lastEval.tags.partOfSpeech ? (
                              <div>POS: {lastEval.tags.partOfSpeech}</div>
                            ) : null}
                            {lastEval.tags.categories.length ? (
                              <div>Tags: {lastEval.tags.categories.join(", ")}</div>
                            ) : null}
                          </div>

                          <Separator className="my-3" />
                          <div className="text-sm whitespace-pre-wrap">
                            <span className="font-medium">Explanation:</span> {lastEval.explanation}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Cards should be visible on mobile; do not rely on hover tooltips. */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Cards: {game.cards.length}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullCards((s) => !s)}
                    >
                      {showFullCards ? "Compact" : "Details"}
                    </Button>
                  </div>

                  {game.cards.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No cards yet.</div>
                  ) : showFullCards ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {game.cards.map((c) => (
                        <Card key={c.id} className="border-dashed">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{c.label}</CardTitle>
                            <CardDescription>{c.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground">
                            <div className="font-medium text-foreground">Ability</div>
                            <div>{c.ability.display}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {game.cards.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg border bg-muted/20 px-3 py-2"
                        >
                          <div className="text-sm font-semibold">{c.label}</div>
                          <div className="text-xs text-muted-foreground">{c.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {game.phase === "card" && (
              <div className="flex flex-col gap-3">
                <div className="text-sm text-muted-foreground">
                  {game.cards.length >= MAX_CARDS
                    ? "Enemy defeated! Your deck is full — pick a card, then choose one to replace."
                    : "Enemy defeated! Pick 1 card to add to your deck."}
                </div>

                {lastEval ? (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Finishing blow</CardTitle>
                      <CardDescription>
                        <span className="font-medium">{lastEval.normalizedWord}</span> dealt{" "}
                        <span className="font-medium">{lastEval.finalScore}</span> damage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <ScoreReveal eval={lastEval} animate={false} />

                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="w-fit">
                            Show details
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <div className="text-sm">
                            <div className="mb-2 font-medium">Multipliers / bonuses</div>
                            <div className="flex flex-col gap-2">
                              {lastEval.multipliers.map((m) => (
                                <div
                                  key={m.id}
                                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                                >
                                  <div>
                                    <div className="font-medium">{m.label}</div>
                                    <div className="whitespace-pre-wrap text-muted-foreground">{m.reason}</div>
                                  </div>
                                  <div className="text-right tabular-nums">
                                    {typeof m.multiplier === "number" ? (
                                      <div>x{m.multiplier.toFixed(2)}</div>
                                    ) : null}
                                    {typeof m.bonus === "number" ? <div>+{m.bonus}</div> : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator className="my-3" />
                          <div className="text-sm whitespace-pre-wrap">
                            <span className="font-medium">Explanation:</span> {lastEval.explanation}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                ) : null}

                <TooltipProvider>
                  <div className="grid gap-3 md:grid-cols-3">
                    {cardChoices.map((c) => (
                      <Tooltip key={c.id}>
                        <TooltipTrigger asChild>
                          <Card
                            className={
                              "group flex cursor-pointer flex-col transition-all hover:-translate-y-0.5 hover:shadow-md " +
                              (pendingCard?.id === c.id ? "ring-2 ring-primary" : "")
                            }
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{c.label}</CardTitle>
                              <CardDescription className="text-base">{c.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto flex flex-col gap-2">
                              <div className="text-sm">
                                {c.multiplier !== 1 ? (
                                  <span className="font-medium">x{c.multiplier}</span>
                                ) : null}
                                {typeof c.bonus === "number" ? (
                                  <span>
                                    {c.multiplier !== 1 ? " · " : ""}
                                    <span className="font-medium">+{c.bonus}</span>
                                  </span>
                                ) : null}
                              </div>
                              <Button onClick={() => pickCard(c)} className="mt-1">
                                {game.cards.length >= MAX_CARDS ? "Pick" : "Choose"}
                              </Button>
                            </CardContent>
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="text-sm font-medium">Ability</div>
                          <div className="text-sm text-muted-foreground">{c.ability.display}</div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>

                {pendingCard ? (
                  <Card className="border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Swap a card</CardTitle>
                      <CardDescription>
                        You picked <span className="font-medium">{pendingCard.label}</span>. Choose an
                        existing card to replace.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        {game.cards.map((c) => (
                          <TooltipProvider key={c.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => swapCard(c.id)}
                                >
                                  Replace {c.label}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="text-sm font-medium">{c.label}</div>
                                <div className="text-sm text-muted-foreground">{c.ability.display}</div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>

                      <Button variant="ghost" size="sm" onClick={() => setPendingCard(null)}>
                        Cancel
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            )}

            {game.phase === "victory" && (
              <div className="flex flex-col gap-3">
                <div className="text-lg font-semibold">Victory!</div>

                {lastEval ? (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Final blow</CardTitle>
                      <CardDescription>
                        <span className="font-medium">{lastEval.normalizedWord}</span> dealt{" "}
                        <span className="font-medium">{lastEval.finalScore}</span> damage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <ScoreReveal eval={lastEval} animate={false} />

                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="w-fit">
                            Show details
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <div className="text-sm">
                            <div className="mb-2 font-medium">Multipliers / bonuses</div>
                            <div className="flex flex-col gap-2">
                              {lastEval.multipliers.map((m) => (
                                <div
                                  key={m.id}
                                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                                >
                                  <div>
                                    <div className="font-medium">{m.label}</div>
                                    <div className="whitespace-pre-wrap text-muted-foreground">{m.reason}</div>
                                  </div>
                                  <div className="text-right tabular-nums">
                                    {typeof m.multiplier === "number" ? (
                                      <div>x{m.multiplier.toFixed(2)}</div>
                                    ) : null}
                                    {typeof m.bonus === "number" ? <div>+{m.bonus}</div> : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator className="my-3" />
                          <div className="text-sm whitespace-pre-wrap">
                            <span className="font-medium">Explanation:</span> {lastEval.explanation}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                ) : null}

                <div className="text-sm text-muted-foreground">
                  You cleared the prototype run. Reset to play again.
                </div>
                <Button onClick={resetRun}>Play again</Button>
              </div>
            )}

            {game.phase === "defeat" && (
              <div className="flex flex-col gap-3">
                <div className="text-lg font-semibold">Defeat</div>
                <div className="text-sm text-muted-foreground">
                  You ran out of turns before defeating {enemy.name}.
                </div>
                <Button onClick={resetRun}>Try again</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
