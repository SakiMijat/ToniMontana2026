export interface MemoryAttempt {
  sequence: number[];
  chosen: number[];
  latencyMs: number;
}

export interface MemorySubmitPayload {
  sessionId: number;
  attempts: MemoryAttempt[];
}

export interface MemoryRoundResult extends MemoryAttempt {
  matchedCount: number;
  exact: boolean;
}

export interface MemoryMetrics {
  rounds: MemoryRoundResult[];
  totalRounds: number;
  exactCount: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
}

export interface MemoryGameResult {
  score: number;
  passed: boolean;
  metrics: MemoryMetrics;
}
