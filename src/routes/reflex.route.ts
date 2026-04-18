import { Router } from "express";

import { scoreAndPersistReflexGame } from "../games/reflex/reflex.service";
import type { ReflexAttempt, ReflexSubmitPayload } from "../games/reflex/reflex.types";
import { createGameSubmitHandler } from "../lib/game-submit";

export const reflexRouter = Router();

const MIN_ROUNDS = 4;
const MAX_ROUNDS = 10;

function parseSessionId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function isValidAttempt(value: unknown): value is ReflexAttempt {
  if (typeof value !== "object" || value === null) return false;
  const attempt = value as Record<string, unknown>;

  return (
    Number.isInteger(attempt.round) &&
    typeof attempt.latencyMs === "number" &&
    attempt.latencyMs >= 0 &&
    typeof attempt.falseStart === "boolean" &&
    typeof attempt.timedOut === "boolean"
  );
}

function parsePayload(body: unknown): ReflexSubmitPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const payload = body as Record<string, unknown>;
  const sessionId = parseSessionId(payload.sessionId);
  if (!sessionId) return null;
  if (!Array.isArray(payload.attempts)) return null;
  if (payload.attempts.length < MIN_ROUNDS || payload.attempts.length > MAX_ROUNDS) return null;
  if (!payload.attempts.every(isValidAttempt)) return null;

  return {
    sessionId,
    attempts: payload.attempts as ReflexAttempt[],
  };
}

reflexRouter.post(
  "/submit",
  createGameSubmitHandler({
    gameType: "REFLEX",
    invalidDetail:
      `Provide sessionId and attempts (${MIN_ROUNDS}–${MAX_ROUNDS} items with ` +
      "{ round: int, latencyMs: number >= 0, falseStart: boolean, timedOut: boolean }).",
    parsePayload,
    score: (payload, stepIndex) =>
      scoreAndPersistReflexGame(payload.sessionId, payload.attempts, stepIndex),
  }),
);
