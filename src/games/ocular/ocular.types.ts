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
