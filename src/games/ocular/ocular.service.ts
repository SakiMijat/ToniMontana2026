import { prisma } from "../../lib/prisma";
import { average, latencyNormalized } from "../scoring";
import type {
  OcularAttempt,
  OcularGameResult,
  OcularMetrics,
  OcularRejectReason,
  OcularRoundResult,
  TrackedOcularGameResult,
  TrackedOcularMetrics,
  TrackedOcularSample,
  TrackedOcularSubmitPayload,
} from "./ocular.types";

const ACCURACY_WEIGHT = 0.7;
const LATENCY_WEIGHT = 0.3;
const LATENCY_FLOOR_MS = 250;
const LATENCY_CEILING_MS = 2200;
const PASS_THRESHOLD = 0.68;

const TRACKED_ACCURACY_WEIGHT = 0.7;
const TRACKED_SMOOTHNESS_WEIGHT = 0.3;
const TRACKED_PASS_THRESHOLD = 0.58;
const MAX_DEVIATION = 0.36;
const ACCURACY_GRACE_RADIUS = 0.035;
const TRACKING_LAG_COMP_MS = 120;
const SACCADE_VELOCITY_RATIO = 4.2;
const SACCADE_COUNT_CEILING = 0.5;
const MIN_SAMPLE_HZ = 10;
const MAX_NULL_RATIO = 0.6;
const MIN_GAZE_VARIANCE = 0.0008;
const MIN_DURATION_MS = 10_000;
const MAX_DURATION_MS = 40_000;
const AMPLITUDE = 0.4;
const CENTER = 0.5;
const PERIOD_X_MS = 8_000;
const PERIOD_Y_MS = 12_000;

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

function phaseFromSeed(seed: number) {
  const normSeed = Math.abs(seed);
  const phiX = ((normSeed % 997) / 997) * 2 * Math.PI;
  const phiY = (((normSeed * 7) % 983) / 983) * 2 * Math.PI;
  return { phiX, phiY };
}

function targetAt(tMs: number, seed: number) {
  const { phiX, phiY } = phaseFromSeed(seed);
  const wx = (2 * Math.PI) / PERIOD_X_MS;
  const wy = (2 * Math.PI) / PERIOD_Y_MS;
  return {
    x: CENTER + AMPLITUDE * Math.sin(wx * tMs + phiX),
    y: CENTER + AMPLITUDE * Math.sin(wy * tMs + phiY),
    vx: AMPLITUDE * wx * Math.cos(wx * tMs + phiX),
    vy: AMPLITUDE * wy * Math.cos(wy * tMs + phiY),
  };
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function computeGazeVariance(samples: TrackedOcularSample[]): number {
  const valid = samples.filter(
    (sample): sample is TrackedOcularSample & { gx: number; gy: number } =>
      sample.gx !== null && sample.gy !== null,
  );
  if (valid.length < 2) return 0;

  const meanX = valid.reduce((sum, sample) => sum + sample.gx, 0) / valid.length;
  const meanY = valid.reduce((sum, sample) => sum + sample.gy, 0) / valid.length;

  return (
    valid.reduce(
      (sum, sample) => sum + (sample.gx - meanX) ** 2 + (sample.gy - meanY) ** 2,
      0,
    ) / valid.length
  );
}

export class OcularValidationError extends Error {
  constructor(public reason: OcularRejectReason, message: string) {
    super(message);
  }
}

function validateTrackedPayload(payload: TrackedOcularSubmitPayload): void {
  if (payload.durationMs < MIN_DURATION_MS || payload.durationMs > MAX_DURATION_MS) {
    throw new OcularValidationError(
      "DURATION_OUT_OF_RANGE",
      `durationMs must be between ${MIN_DURATION_MS} and ${MAX_DURATION_MS}`,
    );
  }

  const observedHz = (payload.samples.length / payload.durationMs) * 1000;
  if (observedHz < MIN_SAMPLE_HZ) {
    throw new OcularValidationError(
      "SAMPLE_RATE_TOO_LOW",
      `observed ${observedHz.toFixed(1)} Hz; need >= ${MIN_SAMPLE_HZ}`,
    );
  }

  const nullCount = payload.samples.filter(
    (sample) => sample.gx === null || sample.gy === null,
  ).length;
  const nullRatio = nullCount / payload.samples.length;
  if (nullRatio > MAX_NULL_RATIO) {
    throw new OcularValidationError(
      "TOO_MANY_NULL_SAMPLES",
      `${(nullRatio * 100).toFixed(0)}% samples had no gaze`,
    );
  }

  const variance = computeGazeVariance(payload.samples);
  if (variance < MIN_GAZE_VARIANCE) {
    throw new OcularValidationError(
      "STATIC_GAZE",
      `gaze variance ${variance.toFixed(5)} below threshold ${MIN_GAZE_VARIANCE}`,
    );
  }
}

function computeTrackedMetrics(payload: TrackedOcularSubmitPayload): TrackedOcularMetrics {
  const valid = payload.samples.filter(
    (sample): sample is TrackedOcularSample & { gx: number; gy: number } =>
      sample.gx !== null && sample.gy !== null,
  );

  let deviationSum = 0;
  for (const sample of valid) {
    const target = targetAt(Math.max(0, sample.t - TRACKING_LAG_COMP_MS), payload.pathSeed);
    const deviation = distance(sample.gx, sample.gy, target.x, target.y);
    const effectiveDeviation = Math.max(0, deviation - ACCURACY_GRACE_RADIUS);
    deviationSum += clamp(effectiveDeviation, 0, MAX_DEVIATION);
  }

  const avgDeviation = valid.length > 0 ? deviationSum / valid.length : MAX_DEVIATION;
  const accuracy = 1 - avgDeviation / MAX_DEVIATION;

  let saccadeCount = 0;
  for (let index = 1; index < valid.length; index += 1) {
    const previous = valid[index - 1];
    const current = valid[index];
    const dt = current.t - previous.t;
    if (dt <= 0) continue;

    const gazeVelocity = distance(current.gx, current.gy, previous.gx, previous.gy) / dt;
    const target = targetAt((current.t + previous.t) / 2, payload.pathSeed);
    const targetVelocity = Math.sqrt(target.vx ** 2 + target.vy ** 2);

    if (gazeVelocity > SACCADE_VELOCITY_RATIO * targetVelocity) {
      saccadeCount += 1;
    }
  }

  const saccadeFraction = valid.length > 1 ? saccadeCount / (valid.length - 1) : 1;
  const smoothness = clamp(1 - saccadeFraction / SACCADE_COUNT_CEILING, 0, 1);

  return {
    totalSamples: payload.samples.length,
    validSamples: valid.length,
    nullRatio: (payload.samples.length - valid.length) / payload.samples.length,
    avgDeviation,
    accuracy,
    saccadeCount,
    smoothness,
    sampleHz: (payload.samples.length / payload.durationMs) * 1000,
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

export function scoreTrackedOcularGame(
  payload: TrackedOcularSubmitPayload,
): TrackedOcularGameResult {
  validateTrackedPayload(payload);

  const metrics = computeTrackedMetrics(payload);
  const score =
    metrics.accuracy * TRACKED_ACCURACY_WEIGHT +
    metrics.smoothness * TRACKED_SMOOTHNESS_WEIGHT;

  return {
    score,
    passed: score >= TRACKED_PASS_THRESHOLD,
    metrics,
  };
}
