"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import type { OcularAttempt } from "@/lib/types";

interface OcularChallengeProps {
  totalRounds?: number;
  onComplete: (attempts: OcularAttempt[]) => void;
}

const ROUND_TIMEOUT_MS = 1600;

function randomPosition() {
  return {
    x: 12 + Math.random() * 72,
    y: 12 + Math.random() * 72,
  };
}

export function OcularChallenge({
  totalRounds = 5,
  onComplete,
}: OcularChallengeProps) {
  const [round, setRound] = useState(1);
  const [attempts, setAttempts] = useState<OcularAttempt[]>([]);
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const [active, setActive] = useState(true);

  const shownAt = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTarget(randomPosition());
    setActive(true);
    shownAt.current = performance.now();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      record(false);
    }, ROUND_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // Round changes intentionally reset the target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const record = (hit: boolean) => {
    if (!active) return;
    setActive(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const attempt: OcularAttempt = {
      round,
      hit,
      latencyMs: hit ? Math.round(performance.now() - shownAt.current) : ROUND_TIMEOUT_MS,
      targetX: Math.round(target.x),
      targetY: Math.round(target.y),
    };

    const nextAttempts = [...attempts, attempt];
    setAttempts(nextAttempts);

    setTimeout(() => {
      if (nextAttempts.length >= totalRounds) {
        onComplete(nextAttempts);
      } else {
        setRound((value) => value + 1);
      }
    }, 500);
  };

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-8">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-slate-400">
          Follow the moving target and tap it before it slips away.
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
          Round {round} / {totalRounds}
        </p>
      </div>

      <div className="relative h-[360px] w-full overflow-hidden rounded-xl border border-slate-800 bg-safegate-surface/80">
        <motion.button
          type="button"
          onClick={() => record(true)}
          animate={{ left: `${target.x}%`, top: `${target.y}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          className={
            "absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border " +
            (active
              ? "border-safegate-primary bg-safegate-primary/25 shadow-glow"
              : "border-slate-700 bg-slate-700/40")
          }
        >
          <span className="block h-full w-full rounded-full border border-white/40" />
        </motion.button>
      </div>
    </div>
  );
}
