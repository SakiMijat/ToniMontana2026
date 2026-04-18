"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { TimerAttempt } from "@/lib/types";

interface TimerChallengeProps {
  totalRounds?: number;
  onComplete: (attempts: TimerAttempt[]) => void;
}

type TimerPhase = "timing" | "feedback";

const TARGET_MS = 1000;
const LATE_WINDOW_MS = 700;
const FEEDBACK_DELAY_MS = 850;

export function TimerChallenge({
  totalRounds = 5,
  onComplete,
}: TimerChallengeProps) {
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<TimerPhase>("timing");
  const [attempts, setAttempts] = useState<TimerAttempt[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [feedback, setFeedback] = useState("Tap at exactly 1.00s");

  const startedAtRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (feedbackRef.current) clearTimeout(feedbackRef.current);
  };

  const finishRound = (attempt: TimerAttempt, nextFeedback: string) => {
    clearTimers();
    setPhase("feedback");
    setFeedback(nextFeedback);

    const nextAttempts = [...attempts, attempt];
    setAttempts(nextAttempts);

    feedbackRef.current = setTimeout(() => {
      if (nextAttempts.length >= totalRounds) {
        onComplete(nextAttempts);
      } else {
        setRound((current) => current + 1);
      }
    }, FEEDBACK_DELAY_MS);
  };

  useEffect(() => {
    clearTimers();
    setPhase("timing");
    setElapsedMs(0);
    setFeedback("Tap at exactly 1.00s");
    startedAtRef.current = performance.now();

    const updateElapsed = () => {
      setElapsedMs(performance.now() - startedAtRef.current);
      frameRef.current = requestAnimationFrame(updateElapsed);
    };

    frameRef.current = requestAnimationFrame(updateElapsed);
    timeoutRef.current = setTimeout(() => {
      finishRound(
        {
          round,
          latencyMs: LATE_WINDOW_MS,
          falseStart: false,
          timedOut: true,
        },
        "Too late",
      );
    }, TARGET_MS + LATE_WINDOW_MS);

    return clearTimers;
    // The round value intentionally resets the timing surface.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const handleTap = () => {
    if (phase !== "timing") return;

    const elapsed = performance.now() - startedAtRef.current;

    if (elapsed < TARGET_MS) {
      finishRound(
        {
          round,
          latencyMs: Math.round(TARGET_MS - elapsed),
          falseStart: true,
          timedOut: false,
        },
        "Too early",
      );
      return;
    }

    finishRound(
      {
        round,
        latencyMs: Math.round(elapsed - TARGET_MS),
        falseStart: false,
        timedOut: false,
      },
      `${Math.round(elapsed - TARGET_MS)} ms off`,
    );
  };

  const progress = Math.min(elapsedMs / (TARGET_MS + LATE_WINDOW_MS), 1);
  const ready = elapsedMs >= TARGET_MS;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-slate-400">
          Let the timer build and tap right as it crosses the one-second mark.
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
          Round {round} / {totalRounds}
        </p>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        onClick={handleTap}
        className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-safegate-surface/80 text-center shadow-[0_0_30px_rgba(34,211,238,0.16)]"
      >
        <motion.div
          animate={{ scale: 0.35 + progress * 0.9, opacity: 0.25 + progress * 0.55 }}
          transition={{ duration: 0.08, ease: "linear" }}
          className={
            "absolute h-40 w-40 rounded-full border " +
            (ready
              ? "border-safegate-success bg-safegate-success/18"
              : "border-safegate-primary bg-safegate-primary/14")
          }
        />

        <div className="relative z-10 space-y-3">
          <div className="font-mono text-5xl font-bold text-slate-50">
            {(elapsedMs / 1000).toFixed(2)}
          </div>
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-slate-400">
            {phase === "feedback" ? feedback : ready ? "Tap now" : "Hold steady"}
          </p>
        </div>
      </motion.button>

      <Button variant="secondary" size="lg" onClick={handleTap} className="w-full">
        Stop Timer
      </Button>
    </div>
  );
}
