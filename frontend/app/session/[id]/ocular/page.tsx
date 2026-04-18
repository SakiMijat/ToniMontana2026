"use client";

import { ChallengePageShell } from "@/components/challenge-page-shell";
import { OcularChallenge } from "@/components/ocular-challenge";
import { submitOcularGame } from "@/lib/api";
import type { OcularAttempt } from "@/lib/types";

export default function OcularGamePage() {
  return (
    <ChallengePageShell<OcularAttempt>
      title="Ocular Pursuit"
      progress={{ current: 2, total: 2 }}
      submittingLabel="Finalizing your session..."
      submit={submitOcularGame}
      renderChallenge={(onComplete) => <OcularChallenge onComplete={onComplete} />}
    />
  );
}
