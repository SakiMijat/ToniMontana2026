"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { MazeAttempt } from "@/lib/types";

const CHECKPOINTS = [
  { id: 0, x: 15, y: 65 },
  { id: 1, x: 28, y: 42 },
  { id: 2, x: 45, y: 58 },
  { id: 3, x: 58, y: 28 },
  { id: 4, x: 74, y: 44 },
  { id: 5, x: 86, y: 20 },
] as const;

const DECOYS = [
  { id: "d1", x: 18, y: 22 },
  { id: "d2", x: 52, y: 80 },
  { id: "d3", x: 82, y: 72 },
] as const;

interface MazeChallengeProps {
  onComplete: (attempts: MazeAttempt[]) => void;
}

export function MazeChallenge({ onComplete }: MazeChallengeProps) {
  const [nextCheckpoint, setNextCheckpoint] = useState(0);
  const [misses, setMisses] = useState(0);
  const [started, setStarted] = useState(false);
  const startedAt = useRef(0);

  const activeCheckpoint = useMemo(
    () => CHECKPOINTS[nextCheckpoint] ?? null,
    [nextCheckpoint],
  );

  const markCheckpoint = (id: number) => {
    if (id !== nextCheckpoint) {
      setMisses((value) => value + 1);
      return;
    }

    if (!started) {
      startedAt.current = performance.now();
      setStarted(true);
    }

    const next = nextCheckpoint + 1;
    if (next >= CHECKPOINTS.length) {
      onComplete([
        {
          checkpointCount: CHECKPOINTS.length,
          hits: CHECKPOINTS.length,
          misses,
          completionMs: Math.round(performance.now() - startedAt.current),
        },
      ]);
      return;
    }

    setNextCheckpoint(next);
  };

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-8">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-slate-400">
          Tap the checkpoints in order without drifting onto the wrong markers.
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
          Next checkpoint {Math.min(nextCheckpoint + 1, CHECKPOINTS.length)} / {CHECKPOINTS.length}
        </p>
      </div>

      <div className="relative h-[360px] w-full rounded-xl border border-slate-800 bg-safegate-surface/80">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full p-6">
          <polyline
            points={CHECKPOINTS.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="rgba(34,211,238,0.3)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {CHECKPOINTS.map((point, index) => (
          <button
            key={point.id}
            type="button"
            onClick={() => markCheckpoint(point.id)}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            className={
              "absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border text-sm font-bold transition-colors " +
              (index < nextCheckpoint
                ? "border-safegate-success bg-safegate-success/25 text-emerald-100"
                : activeCheckpoint?.id === point.id
                  ? "border-safegate-primary bg-safegate-primary/20 text-cyan-100 shadow-glow"
                  : "border-slate-700 bg-safegate-bg/60 text-slate-300")
            }
          >
            {index + 1}
          </button>
        ))}

        {DECOYS.map((point) => (
          <button
            key={point.id}
            type="button"
            onClick={() => setMisses((value) => value + 1)}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose-500/40 bg-rose-500/10 text-xs font-semibold text-rose-200"
          >
            X
          </button>
        ))}
      </div>

      <Button variant="secondary" size="lg" className="w-full" disabled>
        Misses: {misses}
      </Button>
    </div>
  );
}
