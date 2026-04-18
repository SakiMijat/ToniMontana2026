import { Router, type Request, type Response } from "express";

import { prisma } from "../lib/prisma";
import {
  OcularValidationError,
  scoreAndPersistOcularGame,
} from "../games/ocular/ocular.service";
import type {
  OcularSample,
  OcularSubmitPayload,
} from "../games/ocular/ocular.types";

export const ocularRouter = Router();

const MIN_SAMPLES = 100; // ~ 10 Hz × 10 s floor
const MAX_SAMPLES = 5_000; // generous ceiling for 60 Hz × 60 s

function isValidSample(s: unknown): s is OcularSample {
  if (typeof s !== "object" || s === null) return false;
  const sample = s as Record<string, unknown>;
  if (typeof sample.t !== "number" || !Number.isFinite(sample.t) || sample.t < 0) {
    return false;
  }
  const gxOk = sample.gx === null || (typeof sample.gx === "number" && Number.isFinite(sample.gx));
  const gyOk = sample.gy === null || (typeof sample.gy === "number" && Number.isFinite(sample.gy));
  return gxOk && gyOk;
}

function parsePayload(body: unknown): OcularSubmitPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.sessionId !== "string" || !b.sessionId) return null;
  if (typeof b.pathSeed !== "number" || !Number.isFinite(b.pathSeed)) return null;
  if (typeof b.startedAt !== "number" || !Number.isFinite(b.startedAt)) return null;
  if (typeof b.durationMs !== "number" || !Number.isFinite(b.durationMs)) return null;
  if (!Array.isArray(b.samples)) return null;
  if (b.samples.length < MIN_SAMPLES || b.samples.length > MAX_SAMPLES) return null;
  if (!b.samples.every(isValidSample)) return null;
  return {
    sessionId: b.sessionId,
    pathSeed: b.pathSeed,
    startedAt: b.startedAt,
    durationMs: b.durationMs,
    samples: b.samples as OcularSample[],
  };
}

/**
 * POST /api/games/ocular/submit
 *
 * Body: OcularSubmitPayload
 * Response 200: { passed, score, metrics }
 * Response 400: validation / sanity check failure
 * Response 404: session not found
 */
ocularRouter.post("/submit", async (req: Request, res: Response) => {
  const payload = parsePayload(req.body);
  if (!payload) {
    res.status(400).json({
      error: "Invalid payload",
      detail: `Need sessionId, pathSeed, startedAt, durationMs, samples[${MIN_SAMPLES}–${MAX_SAMPLES}] each with { t, gx, gy }.`,
    });
    return;
  }

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
  });
  if (!session) {
    res.status(404).json({ error: "Session not found", sessionId: payload.sessionId });
    return;
  }

  try {
    const result = await scoreAndPersistOcularGame(payload);
    res.status(200).json({
      gameType: "OCULAR",
      sessionId: payload.sessionId,
      passed: result.passed,
      score: result.score,
      metrics: result.metrics,
    });
  } catch (err) {
    if (err instanceof OcularValidationError) {
      res.status(400).json({ error: "Sanity check failed", reason: err.reason, detail: err.message });
      return;
    }
    throw err;
  }
});
