"use client";

import { ChallengePageShell } from "@/components/challenge-page-shell";
import { StroopChallenge } from "@/components/stroop-challenge";
import { submitStroopGame } from "@/lib/api";
import type { StroopAttempt } from "@/lib/types";

export default function StroopGamePage() {
  return (
    <ChallengePageShell<StroopAttempt>
      title="Stroop Effect"
      progress={{ current: 1, total: 2 }}
      description="This is the first decision-control game for the session. A pass sends you to the motor-response follow-up."
      submittingLabel="Processing your game..."
      submit={submitStroopGame}
      renderChallenge={(onComplete) => <StroopChallenge onComplete={onComplete} />}
    />
  );
}
