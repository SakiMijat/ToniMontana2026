import { prisma } from "../../lib/prisma";
import { average, clamp, latencyNormalized } from "../scoring";
import type {
  MazeAttempt,
  MazeGameResult,
  MazeMetrics,
  MazeRoundResult,
} from "./maze.types";

const ACCURACY_WEIGHT = 0.7;
const LATENCY_WEIGHT = 0.3;
const LATENCY_FLOOR_MS = 1500;
const LATENCY_CEILING_MS = 9000;
const PASS_THRESHOLD = 0.68;

function roundAccuracy(attempt: MazeAttempt) {
  return clamp(
    (attempt.hits - attempt.misses * 0.4) / Math.max(attempt.checkpointCount, 1),
    0,
    1,
  );
}

function scoreAttempts(attempts: MazeAttempt[]): MazeMetrics {
  const rounds: MazeRoundResult[] = attempts.map((attempt) => {
    const accuracy = roundAccuracy(attempt);
    return {
      ...attempt,
      accuracy,
      successful: accuracy >= 0.75,
    };
  });

  const totalRounds = rounds.length;
  const successfulRounds = rounds.filter((round) => round.successful).length;
  const totalMisses = rounds.reduce((sum, round) => sum + round.misses, 0);
  const accuracy = average(rounds.map((round) => round.accuracy));
  const avgLatencyMs = average(rounds.map((round) => round.completionMs), LATENCY_CEILING_MS);

  return {
    rounds,
    totalRounds,
    successfulRounds,
    totalMisses,
    accuracy,
    avgLatencyMs,
    latencyNormalized: latencyNormalized(
      avgLatencyMs,
      LATENCY_FLOOR_MS,
      LATENCY_CEILING_MS,
    ),
  };
}

export async function scoreAndPersistMazeGame(
  sessionId: number,
  attempts: MazeAttempt[],
  stepIndex: number,
): Promise<MazeGameResult> {
  const metrics = scoreAttempts(attempts);
  const score = metrics.accuracy * ACCURACY_WEIGHT + metrics.latencyNormalized * LATENCY_WEIGHT;
  const passed = score >= PASS_THRESHOLD;

  await prisma.gameResult.create({
    data: {
      sessionId,
      stepIndex,
      gameType: "MAZE",
      passed,
      metrics: JSON.parse(
        JSON.stringify({
          totalRounds: metrics.totalRounds,
          successfulRounds: metrics.successfulRounds,
          totalMisses: metrics.totalMisses,
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
