import { Router } from "express";

import { scoreAndPersistOcularGame } from "../games/ocular/ocular.service";
import type { OcularAttempt, OcularSubmitPayload } from "../games/ocular/ocular.types";
import { createGameSubmitHandler } from "../lib/game-submit";

export const ocularRouter = Router();

const MIN_ROUNDS = 4;
const MAX_ROUNDS = 8;

function parseSessionId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function isValidAttempt(value: unknown): value is OcularAttempt {
  if (typeof value !== "object" || value === null) return false;
  const attempt = value as Record<string, unknown>;
  return (
    Number.isInteger(attempt.round) &&
    typeof attempt.hit === "boolean" &&
    typeof attempt.latencyMs === "number" &&
    attempt.latencyMs >= 0 &&
    typeof attempt.targetX === "number" &&
    typeof attempt.targetY === "number"
  );
}

function parsePayload(body: unknown): OcularSubmitPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const payload = body as Record<string, unknown>;
  const sessionId = parseSessionId(payload.sessionId);
  if (!sessionId) return null;
  if (!Array.isArray(payload.attempts)) return null;
  if (payload.attempts.length < MIN_ROUNDS || payload.attempts.length > MAX_ROUNDS) return null;
  if (!payload.attempts.every(isValidAttempt)) return null;
  return { sessionId, attempts: payload.attempts as OcularAttempt[] };
}

ocularRouter.post(
  "/submit",
  createGameSubmitHandler({
    gameType: "OCULAR",
    invalidDetail:
      `Provide sessionId and attempts (${MIN_ROUNDS}–${MAX_ROUNDS} items with ` +
      "{ round: int, hit: boolean, latencyMs: number >= 0, targetX: number, targetY: number }).",
    parsePayload,
    score: (payload, stepIndex) =>
      scoreAndPersistOcularGame(payload.sessionId, payload.attempts, stepIndex),
  }),
);
