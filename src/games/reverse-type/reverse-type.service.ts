import { prisma } from "../../lib/prisma";
import { average, latencyNormalized } from "../scoring";
import type {
  ReverseTypeAttempt,
  ReverseTypeGameResult,
  ReverseTypeMetrics,
  ReverseTypeRoundResult,
} from "./reverse-type.types";

const ACCURACY_WEIGHT = 0.8;
const LATENCY_WEIGHT = 0.2;
const LATENCY_FLOOR_MS = 700;
const LATENCY_CEILING_MS = 5000;
const PASS_THRESHOLD = 0.72;

function matchedChars(expected: string, typed: string) {
  const limit = Math.max(expected.length, typed.length);
  let count = 0;
  for (let index = 0; index < limit; index += 1) {
    if (expected[index] === typed[index]) count += 1;
  }
  return count;
}

function scoreAttempts(attempts: ReverseTypeAttempt[]): ReverseTypeMetrics {
  const rounds: ReverseTypeRoundResult[] = attempts.map((attempt) => {
    const matches = matchedChars(attempt.expected, attempt.typed);
    return {
      ...attempt,
      matchedChars: matches,
      correct: attempt.typed === attempt.expected,
    };
  });

  const totalRounds = rounds.length;
  const correctCount = rounds.filter((round) => round.correct).length;
  const totalExpectedChars = rounds.reduce((sum, round) => sum + round.expected.length, 0);
  const accuracy =
    rounds.reduce((sum, round) => sum + round.matchedChars, 0) / Math.max(totalExpectedChars, 1);
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

export async function scoreAndPersistReverseTypeGame(
  sessionId: number,
  attempts: ReverseTypeAttempt[],
  stepIndex: number,
): Promise<ReverseTypeGameResult> {
  const metrics = scoreAttempts(attempts);
  const score = metrics.accuracy * ACCURACY_WEIGHT + metrics.latencyNormalized * LATENCY_WEIGHT;
  const passed = score >= PASS_THRESHOLD;

  await prisma.gameResult.create({
    data: {
      sessionId,
      stepIndex,
      gameType: "REVERSE_TYPE",
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
