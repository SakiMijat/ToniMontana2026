import { prisma } from "../../lib/prisma";
import { average, latencyNormalized } from "../scoring";
import type {
  OcularAttempt,
  OcularGameResult,
  OcularMetrics,
  OcularRoundResult,
} from "./ocular.types";

const ACCURACY_WEIGHT = 0.7;
const LATENCY_WEIGHT = 0.3;
const LATENCY_FLOOR_MS = 250;
const LATENCY_CEILING_MS = 2200;
const PASS_THRESHOLD = 0.68;

function scoreAttempts(attempts: OcularAttempt[]): OcularMetrics {
  const rounds: OcularRoundResult[] = attempts.map((attempt) => ({
    ...attempt,
    successful: attempt.hit,
  }));

  const totalRounds = rounds.length;
  const hitCount = rounds.filter((round) => round.hit).length;
  const accuracy = hitCount / totalRounds;
  const avgLatencyMs = average(
    rounds.filter((round) => round.hit).map((round) => round.latencyMs),
    LATENCY_CEILING_MS,
  );

  return {
    rounds,
    totalRounds,
    hitCount,
    accuracy,
    avgLatencyMs,
    latencyNormalized: latencyNormalized(
      avgLatencyMs,
      LATENCY_FLOOR_MS,
      LATENCY_CEILING_MS,
    ),
  };
}

export async function scoreAndPersistOcularGame(
  sessionId: number,
  attempts: OcularAttempt[],
  stepIndex: number,
): Promise<OcularGameResult> {
  const metrics = scoreAttempts(attempts);
  const score = metrics.accuracy * ACCURACY_WEIGHT + metrics.latencyNormalized * LATENCY_WEIGHT;
  const passed = score >= PASS_THRESHOLD;

  await prisma.gameResult.create({
    data: {
      sessionId,
      stepIndex,
      gameType: "OCULAR",
      passed,
      metrics: JSON.parse(
        JSON.stringify({
          totalRounds: metrics.totalRounds,
          hitCount: metrics.hitCount,
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
