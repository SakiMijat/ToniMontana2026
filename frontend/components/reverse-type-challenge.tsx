"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ReverseTypeAttempt } from "@/lib/types";

const WORD_BANK = ["DRIVE", "FOCUS", "TRACK", "SHARP", "ALERT", "CLEAR"];

function reverse(word: string) {
  return word.split("").reverse().join("");
}

function pickWords(count: number) {
  return WORD_BANK.slice().sort(() => Math.random() - 0.5).slice(0, count);
}

interface ReverseTypeChallengeProps {
  totalRounds?: number;
  onComplete: (attempts: ReverseTypeAttempt[]) => void;
}

export function ReverseTypeChallenge({
  totalRounds = 3,
  onComplete,
}: ReverseTypeChallengeProps) {
  const [words, setWords] = useState<string[] | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState<ReverseTypeAttempt[]>([]);
  const shownAt = useRef(0);

  useEffect(() => {
    setWords(pickWords(totalRounds));
    setRoundIndex(0);
    setValue("");
    setAttempts([]);
  }, [totalRounds]);

  useEffect(() => {
    if (!words) return;
    shownAt.current = performance.now();
  }, [roundIndex, words]);

  const word = words?.[roundIndex];
  if (!words || !word) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="h-48 w-full animate-pulse rounded-xl border border-slate-800 bg-safegate-surface/70" />
        <p className="font-mono text-sm text-slate-500">Preparing challenge...</p>
      </div>
    );
  }

  const expected = reverse(word);

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const attempt: ReverseTypeAttempt = {
      word,
      expected,
      typed: value.trim().toUpperCase(),
      latencyMs: Math.round(performance.now() - shownAt.current),
    };

    const nextAttempts = [...attempts, attempt];
    setAttempts(nextAttempts);
    setValue("");

    if (nextAttempts.length >= words.length) {
      onComplete(nextAttempts);
      return;
    }

    shownAt.current = performance.now();
    setRoundIndex((current) => current + 1);
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col items-center gap-8">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-slate-400">
          Type the shown word backward. Accuracy matters more than speed, but both count.
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
          Round {roundIndex + 1} / {words.length}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-800 bg-safegate-surface/80 p-8 text-center">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">
          Type backward
        </span>
        <span className="text-5xl font-bold tracking-[0.24em] text-slate-50">{word}</span>
      </div>

      <input
        value={value}
        onChange={(event) => setValue(event.target.value.toUpperCase())}
        autoCapitalize="characters"
        className="min-h-[56px] w-full rounded-xl border border-slate-800 bg-safegate-surface px-4 text-center text-lg font-semibold tracking-[0.22em] text-slate-50 outline-none transition-colors focus:border-safegate-primary"
        placeholder={expected}
      />

      <Button variant="primary" size="lg" type="submit" className="w-full">
        Submit Word
      </Button>
    </form>
  );
}
