import { Router, type Request, type Response } from "express";

import { prisma } from "../lib/prisma";
import { scoreAndPersistSwipeGame } from "../games/swipe/swipe.service";
import type { SwipeAttempt, SwipeSubmitPayload } from "../games/swipe/swipe.types";

export const swipeRouter = Router();

const MIN_ROUNDS = 5;
const MAX_ROUNDS = 20;

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
  if (typeof b.sessionId !== "string" || !b.sessionId) return null;
  if (!Array.isArray(b.attempts)) return null;
  if (b.attempts.length < MIN_ROUNDS || b.attempts.length > MAX_ROUNDS) return null;
  if (!b.attempts.every(isValidAttempt)) return null;
  return { sessionId: b.sessionId, attempts: b.attempts as SwipeAttempt[] };
}

/**
 * POST /api/games/swipe/submit
 *
 * Body: SwipeSubmitPayload
 * Response 200: { passed, score, metrics }
 * Response 400: validation failure
 * Response 404: sessionId not found
 */
swipeRouter.post("/submit", async (req: Request, res: Response) => {
  const payload = parsePayload(req.body);
  if (!payload) {
    res.status(400).json({
      error: "Invalid payload",
      detail: `Provide sessionId (string) and attempts (${MIN_ROUNDS}–${MAX_ROUNDS} items with { number: int, chosenSide: LEFT|RIGHT, latencyMs: number > 0 }).`,
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

  const result = await scoreAndPersistSwipeGame(payload.sessionId, payload.attempts);

  res.status(200).json({
    gameType: "SWIPE",
    sessionId: payload.sessionId,
    passed: result.passed,
    score: result.score,
    metrics: result.metrics,
  });
});
