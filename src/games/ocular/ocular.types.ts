/** Single gaze sample captured during the pursuit round. */
export interface OcularSample {
  /** ms since round start */
  t: number;
  /** normalized gaze x in [0, 1]; null if gaze lost */
  gx: number | null;
  /** normalized gaze y in [0, 1]; null if gaze lost */
  gy: number | null;
}

export interface OcularSubmitPayload {
  sessionId: string;
  /** Drives Lissajous phase offsets so server can reconstruct target path */
  pathSeed: number;
  /** client epoch ms when round began — for sanity only */
  startedAt: number;
  /** intended round duration (ms) */
  durationMs: number;
  samples: OcularSample[];
}

export interface OcularMetrics {
  totalSamples: number;
  validSamples: number;
  nullRatio: number;
  /** mean normalized distance between gaze and target (0 = perfect, 0.3+ = total miss) */
  avgDeviation: number;
  accuracy: number;
  /** count of gaze-velocity spikes exceeding 3× target velocity */
  saccadeCount: number;
  smoothness: number;
  /** observed sampling rate in Hz */
  sampleHz: number;
}

export interface OcularGameResult {
  score: number;
  passed: boolean;
  metrics: OcularMetrics;
}

/** Reason codes returned to the client when a payload fails sanity checks. */
export type OcularRejectReason =
  | "SAMPLE_RATE_TOO_LOW"
  | "TOO_MANY_NULL_SAMPLES"
  | "STATIC_GAZE"
  | "DURATION_OUT_OF_RANGE";
