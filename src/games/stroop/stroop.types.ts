export interface StroopAttempt {
  word: string;
  color: string;
  chosenColor: string;
  latencyMs: number;
}

export interface StroopSubmitPayload {
  sessionId: number;
  attempts: StroopAttempt[];
}

export interface StroopRoundResult extends StroopAttempt {
  correct: boolean;
}

export interface StroopMetrics {
  rounds: StroopRoundResult[];
  totalRounds: number;
  correctCount: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
}

export interface StroopGameResult {
  score: number;
  passed: boolean;
  metrics: StroopMetrics;
}
