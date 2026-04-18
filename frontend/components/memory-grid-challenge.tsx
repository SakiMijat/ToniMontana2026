"use client";

import { useEffect, useRef, useState } from "react";

import type { MemoryAttempt } from "@/lib/types";

type Mode = "preview" | "input" | "feedback";

function buildSequence(length: number) {
  const cells = Array.from({ length: 9 }, (_, index) => index).sort(
    () => Math.random() - 0.5,
  );
  return cells.slice(0, length);
}

interface MemoryGridChallengeProps {
  onComplete: (attempts: MemoryAttempt[]) => void;
}

export function MemoryGridChallenge({ onComplete }: MemoryGridChallengeProps) {
  const [rounds, setRounds] = useState<number[][] | null>(null);

  const [roundIndex, setRoundIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("preview");
  const [flashCell, setFlashCell] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number[]>([]);
  const [attempts, setAttempts] = useState<MemoryAttempt[]>([]);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const inputStartedAt = useRef(0);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  };

  useEffect(() => {
    setRounds([buildSequence(3), buildSequence(4), buildSequence(5)]);
    setRoundIndex(0);
    setMode("preview");
    setFlashCell(null);
    setChosen([]);
    setAttempts([]);
  }, []);

  const sequence = rounds?.[roundIndex];

  useEffect(() => {
    if (!sequence) return;
    clearTimers();
    setMode("preview");
    setChosen([]);
    setFlashCell(null);

    sequence.forEach((cell, index) => {
      timersRef.current.push(
        setTimeout(() => {
          setFlashCell(cell);
        }, index * 700 + 250),
      );
      timersRef.current.push(
        setTimeout(() => {
          setFlashCell(null);
        }, index * 700 + 550),
      );
    });

    timersRef.current.push(
      setTimeout(() => {
        setMode("input");
        inputStartedAt.current = performance.now();
      }, sequence.length * 700 + 500),
    );

    return clearTimers;
  }, [roundIndex, sequence]);

  if (!rounds || !sequence) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="grid w-full grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, cell) => (
            <div
              key={cell}
              className="aspect-square animate-pulse rounded-xl border border-slate-800 bg-safegate-surface/70"
            />
          ))}
        </div>
        <p className="font-mono text-sm text-slate-500">Preparing challenge...</p>
      </div>
    );
  }

  const handleCell = (cell: number) => {
    if (mode !== "input") return;

    const nextChosen = [...chosen, cell];
    setChosen(nextChosen);

    if (nextChosen.length >= sequence.length) {
      setMode("feedback");
      const nextAttempts = [
        ...attempts,
        {
          sequence,
          chosen: nextChosen,
          latencyMs: Math.round(performance.now() - inputStartedAt.current),
        },
      ];
      setAttempts(nextAttempts);

      timersRef.current.push(
        setTimeout(() => {
          if (nextAttempts.length >= rounds.length) {
            onComplete(nextAttempts);
          } else {
            setRoundIndex((value) => value + 1);
          }
        }, 900),
      );
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-slate-400">
          Watch the grid pattern, then repeat it in the same order.
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
          Round {roundIndex + 1} / {rounds.length}
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, cell) => {
          const flashing = flashCell === cell;
          const selected = chosen.includes(cell);

          return (
            <button
              key={cell}
              type="button"
              onClick={() => handleCell(cell)}
              className={
                "aspect-square rounded-xl border transition-colors " +
                (flashing
                  ? "border-safegate-primary bg-safegate-primary/30 shadow-glow"
                  : selected
                    ? "border-safegate-success bg-safegate-success/20"
                    : "border-slate-800 bg-safegate-surface/80")
              }
            />
          );
        })}
      </div>

      <p className="font-mono text-sm uppercase tracking-[0.25em] text-slate-500">
        {mode === "preview" ? "Memorize" : mode === "input" ? "Repeat" : "Checking"}
      </p>
    </div>
  );
}
