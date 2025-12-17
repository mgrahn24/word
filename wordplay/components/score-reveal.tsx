"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { EvaluateWordResponse } from "@/lib/game/types";

type Step =
  | { kind: "base"; label: string; value: number; colorClass: string }
  | { kind: "mult"; label: string; multiplier: number; colorClass: string }
  | { kind: "bonus"; label: string; bonus: number; colorClass: string };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatNumber(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

function compactLabel(label: string) {
  // Keep pills readable on small screens.
  const out = label.trim();
  if (out.length <= 14) return out;
  return out.slice(0, 13) + "…";
}

function scoreSizeClass(score: number) {
  // Balatro-ish: scale up quickly for small numbers, then taper
  // (mobile: keep one step smaller to avoid horizontal squeeze)
  const s = clamp(Math.log10(score + 10), 1, 4.2);
  if (s < 1.4) return "text-3xl sm:text-4xl md:text-5xl";
  if (s < 2.0) return "text-4xl sm:text-5xl md:text-6xl";
  if (s < 2.6) return "text-5xl sm:text-6xl md:text-7xl";
  if (s < 3.2) return "text-6xl sm:text-7xl md:text-8xl";
  return "text-7xl sm:text-8xl md:text-9xl";
}

export function ScoreReveal(props: {
  eval: EvaluateWordResponse;
  /**
   * If true, plays the animation from scratch when eval changes.
   * If false, shows the final score immediately.
   */
  animate?: boolean;
  /**
   * Called once when the reveal has finished (or immediately if animate=false).
   */
  onComplete?: () => void;
}) {
  const animate = props.animate ?? true;

  // Keep callback stable for RAF/timers.
  const onCompleteRef = useRef(props.onComplete);
  useEffect(() => {
    onCompleteRef.current = props.onComplete;
  }, [props.onComplete]);

  const didCallCompleteRef = useRef(false);

  const steps = useMemo<Step[]>(() => {
    const out: Step[] = [];

    out.push({
      kind: "base",
      label: "BASE",
      value: props.eval.baseScore,
      colorClass: "text-zinc-100",
    });

    for (const m of props.eval.multipliers) {
      if (!m.applied) continue;

      // Hide no-op effects.
      const multIsNoOp =
        typeof m.multiplier === "number" && Math.abs(m.multiplier - 1) < 0.0001;
      const bonusIsNoOp = typeof m.bonus === "number" && m.bonus === 0;

      if (typeof m.multiplier === "number" && !multIsNoOp) {
        out.push({
          kind: "mult",
          label: compactLabel(m.label.toUpperCase()),
          multiplier: m.multiplier,
          colorClass:
            m.id === "main-weakness"
              ? "text-orange-300"
              : m.id === "ability"
                ? "text-purple-300"
                : m.id.startsWith("minor-")
                  ? "text-emerald-300"
                  : "text-cyan-300",
        });
      }

      if (typeof m.bonus === "number" && !bonusIsNoOp) {
        out.push({
          kind: "bonus",
          label: compactLabel(`${m.label.toUpperCase()} BONUS`),
          bonus: m.bonus,
          colorClass: "text-yellow-300",
        });
      }
    }

    return out;
  }, [props.eval]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [displayScore, setDisplayScore] = useState(props.eval.baseScore);
  const [displayMult, setDisplayMult] = useState(1);
  const [displayBonus, setDisplayBonus] = useState(0);
  const [popKey, setPopKey] = useState(0);

  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const finalScore = props.eval.finalScore;

  // Compute true progressive score for a given step index.
  const progress = useMemo(() => {
    let base = props.eval.baseScore;
    let mult = 1;
    let bonus = 0;
    const checkpoints: Array<{ base: number; mult: number; bonus: number; score: number }> = [];

    for (const step of steps) {
      if (step.kind === "base") {
        base = step.value;
      } else if (step.kind === "mult") {
        mult *= step.multiplier;
      } else if (step.kind === "bonus") {
        bonus += step.bonus;
      }
      const score = Math.max(0, Math.round(base * mult + bonus));
      checkpoints.push({ base, mult, bonus, score });
    }

    return checkpoints;
  }, [props.eval.baseScore, steps]);

  // Restart animation on eval change
  useEffect(() => {
    didCallCompleteRef.current = false;

    if (!animate) {
      setActiveIndex(steps.length - 1);
      setDisplayScore(finalScore);
      setDisplayMult(props.eval.totalMultiplier);
      setDisplayBonus(props.eval.totalBonus);

      if (!didCallCompleteRef.current) {
        didCallCompleteRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    setActiveIndex(0);
    setDisplayScore(props.eval.baseScore);
    setDisplayMult(1);
    setDisplayBonus(0);
    setPopKey((k) => k + 1);
  }, [animate, finalScore, props.eval.baseScore, props.eval.totalBonus, props.eval.totalMultiplier, steps.length]);

  // Animate step-by-step
  useEffect(() => {
    if (!animate) return;
    if (steps.length === 0) return;
    if (activeIndex >= steps.length - 1) return;

    // cleanup
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    timeoutRef.current = window.setTimeout(() => {
      setActiveIndex((idx) => {
        const next = Math.min(idx + 1, steps.length - 1);
        return next;
      });
    }, 520);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [activeIndex, animate, steps.length]);

  // Tween score toward checkpoint for current step
  useEffect(() => {
    if (!animate) return;
    const target = progress[Math.min(activeIndex, progress.length - 1)];
    if (!target) return;

    const start = {
      score: displayScore,
      mult: displayMult,
      bonus: displayBonus,
    };

    const end = {
      score: target.score,
      mult: target.mult,
      bonus: target.bonus,
    };

    const duration = 360;
    const t0 = performance.now();

    const tick = (t: number) => {
      const p = clamp((t - t0) / duration, 0, 1);
      // easeOutCubic
      const e = 1 - Math.pow(1 - p, 3);

      setDisplayScore(Math.round(start.score + (end.score - start.score) * e));
      setDisplayMult(start.mult + (end.mult - start.mult) * e);
      setDisplayBonus(Math.round(start.bonus + (end.bonus - start.bonus) * e));

      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        if (activeIndex >= steps.length - 1 && !didCallCompleteRef.current) {
          didCallCompleteRef.current = true;
          onCompleteRef.current?.();
        }

        setPopKey((k) => k + 1);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, animate]);

  const step = steps[Math.min(activeIndex, steps.length - 1)];
  const stepLabel = step?.label ?? "";
  const stepColor = step?.colorClass ?? "text-zinc-100";

  return (
    <div className="rounded-xl border bg-zinc-950/60 p-3 shadow-sm sm:p-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold tracking-widest text-zinc-400">{stepLabel}</div>
          <div
            key={popKey}
            className={
              "mt-1 font-black tabular-nums drop-shadow-[0_2px_0_rgba(0,0,0,0.7)] " +
              scoreSizeClass(displayScore) +
              " " +
              stepColor +
              " animate-[scorepop_420ms_ease-out]"
            }
          >
            {formatNumber(displayScore)}
          </div>
        </div>

        <div className="text-right text-[11px] leading-tight text-zinc-400">
          <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
            <div>
              × <span className="font-semibold text-zinc-200">{formatNumber(displayMult)}</span>
            </div>
            <div>
              + <span className="font-semibold text-zinc-200">{formatNumber(displayBonus)}</span>
            </div>
            <div>
              → <span className="font-semibold text-yellow-200">{formatNumber(finalScore)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
        {steps.map((s, i) => (
          <div
            key={`${s.label}-${i}`}
            className={
              "rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide sm:px-2 sm:py-1 sm:text-[10px] " +
              (i <= activeIndex
                ? "border-zinc-600 bg-zinc-900 text-zinc-100"
                : "border-zinc-800 bg-zinc-950 text-zinc-500")
            }
          >
            {s.kind === "mult" ? `${s.label}×${formatNumber(s.multiplier)}` : null}
            {s.kind === "base" ? `${s.label}:${formatNumber(s.value)}` : null}
            {s.kind === "bonus" ? `${s.label}+${formatNumber(s.bonus)}` : null}
          </div>
        ))}
      </div>
    </div>
  );
}
