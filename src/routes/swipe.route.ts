import { Router } from "express";
import { scoreAndPersistSwipeGame } from "../games/swipe/swipe.service";
import type { SwipeAttempt, SwipeSubmitPayload } from "../games/swipe/swipe.types";
import { createGameSubmitHandler } from "../lib/game-submit";

export const swipeRouter = Router();

const MIN_ROUNDS = 5;
const MAX_ROUNDS = 20;

function parseSessionId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function isValidSide(side: unknown): side is "LEFT" | "RIGHT" {
  return side === "LEFT" || side === "RIGHT";
}

function isValidAttempt(a: unknown): a is SwipeAttempt {
  if (typeof a !== "object" || a === null) return false;
  const attempt = a as Record<string, unknown>;
  return (
    Number.isInteger(attempt.number) &&
    isValidSide(attempt.chosenSide) &&
    typeof attempt.latencyMs === "number" &&
    attempt.latencyMs > 0
  );
}

function parsePayload(body: unknown): SwipeSubmitPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const sessionId = parseSessionId(b.sessionId);
  if (!sessionId) return null;
  if (!Array.isArray(b.attempts)) return null;
  if (b.attempts.length < MIN_ROUNDS || b.attempts.length > MAX_ROUNDS) return null;
  if (!b.attempts.every(isValidAttempt)) return null;
  return { sessionId, attempts: b.attempts as SwipeAttempt[] };
}

swipeRouter.post(
  "/submit",
  createGameSubmitHandler({
    gameType: "SWIPE",
    invalidDetail:
      `Provide sessionId and attempts (${MIN_ROUNDS}–${MAX_ROUNDS} items with ` +
      "{ number: int, chosenSide: LEFT|RIGHT, latencyMs: number > 0 }).",
    parsePayload,
    score: (payload, stepIndex) =>
      scoreAndPersistSwipeGame(payload.sessionId, payload.attempts, stepIndex),
  }),
);
