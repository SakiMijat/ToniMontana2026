"use client";

import { ChallengePageShell } from "@/components/challenge-page-shell";
import { TimerChallenge } from "@/components/timer-challenge";
import { submitTimerGame } from "@/lib/api";
import type { TimerAttempt } from "@/lib/types";

export default function TimerGamePage() {
  return (
    <ChallengePageShell<TimerAttempt>
      title="Timer Button"
      progress={{ current: 2, total: 2 }}
      submittingLabel="Finalizing your session..."
      submit={submitTimerGame}
      renderChallenge={(onComplete) => <TimerChallenge onComplete={onComplete} />}
    />
  );
}
