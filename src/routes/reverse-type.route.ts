import { Router } from "express";

import { scoreAndPersistReverseTypeGame } from "../games/reverse-type/reverse-type.service";
import type {
  ReverseTypeAttempt,
  ReverseTypeSubmitPayload,
} from "../games/reverse-type/reverse-type.types";
import { createGameSubmitHandler } from "../lib/game-submit";

export const reverseTypeRouter = Router();

const MIN_ROUNDS = 3;
const MAX_ROUNDS = 5;

function parseSessionId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function isValidAttempt(value: unknown): value is ReverseTypeAttempt {
  if (typeof value !== "object" || value === null) return false;
  const attempt = value as Record<string, unknown>;
  return (
    typeof attempt.word === "string" &&
    typeof attempt.expected === "string" &&
    typeof attempt.typed === "string" &&
    typeof attempt.latencyMs === "number" &&
    attempt.latencyMs > 0
  );
}

function parsePayload(body: unknown): ReverseTypeSubmitPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const payload = body as Record<string, unknown>;
  const sessionId = parseSessionId(payload.sessionId);
  if (!sessionId) return null;
  if (!Array.isArray(payload.attempts)) return null;
  if (payload.attempts.length < MIN_ROUNDS || payload.attempts.length > MAX_ROUNDS) return null;
  if (!payload.attempts.every(isValidAttempt)) return null;
  return { sessionId, attempts: payload.attempts as ReverseTypeAttempt[] };
}

reverseTypeRouter.post(
  "/submit",
  createGameSubmitHandler({
    gameType: "REVERSE_TYPE",
    invalidDetail:
      `Provide sessionId and attempts (${MIN_ROUNDS}–${MAX_ROUNDS} items with ` +
      "{ word: string, expected: string, typed: string, latencyMs: number > 0 }).",
    parsePayload,
    score: (payload, stepIndex) =>
      scoreAndPersistReverseTypeGame(payload.sessionId, payload.attempts, stepIndex),
  }),
);
