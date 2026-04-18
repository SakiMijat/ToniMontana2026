import { prisma } from "../../lib/prisma";
import type {
  OcularGameResult,
  OcularMetrics,
  OcularRejectReason,
  OcularSample,
  OcularSubmitPayload,
} from "./ocular.types";

// ───── Scoring constants (mirror documentation.md §5 formula shape) ─────
const ACCURACY_WEIGHT = 0.7;
const SMOOTHNESS_WEIGHT = 0.3;
const PASS_THRESHOLD = 0.65; // pursuit is harder than swipe — softer bar

// Normalized deviation beyond this counts as "total miss"
const MAX_DEVIATION = 0.3;
// Gaze velocity > this multiplier of target velocity = saccade
const SACCADE_VELOCITY_RATIO = 3;
// If more than this fraction of samples are saccades, smoothness = 0
const SACCADE_COUNT_CEILING = 0.3;

// ───── Sanity guards ─────
const MIN_SAMPLE_HZ = 10;
const MAX_NULL_RATIO = 0.6;
const MIN_GAZE_VARIANCE = 0.0008; // user must actually move their eyes
const MIN_DURATION_MS = 10_000;
const MAX_DURATION_MS = 40_000;

// ───── Lissajous target path — MUST stay in sync with frontend/lib/ocular-path.ts ─────
const AMPLITUDE = 0.4;
const CENTER = 0.5;
const PERIOD_X_MS = 8_000;
const PERIOD_Y_MS = 12_000;

function phaseFromSeed(seed: number): { phiX: number; phiY: number } {
  const normSeed = Math.abs(seed);
  const phiX = ((normSeed % 997) / 997) * 2 * Math.PI;
  const phiY = (((normSeed * 7) % 983) / 983) * 2 * Math.PI;
  return { phiX, phiY };
}

function targetAt(
  tMs: number,
  seed: number,
): { x: number; y: number; vx: number; vy: number } {
  const { phiX, phiY } = phaseFromSeed(seed);
  const wx = (2 * Math.PI) / PERIOD_X_MS;
  const wy = (2 * Math.PI) / PERIOD_Y_MS;
  return {
    x: CENTER + AMPLITUDE * Math.sin(wx * tMs + phiX),
    y: CENTER + AMPLITUDE * Math.sin(wy * tMs + phiY),
    // velocities in units per ms (useful for saccade threshold)
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

function computeGazeVariance(samples: OcularSample[]): number {
  const valid = samples.filter(
    (s): s is OcularSample & { gx: number; gy: number } =>
      s.gx !== null && s.gy !== null,
  );
  if (valid.length < 2) return 0;
  const meanX = valid.reduce((sum, s) => sum + s.gx, 0) / valid.length;
  const meanY = valid.reduce((sum, s) => sum + s.gy, 0) / valid.length;
  const varSum = valid.reduce(
    (sum, s) => sum + (s.gx - meanX) ** 2 + (s.gy - meanY) ** 2,
    0,
  );
  return varSum / valid.length;
}

export class OcularValidationError extends Error {
  constructor(public reason: OcularRejectReason, message: string) {
    super(message);
  }
}

function validate(payload: OcularSubmitPayload): void {
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
      `observed ${observedHz.toFixed(1)} Hz; need ≥ ${MIN_SAMPLE_HZ}`,
    );
  }

  const nullCount = payload.samples.filter((s) => s.gx === null || s.gy === null).length;
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

function computeMetrics(payload: OcularSubmitPayload): OcularMetrics {
  const { samples, pathSeed, durationMs } = payload;
  const valid = samples.filter(
    (s): s is OcularSample & { gx: number; gy: number } =>
      s.gx !== null && s.gy !== null,
  );

  // --- Accuracy: mean clamped deviation, inverted ---
  let deviationSum = 0;
  for (const s of valid) {
    const tgt = targetAt(s.t, pathSeed);
    const d = distance(s.gx, s.gy, tgt.x, tgt.y);
    deviationSum += clamp(d, 0, MAX_DEVIATION);
  }
  const avgDeviation = valid.length > 0 ? deviationSum / valid.length : MAX_DEVIATION;
  const accuracy = 1 - avgDeviation / MAX_DEVIATION;

  // --- Smoothness: count saccades (gaze velocity spikes) ---
  let saccadeCount = 0;
  for (let i = 1; i < valid.length; i++) {
    const prev = valid[i - 1];
    const curr = valid[i];
    const dt = curr.t - prev.t;
    if (dt <= 0) continue;
    const gazeVelocity = distance(curr.gx, curr.gy, prev.gx, prev.gy) / dt;
    const tgtMid = targetAt((curr.t + prev.t) / 2, pathSeed);
    const targetVelocity = Math.sqrt(tgtMid.vx ** 2 + tgtMid.vy ** 2);
    if (gazeVelocity > SACCADE_VELOCITY_RATIO * targetVelocity) {
      saccadeCount++;
    }
  }
  const saccadeFraction = valid.length > 1 ? saccadeCount / (valid.length - 1) : 1;
  const smoothness = clamp(1 - saccadeFraction / SACCADE_COUNT_CEILING, 0, 1);

  const nullRatio = (samples.length - valid.length) / samples.length;
  const sampleHz = (samples.length / durationMs) * 1000;

  return {
    totalSamples: samples.length,
    validSamples: valid.length,
    nullRatio,
    avgDeviation,
    accuracy,
    saccadeCount,
    smoothness,
    sampleHz,
  };
}

export async function scoreAndPersistOcularGame(
  payload: OcularSubmitPayload,
): Promise<OcularGameResult> {
  validate(payload);

  const metrics = computeMetrics(payload);
  const score =
    metrics.accuracy * ACCURACY_WEIGHT + metrics.smoothness * SMOOTHNESS_WEIGHT;
  const passed = score >= PASS_THRESHOLD;

  await prisma.gameResult.create({
    data: {
      sessionId: payload.sessionId,
      gameType: "OCULAR",
      passed,
      // Strip raw samples before persisting — only derived metrics stay in DB
      metrics: JSON.parse(
        JSON.stringify({
          totalSamples: metrics.totalSamples,
          validSamples: metrics.validSamples,
          nullRatio: metrics.nullRatio,
          avgDeviation: metrics.avgDeviation,
          accuracy: metrics.accuracy,
          saccadeCount: metrics.saccadeCount,
          smoothness: metrics.smoothness,
          sampleHz: metrics.sampleHz,
          pathSeed: payload.pathSeed,
          durationMs: payload.durationMs,
        }),
      ),
    },
  });

  return { score, passed, metrics };
}
