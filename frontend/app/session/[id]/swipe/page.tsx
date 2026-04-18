"use client";

import { ChallengePageShell } from "@/components/challenge-page-shell";
import { SwipeCardDeck } from "@/components/swipe-card-deck";
import { submitSwipeGame } from "@/lib/api";
import type { SwipeAttempt } from "@/lib/types";

export default function SwipeGamePage() {
  return (
    <ChallengePageShell<SwipeAttempt>
      title="Decision Speed"
      progress={{ current: 1, total: 2 }}
      description="Pass this first motor-control check to move straight into the second challenge."
      submittingLabel="Processing your game..."
      submit={submitSwipeGame}
      renderChallenge={(onComplete) => <SwipeCardDeck onComplete={onComplete} />}
    />
  );
}
