import { Router, type Request, type Response } from "express";

import {
  OcularValidationError,
  scoreAndPersistOcularGame,
  scoreTrackedOcularGame,
} from "../games/ocular/ocular.service";
import type {
  OcularAttempt,
  OcularSubmitPayload,
  TrackedOcularSample,
  TrackedOcularSubmitPayload,
} from "../games/ocular/ocular.types";
import { createGameSubmitHandler } from "../lib/game-submit";

export const ocularRouter = Router();

const MIN_ROUNDS = 4;
const MAX_ROUNDS = 8;
const MIN_SAMPLES = 100;
const MAX_SAMPLES = 5_000;

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

function isValidSample(sample: unknown): sample is TrackedOcularSample {
  if (typeof sample !== "object" || sample === null) return false;
  const value = sample as Record<string, unknown>;
  if (typeof value.t !== "number" || !Number.isFinite(value.t) || value.t < 0) return false;
  const gxOk = value.gx === null || (typeof value.gx === "number" && Number.isFinite(value.gx));
  const gyOk = value.gy === null || (typeof value.gy === "number" && Number.isFinite(value.gy));
  return gxOk && gyOk;
}

function parseTrackedPayload(body: unknown): TrackedOcularSubmitPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const payload = body as Record<string, unknown>;
  if (typeof payload.sessionId !== "string" || !payload.sessionId) return null;
  if (typeof payload.pathSeed !== "number" || !Number.isFinite(payload.pathSeed)) return null;
  if (typeof payload.startedAt !== "number" || !Number.isFinite(payload.startedAt)) return null;
  if (typeof payload.durationMs !== "number" || !Number.isFinite(payload.durationMs)) return null;
  if (!Array.isArray(payload.samples)) return null;
  if (payload.samples.length < MIN_SAMPLES || payload.samples.length > MAX_SAMPLES) return null;
  if (!payload.samples.every(isValidSample)) return null;

  return {
    sessionId: payload.sessionId,
    pathSeed: payload.pathSeed,
    startedAt: payload.startedAt,
    durationMs: payload.durationMs,
    samples: payload.samples as TrackedOcularSample[],
  };
}

ocularRouter.post(
  "/submit",
  createGameSubmitHandler({
    gameType: "OCULAR",
    invalidDetail:
      `Provide sessionId and attempts (${MIN_ROUNDS}-${MAX_ROUNDS} items with ` +
      "{ round: int, hit: boolean, latencyMs: number >= 0, targetX: number, targetY: number }).",
    parsePayload,
    score: (payload, stepIndex) =>
      scoreAndPersistOcularGame(payload.sessionId, payload.attempts, stepIndex),
  }),
);

ocularRouter.post("/track-submit", (req: Request, res: Response) => {
  const payload = parseTrackedPayload(req.body);
  if (!payload) {
    res.status(400).json({
      error: "Invalid payload",
      detail:
        `Need sessionId, pathSeed, startedAt, durationMs, samples[${MIN_SAMPLES}-${MAX_SAMPLES}] ` +
        "each with { t, gx, gy }.",
    });
    return;
  }

  try {
    const result = scoreTrackedOcularGame(payload);
    res.status(200).json({
      gameType: "OCULAR",
      sessionId: payload.sessionId,
      passed: result.passed,
      score: result.score,
      metrics: result.metrics,
    });
  } catch (error) {
    if (error instanceof OcularValidationError) {
      res.status(400).json({
        error: "Sanity check failed",
        reason: error.reason,
        detail: error.message,
      });
      return;
    }

    throw error;
  }
});
