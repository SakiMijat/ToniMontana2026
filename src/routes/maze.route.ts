import { Router } from "express";

import { scoreAndPersistMazeGame } from "../games/maze/maze.service";
import type { MazeAttempt, MazeSubmitPayload } from "../games/maze/maze.types";
import { createGameSubmitHandler } from "../lib/game-submit";

export const mazeRouter = Router();

const MIN_ROUNDS = 1;
const MAX_ROUNDS = 3;

function parseSessionId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function isValidAttempt(value: unknown): value is MazeAttempt {
  if (typeof value !== "object" || value === null) return false;
  const attempt = value as Record<string, unknown>;
  return (
    Number.isInteger(attempt.checkpointCount) &&
    Number.isInteger(attempt.hits) &&
    Number.isInteger(attempt.misses) &&
    typeof attempt.completionMs === "number" &&
    attempt.completionMs > 0
  );
}

function parsePayload(body: unknown): MazeSubmitPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const payload = body as Record<string, unknown>;
  const sessionId = parseSessionId(payload.sessionId);
  if (!sessionId) return null;
  if (!Array.isArray(payload.attempts)) return null;
  if (payload.attempts.length < MIN_ROUNDS || payload.attempts.length > MAX_ROUNDS) return null;
  if (!payload.attempts.every(isValidAttempt)) return null;
  return { sessionId, attempts: payload.attempts as MazeAttempt[] };
}

mazeRouter.post(
  "/submit",
  createGameSubmitHandler({
    gameType: "MAZE",
    invalidDetail:
      `Provide sessionId and attempts (${MIN_ROUNDS}–${MAX_ROUNDS} items with ` +
      "{ checkpointCount: int, hits: int, misses: int, completionMs: number > 0 }).",
    parsePayload,
    score: (payload, stepIndex) =>
      scoreAndPersistMazeGame(payload.sessionId, payload.attempts, stepIndex),
  }),
);
