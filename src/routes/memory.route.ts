import { Router } from "express";

import { scoreAndPersistMemoryGame } from "../games/memory/memory.service";
import type { MemoryAttempt, MemorySubmitPayload } from "../games/memory/memory.types";
import { createGameSubmitHandler } from "../lib/game-submit";

export const memoryRouter = Router();

const MIN_ROUNDS = 3;
const MAX_ROUNDS = 5;

function parseSessionId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function isValidAttempt(value: unknown): value is MemoryAttempt {
  if (typeof value !== "object" || value === null) return false;
  const attempt = value as Record<string, unknown>;
  return (
    Array.isArray(attempt.sequence) &&
    Array.isArray(attempt.chosen) &&
    attempt.sequence.every((cell) => Number.isInteger(cell)) &&
    attempt.chosen.every((cell) => Number.isInteger(cell)) &&
    typeof attempt.latencyMs === "number" &&
    attempt.latencyMs > 0
  );
}

function parsePayload(body: unknown): MemorySubmitPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const payload = body as Record<string, unknown>;
  const sessionId = parseSessionId(payload.sessionId);
  if (!sessionId) return null;
  if (!Array.isArray(payload.attempts)) return null;
  if (payload.attempts.length < MIN_ROUNDS || payload.attempts.length > MAX_ROUNDS) return null;
  if (!payload.attempts.every(isValidAttempt)) return null;
  return { sessionId, attempts: payload.attempts as MemoryAttempt[] };
}

memoryRouter.post(
  "/submit",
  createGameSubmitHandler({
    gameType: "MEMORY",
    invalidDetail:
      `Provide sessionId and attempts (${MIN_ROUNDS}–${MAX_ROUNDS} items with ` +
      "{ sequence: number[], chosen: number[], latencyMs: number > 0 }).",
    parsePayload,
    score: (payload, stepIndex) =>
      scoreAndPersistMemoryGame(payload.sessionId, payload.attempts, stepIndex),
  }),
);
