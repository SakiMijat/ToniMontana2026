// Mirrors src/games/swipe/swipe.types.ts on the backend.

export type SwipeSide = "LEFT" | "RIGHT";

export interface SwipeAttempt {
  number: number;
  chosenSide: SwipeSide;
  latencyMs: number;
}

export interface SwipeRoundResult extends SwipeAttempt {
  correctSide: SwipeSide;
  correct: boolean;
}

export interface SwipeMetrics {
  rounds: SwipeRoundResult[];
  totalRounds: number;
  correctCount: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
}

export interface SwipeSubmitResponse {
  gameType: "SWIPE";
  sessionId: string;
  passed: boolean;
  score: number;
  metrics: SwipeMetrics;
}

export interface SessionStartResponse {
  sessionId: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "RECALIBRATING" | "DENIED";
}

export type Tier = "APPROVED" | "RECALIBRATE" | "DENIED";

// Tier thresholds from documentation.md §2 "Escalation Ladder"
export function tierFromScore(score: number): Tier {
  if (score >= 0.8) return "APPROVED";
  if (score >= 0.5) return "RECALIBRATE";
  return "DENIED";
}
