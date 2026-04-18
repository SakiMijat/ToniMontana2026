export interface OcularAttempt {
  round: number;
  hit: boolean;
  latencyMs: number;
  targetX: number;
  targetY: number;
}

export interface OcularSubmitPayload {
  sessionId: number;
  attempts: OcularAttempt[];
}

export interface OcularRoundResult extends OcularAttempt {
  successful: boolean;
}

export interface OcularMetrics {
  rounds: OcularRoundResult[];
  totalRounds: number;
  hitCount: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
}

export interface OcularGameResult {
  score: number;
  passed: boolean;
  metrics: OcularMetrics;
}

export interface TrackedOcularSample {
  t: number;
  gx: number | null;
  gy: number | null;
}

export interface TrackedOcularSubmitPayload {
  sessionId: string;
  pathSeed: number;
  startedAt: number;
  durationMs: number;
  samples: TrackedOcularSample[];
}

export interface TrackedOcularMetrics {
  totalSamples: number;
  validSamples: number;
  nullRatio: number;
  avgDeviation: number;
  accuracy: number;
  saccadeCount: number;
  smoothness: number;
  sampleHz: number;
}

export interface TrackedOcularGameResult {
  score: number;
  passed: boolean;
  metrics: TrackedOcularMetrics;
}

export type OcularRejectReason =
  | "SAMPLE_RATE_TOO_LOW"
  | "TOO_MANY_NULL_SAMPLES"
  | "STATIC_GAZE"
  | "DURATION_OUT_OF_RANGE";
