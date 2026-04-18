export interface ReverseTypeAttempt {
  word: string;
  expected: string;
  typed: string;
  latencyMs: number;
}

export interface ReverseTypeSubmitPayload {
  sessionId: number;
  attempts: ReverseTypeAttempt[];
}

export interface ReverseTypeRoundResult extends ReverseTypeAttempt {
  matchedChars: number;
  correct: boolean;
}

export interface ReverseTypeMetrics {
  rounds: ReverseTypeRoundResult[];
  totalRounds: number;
  correctCount: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
}

export interface ReverseTypeGameResult {
  score: number;
  passed: boolean;
  metrics: ReverseTypeMetrics;
}
