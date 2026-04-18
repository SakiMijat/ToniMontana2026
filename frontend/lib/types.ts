// Mirrors src/games/swipe/swipe.types.ts on the backend.

export type SwipeSide = "LEFT" | "RIGHT";
export type ChallengeType =
  | "SWIPE"
  | "REFLEX"
  | "TIMER"
  | "STROOP"
  | "MEMORY"
  | "REVERSE_TYPE"
  | "MAZE"
  | "OCULAR";
export type SessionBinaryResult = 0 | 1;

export interface SwipeAttempt {
  number: number;
  chosenSide: SwipeSide;
  latencyMs: number;
}

export interface ReflexAttempt {
  round: number;
  latencyMs: number;
  falseStart: boolean;
  timedOut: boolean;
}

export interface TimerAttempt {
  round: number;
  latencyMs: number;
  falseStart: boolean;
  timedOut: boolean;
}

export interface StroopAttempt {
  word: string;
  color: string;
  chosenColor: string;
  latencyMs: number;
}

export interface MemoryAttempt {
  sequence: number[];
  chosen: number[];
  latencyMs: number;
}

export interface ReverseTypeAttempt {
  word: string;
  expected: string;
  typed: string;
  latencyMs: number;
}

export interface MazeAttempt {
  checkpointCount: number;
  hits: number;
  misses: number;
  completionMs: number;
}

export interface OcularAttempt {
  round: number;
  hit: boolean;
  latencyMs: number;
  targetX: number;
  targetY: number;
}

export interface SwipeRoundResult extends SwipeAttempt {
  correctSide: SwipeSide;
  correct: boolean;
}

export interface ReflexRoundResult extends ReflexAttempt {
  successful: boolean;
}

export interface TimerRoundResult extends TimerAttempt {
  successful: boolean;
}

export interface StroopRoundResult extends StroopAttempt {
  correct: boolean;
}

export interface MemoryRoundResult extends MemoryAttempt {
  matchedCount: number;
  exact: boolean;
}

export interface ReverseTypeRoundResult extends ReverseTypeAttempt {
  matchedChars: number;
  correct: boolean;
}

export interface MazeRoundResult extends MazeAttempt {
  accuracy: number;
  successful: boolean;
}

export interface OcularRoundResult extends OcularAttempt {
  successful: boolean;
}

export interface SwipeMetrics {
  rounds: SwipeRoundResult[];
  totalRounds: number;
  correctCount: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
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

export interface StroopMetrics {
  rounds: StroopRoundResult[];
  totalRounds: number;
  correctCount: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
}

export interface MemoryMetrics {
  rounds: MemoryRoundResult[];
  totalRounds: number;
  exactCount: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
}

export interface ReverseTypeMetrics {
  rounds: ReverseTypeRoundResult[];
  totalRounds: number;
  correctCount: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
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

export interface OcularMetrics {
  rounds: OcularRoundResult[];
  totalRounds: number;
  hitCount: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
}

export interface BaseGameSubmitResponse {
  gameType: ChallengeType;
  sessionId: string;
  passed: boolean;
  score: number;
  sessionCompleted: boolean;
  sessionResult: SessionBinaryResult | null;
  currentStep: number;
  totalSteps: number;
  nextChallengeType?: ChallengeType;
  nextChallengePath?: string;
}

export interface SwipeSubmitResponse extends BaseGameSubmitResponse {
  gameType: "SWIPE";
  metrics: SwipeMetrics;
}

// ───── Ocular (Game 1) — mirrors src/games/ocular/ocular.types.ts ─────

export interface OcularSample {
  t: number;
  gx: number | null;
  gy: number | null;
}

export interface OcularSubmitPayload {
  sessionId: string;
  pathSeed: number;
  startedAt: number;
  durationMs: number;
  samples: OcularSample[];
}

export interface OcularMetrics {
  totalSamples: number;
  validSamples: number;
  nullRatio: number;
  avgDeviation: number;
  accuracy: number;
  saccadeCount: number;
  smoothness: number;
  sampleHz: number;
}

export interface OcularSubmitResponse {
  gameType: "OCULAR";
  sessionId: string;
  passed: boolean;
  score: number;
  metrics: OcularMetrics;
}

export type OcularRejectReason =
  | "SAMPLE_RATE_TOO_LOW"
  | "TOO_MANY_NULL_SAMPLES"
  | "STATIC_GAZE"
  | "DURATION_OUT_OF_RANGE";

export interface SessionStartResponse {
  sessionId: string;
  userId: number;
  partnerId: number;
  challengeType: ChallengeType;
  challengePath: string;
  currentStep: number;
  totalSteps: number;
  resumed: boolean;
  sessionStatus: "ACTIVE";
}

export type Tier = "APPROVED" | "RECALIBRATE" | "DENIED";

// Tier thresholds from documentation.md §2 "Escalation Ladder"
export function tierFromScore(score: number): Tier {
  if (score >= 0.8) return "APPROVED";
  if (score >= 0.5) return "RECALIBRATE";
  return "DENIED";
}

export function tierFromSessionResult(result: SessionBinaryResult): Tier {
  return result === 1 ? "APPROVED" : "DENIED";
}
