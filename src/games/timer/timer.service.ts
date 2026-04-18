import { prisma } from "../../lib/prisma";
import { average, latencyNormalized } from "../scoring";
import type {
  TimerAttempt,
  TimerGameResult,
  TimerMetrics,
  TimerRoundResult,
} from "./timer.types";

const ACCURACY_WEIGHT = 0.65;
const LATENCY_WEIGHT = 0.35;
const LATENCY_FLOOR_MS = 180;
const LATENCY_CEILING_MS = 1100;
const PASS_THRESHOLD = 0.72;

function scoreAttempts(attempts: TimerAttempt[]): TimerMetrics {
  const rounds: TimerRoundResult[] = attempts.map((attempt) => ({
    ...attempt,
    successful: !attempt.falseStart && !attempt.timedOut,
  }));

  const successfulRounds = rounds.filter((round) => round.successful).length;
  const falseStarts = rounds.filter((round) => round.falseStart).length;
  const timedOutRounds = rounds.filter((round) => round.timedOut).length;
  const totalRounds = rounds.length;
  const accuracy = successfulRounds / totalRounds;

  const avgLatencyMs = average(
    rounds.filter((round) => round.successful).map((round) => round.latencyMs),
    LATENCY_CEILING_MS,
  );

  return {
    rounds,
    totalRounds,
    successfulRounds,
    falseStarts,
    timedOutRounds,
    accuracy,
    avgLatencyMs,
    latencyNormalized: latencyNormalized(
      avgLatencyMs,
      LATENCY_FLOOR_MS,
      LATENCY_CEILING_MS,
    ),
  };
}

export async function scoreAndPersistTimerGame(
  sessionId: number,
  attempts: TimerAttempt[],
  stepIndex: number,
): Promise<TimerGameResult> {
  const metrics = scoreAttempts(attempts);
  const score = metrics.accuracy * ACCURACY_WEIGHT + metrics.latencyNormalized * LATENCY_WEIGHT;
  const passed = score >= PASS_THRESHOLD;

  await prisma.gameResult.create({
    data: {
      sessionId,
      stepIndex,
      gameType: "TIMER",
      passed,
      metrics: JSON.parse(
        JSON.stringify({
          totalRounds: metrics.totalRounds,
          successfulRounds: metrics.successfulRounds,
          falseStarts: metrics.falseStarts,
          timedOutRounds: metrics.timedOutRounds,
          accuracy: metrics.accuracy,
          avgLatencyMs: metrics.avgLatencyMs,
          latencyNormalized: metrics.latencyNormalized,
          rounds: metrics.rounds,
        }),
      ),
    },
  });

  return { score, passed, metrics };
}
