"use client";

import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { GameHeader } from "@/components/game-header";
import { advanceOrFinishSession } from "@/lib/game-flow";
import type { SessionGameResult } from "@/lib/types";

interface ChallengePageShellProps<TAttempt> {
  title: string;
  progress: { current: number; total: number };
  description?: string;
  submittingLabel?: string;
  submit: (sessionId: string, attempts: TAttempt[]) => Promise<SessionGameResult>;
  renderChallenge: (onComplete: (attempts: TAttempt[]) => void) => ReactNode;
}

export function ChallengePageShell<TAttempt>({
  title,
  progress,
  description,
  submittingLabel = "Processing your game...",
  submit,
  renderChallenge,
}: ChallengePageShellProps<TAttempt>) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async (attempts: TAttempt[]) => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await submit(sessionId, attempts);
      advanceOrFinishSession(router, sessionId, result);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to submit results");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <GameHeader title={title} progress={progress} />

      <main className="relative flex flex-1 items-center justify-center px-6 py-10">
        {submitting ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-safegate-primary border-t-transparent shadow-glow" />
            <p className="font-mono text-sm text-slate-400">{submittingLabel}</p>
          </motion.div>
        ) : (
          <div className="flex w-full flex-col items-center gap-6">
            {description ? (
              <p className="max-w-md text-center text-sm font-medium text-slate-400">
                {description}
              </p>
            ) : null}
            {renderChallenge(handleComplete)}
          </div>
        )}

        {error ? (
          <p className="absolute bottom-6 w-full max-w-md rounded-xl border border-safegate-danger/40 bg-safegate-danger/10 p-3 text-center text-sm text-safegate-danger">
            {error}
          </p>
        ) : null}
      </main>
    </div>
  );
}
