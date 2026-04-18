"use client";

import { ChallengePageShell } from "@/components/challenge-page-shell";
import { MazeChallenge } from "@/components/maze-challenge";
import { submitMazeGame } from "@/lib/api";
import type { MazeAttempt } from "@/lib/types";

export default function MazeGamePage() {
  return (
    <ChallengePageShell<MazeAttempt>
      title="Motor Control"
      progress={{ current: 2, total: 2 }}
      submittingLabel="Finalizing your session..."
      submit={submitMazeGame}
      renderChallenge={(onComplete) => <MazeChallenge onComplete={onComplete} />}
    />
  );
}
