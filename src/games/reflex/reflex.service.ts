import { prisma } from "../../lib/prisma";
import type {
  ReflexAttempt,
  ReflexGameResult,
  ReflexMetrics,
  ReflexRoundResult,
} from "./reflex.types";

const ACCURACY_WEIGHT = 0.65;
const LATENCY_WEIGHT = 0.35;
const LATENCY_FLOOR_MS = 180;
const LATENCY_CEILING_MS = 1100;
const PASS_THRESHOLD = 0.72;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function scoreAttempts(attempts: ReflexAttempt[]): ReflexMetrics {
  const rounds: ReflexRoundResult[] = attempts.map((attempt) => ({
    ...attempt,
    successful: !attempt.falseStart && !attempt.timedOut,
  }));

  const successfulRounds = rounds.filter((round) => round.successful).length;
  const falseStarts = rounds.filter((round) => round.falseStart).length;
  const timedOutRounds = rounds.filter((round) => round.timedOut).length;
  const totalRounds = rounds.length;
  const accuracy = successfulRounds / totalRounds;

  const validLatencies = rounds
    .filter((round) => round.successful)
    .map((round) => round.latencyMs);

  const avgLatencyMs =
    validLatencies.length > 0
      ? validLatencies.reduce((sum, value) => sum + value, 0) / validLatencies.length
      : LATENCY_CEILING_MS;

  const latencyNormalized = clamp(
    1 - (avgLatencyMs - LATENCY_FLOOR_MS) / (LATENCY_CEILING_MS - LATENCY_FLOOR_MS),
    0,
    1,
  );

  return {
    rounds,
    totalRounds,
    successfulRounds,
    falseStarts,
    timedOutRounds,
    accuracy,
    avgLatencyMs,
    latencyNormalized,
  };
}

export async function scoreAndPersistReflexGame(
  sessionId: number,
  attempts: ReflexAttempt[],
  stepIndex: number,
): Promise<ReflexGameResult> {
  const metrics = scoreAttempts(attempts);
  const score = metrics.accuracy * ACCURACY_WEIGHT + metrics.latencyNormalized * LATENCY_WEIGHT;
  const passed = score >= PASS_THRESHOLD;

  await prisma.gameResult.create({
    data: {
      sessionId,
      stepIndex,
      gameType: "REFLEX",
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
