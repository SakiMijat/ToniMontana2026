"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { StroopAttempt } from "@/lib/types";

const COLOR_BANK = [
  {
    name: "RED",
    textClass: "text-rose-400",
    buttonClass: "border-rose-400/50 text-rose-200 hover:border-rose-300",
  },
  {
    name: "GREEN",
    textClass: "text-emerald-400",
    buttonClass: "border-emerald-400/50 text-emerald-200 hover:border-emerald-300",
  },
  {
    name: "BLUE",
    textClass: "text-sky-400",
    buttonClass: "border-sky-400/50 text-sky-200 hover:border-sky-300",
  },
  {
    name: "YELLOW",
    textClass: "text-amber-300",
    buttonClass: "border-amber-300/50 text-amber-100 hover:border-amber-200",
  },
] as const;

function pickRound() {
  const wordIndex = Math.floor(Math.random() * COLOR_BANK.length);
  let colorIndex = Math.floor(Math.random() * COLOR_BANK.length);

  while (colorIndex === wordIndex) {
    colorIndex = Math.floor(Math.random() * COLOR_BANK.length);
  }

  return {
    word: COLOR_BANK[wordIndex].name,
    color: COLOR_BANK[colorIndex].name,
    textClass: COLOR_BANK[colorIndex].textClass,
  };
}

interface StroopChallengeProps {
  totalRounds?: number;
  onComplete: (attempts: StroopAttempt[]) => void;
}

export function StroopChallenge({
  totalRounds = 6,
  onComplete,
}: StroopChallengeProps) {
  const [rounds, setRounds] = useState<ReturnType<typeof pickRound>[] | null>(null);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<StroopAttempt[]>([]);
  const shownAt = useRef(0);

  useEffect(() => {
    setRounds(Array.from({ length: totalRounds }, () => pickRound()));
    setIndex(0);
    setAttempts([]);
  }, [totalRounds]);

  useEffect(() => {
    if (!rounds) return;
    shownAt.current = performance.now();
  }, [index, rounds]);

  const current = rounds?.[index];

  if (!rounds || !current) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="h-72 w-full animate-pulse rounded-xl border border-slate-800 bg-safegate-surface/70" />
        <p className="font-mono text-sm text-slate-500">Preparing challenge...</p>
      </div>
    );
  }

  const choose = (chosenColor: string) => {
    const attempt: StroopAttempt = {
      word: current.word,
      color: current.color,
      chosenColor,
      latencyMs: Math.round(performance.now() - shownAt.current),
    };

    const next = [...attempts, attempt];
    setAttempts(next);

    if (next.length >= rounds.length) {
      onComplete(next);
      return;
    }

    shownAt.current = performance.now();
    setIndex((value) => value + 1);
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-slate-400">
          Ignore the word itself and choose the actual color of the text as fast as you can.
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
          Round {index + 1} / {rounds.length}
        </p>
      </div>

      <div className="flex h-72 w-full items-center justify-center rounded-xl border border-slate-800 bg-safegate-surface/80">
        <span className={`text-6xl font-bold tracking-[0.25em] ${current.textClass}`}>
          {current.word}
        </span>
      </div>

      <div className="grid w-full grid-cols-2 gap-4">
        {COLOR_BANK.map((color) => (
          <Button
            key={color.name}
            variant="secondary"
            size="lg"
            onClick={() => choose(color.name)}
            className={color.buttonClass}
          >
            {color.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
