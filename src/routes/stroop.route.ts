import { Router } from "express";

import { scoreAndPersistStroopGame } from "../games/stroop/stroop.service";
import type { StroopAttempt, StroopSubmitPayload } from "../games/stroop/stroop.types";
import { createGameSubmitHandler } from "../lib/game-submit";

export const stroopRouter = Router();

const MIN_ROUNDS = 5;
const MAX_ROUNDS = 10;

function parseSessionId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function isValidAttempt(value: unknown): value is StroopAttempt {
  if (typeof value !== "object" || value === null) return false;
  const attempt = value as Record<string, unknown>;
  return (
    typeof attempt.word === "string" &&
    typeof attempt.color === "string" &&
    typeof attempt.chosenColor === "string" &&
    typeof attempt.latencyMs === "number" &&
    attempt.latencyMs > 0
  );
}

function parsePayload(body: unknown): StroopSubmitPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const payload = body as Record<string, unknown>;
  const sessionId = parseSessionId(payload.sessionId);
  if (!sessionId) return null;
  if (!Array.isArray(payload.attempts)) return null;
  if (payload.attempts.length < MIN_ROUNDS || payload.attempts.length > MAX_ROUNDS) return null;
  if (!payload.attempts.every(isValidAttempt)) return null;
  return { sessionId, attempts: payload.attempts as StroopAttempt[] };
}

stroopRouter.post(
  "/submit",
  createGameSubmitHandler({
    gameType: "STROOP",
    invalidDetail:
      `Provide sessionId and attempts (${MIN_ROUNDS}–${MAX_ROUNDS} items with ` +
      "{ word: string, color: string, chosenColor: string, latencyMs: number > 0 }).",
    parsePayload,
    score: (payload, stepIndex) =>
      scoreAndPersistStroopGame(payload.sessionId, payload.attempts, stepIndex),
  }),
);
