export interface TimerAttempt {
  round: number;
  latencyMs: number;
  falseStart: boolean;
  timedOut: boolean;
}

export interface TimerSubmitPayload {
  sessionId: number;
  attempts: TimerAttempt[];
}

export interface TimerRoundResult extends TimerAttempt {
  successful: boolean;
}

export interface TimerMetrics {
  rounds: TimerRoundResult[];
  totalRounds: number;
  successfulRounds: number;
  falseStarts: number;
  timedOutRounds: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
}

export interface TimerGameResult {
  score: number;
  passed: boolean;
  metrics: TimerMetrics;
}
