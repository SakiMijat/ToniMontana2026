export interface ReflexAttempt {
  round: number;
  latencyMs: number;
  falseStart: boolean;
  timedOut: boolean;
}

export interface ReflexSubmitPayload {
  sessionId: number;
  attempts: ReflexAttempt[];
}

export interface ReflexRoundResult extends ReflexAttempt {
  successful: boolean;
}

export interface ReflexMetrics {
  rounds: ReflexRoundResult[];
  totalRounds: number;
  successfulRounds: number;
  falseStarts: number;
  timedOutRounds: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
}

export interface ReflexGameResult {
  score: number;
  passed: boolean;
  metrics: ReflexMetrics;
}
