import { prisma } from "../../lib/prisma";
import { average, latencyNormalized } from "../scoring";
import type {
  MemoryAttempt,
  MemoryGameResult,
  MemoryMetrics,
  MemoryRoundResult,
} from "./memory.types";

const ACCURACY_WEIGHT = 0.8;
const LATENCY_WEIGHT = 0.2;
const LATENCY_FLOOR_MS = 800;
const LATENCY_CEILING_MS = 6000;
const PASS_THRESHOLD = 0.7;

function matchedCount(sequence: number[], chosen: number[]) {
  let count = 0;
  for (let index = 0; index < sequence.length; index += 1) {
    if (sequence[index] === chosen[index]) count += 1;
  }
  return count;
}

function scoreAttempts(attempts: MemoryAttempt[]): MemoryMetrics {
  const rounds: MemoryRoundResult[] = attempts.map((attempt) => {
    const matches = matchedCount(attempt.sequence, attempt.chosen);
    return {
      ...attempt,
      matchedCount: matches,
      exact: matches === attempt.sequence.length,
    };
  });

  const totalRounds = rounds.length;
  const exactCount = rounds.filter((round) => round.exact).length;
  const accuracy =
    rounds.reduce(
      (sum, round) => sum + round.matchedCount / Math.max(round.sequence.length, 1),
      0,
    ) / totalRounds;
  const avgLatencyMs = average(rounds.map((round) => round.latencyMs), LATENCY_CEILING_MS);

  return {
    rounds,
    totalRounds,
    exactCount,
    accuracy,
    avgLatencyMs,
    latencyNormalized: latencyNormalized(
      avgLatencyMs,
      LATENCY_FLOOR_MS,
      LATENCY_CEILING_MS,
    ),
  };
}

export async function scoreAndPersistMemoryGame(
  sessionId: number,
  attempts: MemoryAttempt[],
  stepIndex: number,
): Promise<MemoryGameResult> {
  const metrics = scoreAttempts(attempts);
  const score = metrics.accuracy * ACCURACY_WEIGHT + metrics.latencyNormalized * LATENCY_WEIGHT;
  const passed = score >= PASS_THRESHOLD;

  await prisma.gameResult.create({
    data: {
      sessionId,
      stepIndex,
      gameType: "MEMORY",
      passed,
      metrics: JSON.parse(
        JSON.stringify({
          totalRounds: metrics.totalRounds,
          exactCount: metrics.exactCount,
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
