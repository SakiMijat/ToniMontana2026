"use client";

import { ChallengePageShell } from "@/components/challenge-page-shell";
import { ReflexChallenge } from "@/components/reflex-challenge";
import { submitReflexGame } from "@/lib/api";
import type { ReflexAttempt } from "@/lib/types";

export default function ReflexGamePage() {
  return (
    <ChallengePageShell<ReflexAttempt>
      title="Reflex Tap"
      progress={{ current: 2, total: 2 }}
      submittingLabel="Finalizing your session..."
      submit={submitReflexGame}
      renderChallenge={(onComplete) => <ReflexChallenge onComplete={onComplete} />}
    />
  );
}
