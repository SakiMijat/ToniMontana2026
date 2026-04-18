"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ReflexAttempt } from "@/lib/types";

interface ReflexChallengeProps {
  totalRounds?: number;
  onComplete: (attempts: ReflexAttempt[]) => void;
}

type RoundPhase = "waiting" | "ready" | "feedback";

const WAIT_MIN_MS = 1200;
const WAIT_JITTER_MS = 1400;
const RESPONSE_WINDOW_MS = 1400;
const FEEDBACK_DELAY_MS = 850;

function randomWaitMs() {
  return WAIT_MIN_MS + Math.floor(Math.random() * WAIT_JITTER_MS);
}

export function ReflexChallenge({
  totalRounds = 5,
  onComplete,
}: ReflexChallengeProps) {
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<RoundPhase>("waiting");
  const [attempts, setAttempts] = useState<ReflexAttempt[]>([]);
  const [feedback, setFeedback] = useState("Wait for green");

  const signalAtRef = useRef<number | null>(null);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  };

  const startRound = () => {
    clearTimers();
    signalAtRef.current = null;
    setPhase("waiting");
    setFeedback("Wait for green");

    waitTimerRef.current = setTimeout(() => {
      signalAtRef.current = performance.now();
      setPhase("ready");
      setFeedback("Tap now");

      timeoutTimerRef.current = setTimeout(() => {
        recordAttempt({
          round,
          latencyMs: RESPONSE_WINDOW_MS,
          falseStart: false,
          timedOut: true,
        });
      }, RESPONSE_WINDOW_MS);
    }, randomWaitMs());
  };

  useEffect(() => {
    startRound();
    return clearTimers;
    // We intentionally restart timing only when the round changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const recordAttempt = (attempt: ReflexAttempt) => {
    clearTimers();
    const nextAttempts = [...attempts, attempt];
    setAttempts(nextAttempts);
    setPhase("feedback");

    if (attempt.falseStart) {
      setFeedback("Too early");
    } else if (attempt.timedOut) {
      setFeedback("Too slow");
    } else {
      setFeedback(`${attempt.latencyMs} ms`);
    }

    feedbackTimerRef.current = setTimeout(() => {
      if (nextAttempts.length >= totalRounds) {
        onComplete(nextAttempts);
      } else {
        setRound((value) => value + 1);
      }
    }, FEEDBACK_DELAY_MS);
  };

  const handleTap = () => {
    if (phase === "feedback") return;

    if (phase === "waiting") {
      recordAttempt({
        round,
        latencyMs: 0,
        falseStart: true,
        timedOut: false,
      });
      return;
    }

    const startedAt = signalAtRef.current ?? performance.now();
    recordAttempt({
      round,
      latencyMs: Math.round(performance.now() - startedAt),
      falseStart: false,
      timedOut: false,
    });
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-slate-400">
          Wait for the signal to turn green, then tap as fast as you can. Early taps and
          missed taps both count against the round.
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
          Round {round} / {totalRounds}
        </p>
      </div>

      <motion.button
        type="button"
        onClick={handleTap}
        whileTap={{ scale: 0.98 }}
        className={
          "flex h-72 w-full items-center justify-center rounded-xl border text-center shadow-[0_0_30px_rgba(34,211,238,0.18)] transition-colors " +
          (phase === "ready"
            ? "border-safegate-success bg-safegate-success/20 text-emerald-200"
            : phase === "feedback"
              ? "border-slate-700 bg-safegate-surface text-slate-100"
              : "border-safegate-danger/60 bg-safegate-danger/15 text-rose-200")
        }
      >
        <div className="space-y-3">
          <div className="text-4xl font-bold tracking-tight">
            {phase === "ready" ? "TAP" : phase === "feedback" ? "LOCKED" : "WAIT"}
          </div>
          <p className="font-mono text-sm uppercase tracking-[0.3em]">{feedback}</p>
        </div>
      </motion.button>

      <Button variant="secondary" size="lg" onClick={handleTap} className="w-full">
        Tap Surface
      </Button>
    </div>
  );
}
