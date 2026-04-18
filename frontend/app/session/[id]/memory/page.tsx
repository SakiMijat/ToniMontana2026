"use client";

import { ChallengePageShell } from "@/components/challenge-page-shell";
import { MemoryGridChallenge } from "@/components/memory-grid-challenge";
import { submitMemoryGame } from "@/lib/api";
import type { MemoryAttempt } from "@/lib/types";

export default function MemoryGamePage() {
  return (
    <ChallengePageShell<MemoryAttempt>
      title="Spatial Memory"
      progress={{ current: 1, total: 2 }}
      description="Lock in the grid pattern. Passing this first check unlocks the second category challenge."
      submittingLabel="Processing your game..."
      submit={submitMemoryGame}
      renderChallenge={(onComplete) => <MemoryGridChallenge onComplete={onComplete} />}
    />
  );
}
