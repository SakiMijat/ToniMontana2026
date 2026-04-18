import { prisma } from "../../lib/prisma";
import { average, latencyNormalized } from "../scoring";
import type {
  StroopAttempt,
  StroopGameResult,
  StroopMetrics,
  StroopRoundResult,
} from "./stroop.types";

const ACCURACY_WEIGHT = 0.75;
const LATENCY_WEIGHT = 0.25;
const LATENCY_FLOOR_MS = 350;
const LATENCY_CEILING_MS = 2200;
const PASS_THRESHOLD = 0.72;

function scoreAttempts(attempts: StroopAttempt[]): StroopMetrics {
  const rounds: StroopRoundResult[] = attempts.map((attempt) => ({
    ...attempt,
    correct: attempt.chosenColor === attempt.color,
  }));

  const correctCount = rounds.filter((round) => round.correct).length;
  const totalRounds = rounds.length;
  const accuracy = correctCount / totalRounds;
  const avgLatencyMs = average(rounds.map((round) => round.latencyMs), LATENCY_CEILING_MS);

  return {
    rounds,
    totalRounds,
    correctCount,
    accuracy,
    avgLatencyMs,
    latencyNormalized: latencyNormalized(
      avgLatencyMs,
      LATENCY_FLOOR_MS,
      LATENCY_CEILING_MS,
    ),
  };
}

export async function scoreAndPersistStroopGame(
  sessionId: number,
  attempts: StroopAttempt[],
  stepIndex: number,
): Promise<StroopGameResult> {
  const metrics = scoreAttempts(attempts);
  const score = metrics.accuracy * ACCURACY_WEIGHT + metrics.latencyNormalized * LATENCY_WEIGHT;
  const passed = score >= PASS_THRESHOLD;

  await prisma.gameResult.create({
    data: {
      sessionId,
      stepIndex,
      gameType: "STROOP",
      passed,
      metrics: JSON.parse(
        JSON.stringify({
          totalRounds: metrics.totalRounds,
          correctCount: metrics.correctCount,
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
