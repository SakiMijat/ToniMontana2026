"use client";

import { ChallengePageShell } from "@/components/challenge-page-shell";
import { ReverseTypeChallenge } from "@/components/reverse-type-challenge";
import { submitReverseTypeGame } from "@/lib/api";
import type { ReverseTypeAttempt } from "@/lib/types";

export default function ReverseTypeGamePage() {
  return (
    <ChallengePageShell<ReverseTypeAttempt>
      title="Executive Function"
      progress={{ current: 1, total: 2 }}
      description="Reverse the prompt correctly and cleanly. This first-stage result decides whether the session can continue."
      submittingLabel="Processing your game..."
      submit={submitReverseTypeGame}
      renderChallenge={(onComplete) => <ReverseTypeChallenge onComplete={onComplete} />}
    />
  );
}
