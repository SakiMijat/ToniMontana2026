export interface MazeAttempt {
  checkpointCount: number;
  hits: number;
  misses: number;
  completionMs: number;
}

export interface MazeSubmitPayload {
  sessionId: number;
  attempts: MazeAttempt[];
}

export interface MazeRoundResult extends MazeAttempt {
  accuracy: number;
  successful: boolean;
}

export interface MazeMetrics {
  rounds: MazeRoundResult[];
  totalRounds: number;
  successfulRounds: number;
  totalMisses: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
}

export interface MazeGameResult {
  score: number;
  passed: boolean;
  metrics: MazeMetrics;
}
