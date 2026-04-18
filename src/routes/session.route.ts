import { Router, type Request, type Response } from "express";
import type { GameType } from "@prisma/client";

import { gamePath, pickSessionGames, TOTAL_SESSION_STEPS } from "../lib/game-catalog";
import { prisma } from "../lib/prisma";
import {
  isSessionActive,
  resolveCurrentGame,
  SESSION_FLOW_SELECT,
} from "../lib/session-flow";

export const sessionRouter = Router();

const ONE_HOUR_MS = 60 * 60 * 1000;

function parsePositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return parsed > 0 ? parsed : null;
  }

  return null;
}

async function nextSessionId() {
  // MongoDB does not auto-increment numeric ids, so we derive the next public session id here.
  const latest = await prisma.session.findFirst({
    orderBy: { sessionId: "desc" },
    select: { sessionId: true },
  });

  return (latest?.sessionId ?? 10000) + 1;
}

function startResponse(params: {
  sessionId: number;
  partnerId: number;
  userId: number;
  currentStep: number;
  challengeType: GameType;
  resumed: boolean;
}) {
  return {
    sessionId: String(params.sessionId),
    userId: params.userId,
    partnerId: params.partnerId,
    challengeType: params.challengeType,
    challengePath: gamePath(params.sessionId, params.challengeType),
    currentStep: params.currentStep,
    totalSteps: TOTAL_SESSION_STEPS,
    resumed: params.resumed,
    sessionStatus: "ACTIVE" as const,
  };
}

/**
 * POST /api/sessions/start
 *
 * Validates whether a user is allowed to begin a new challenge session.
 * Body: { partnerId: number, userId: number }
 * Success 200: { sessionId, partnerId, userId, challengeType, challengePath }
 * Failure 403: last failed session ended less than 1 hour ago
 *
 */
sessionRouter.post("/start", async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as { partnerId?: unknown; userId?: unknown };
  const partnerId = parsePositiveInt(body.partnerId);
  const userId = parsePositiveInt(body.userId);

  if (!partnerId || !userId) {
    res.status(400).json({
      error: "Invalid payload",
      detail: "Provide partnerId and userId as positive integers.",
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      externalUserId_partnerId: {
        externalUserId: userId,
        partnerId,
      },
    },
    select: {
      userRecordId: true,
    },
  });

  if (!user) {
    res.status(404).json({
      error: "User not found",
      detail: `No user exists for partnerId=${partnerId} and userId=${userId}.`,
    });
    return;
  }

  const lastSession = await prisma.session.findFirst({
    where: { userId: user.userRecordId },
    orderBy: { startTime: "desc" },
    select: SESSION_FLOW_SELECT,
  });

  if (lastSession && isSessionActive(lastSession)) {
    const currentGame = resolveCurrentGame(lastSession);
    if (currentGame) {
      res.status(200).json(
        startResponse({
          sessionId: lastSession.sessionId,
          partnerId,
          userId,
          currentStep: lastSession.currentStep ?? 1,
          challengeType: currentGame,
          resumed: true,
        }),
      );
      return;
    }
  }

  if (lastSession?.result === 0 && lastSession.endTime) {
    const blockedUntil = new Date(lastSession.endTime.getTime() + ONE_HOUR_MS);
    if (blockedUntil.getTime() > Date.now()) {
      res.status(403).json({
        error: "Access denied",
        detail: "The last challenge failed less than 1 hour ago. Please try again later.",
        blockedUntil: blockedUntil.toISOString(),
        lastSessionId: String(lastSession.sessionId),
      });
      return;
    }
  }

  const sessionHistory = await prisma.session.findMany({
    where: { userId: user.userRecordId },
    select: {
      firstGame: true,
      secondGame: true,
    },
  });

  const sessionId = await nextSessionId();
  const games = pickSessionGames(sessionHistory);
  const session = await prisma.session.create({
    data: {
      sessionId,
      userId: user.userRecordId,
      startTime: new Date(),
      status: "ACTIVE",
      firstGame: games.firstGame,
      secondGame: games.secondGame,
      currentGame: games.firstGame,
      currentStep: 1,
    },
    select: {
      sessionId: true,
      currentGame: true,
      currentStep: true,
    },
  });

  res.status(200).json(
    startResponse({
      sessionId: session.sessionId,
      partnerId,
      userId,
      currentStep: session.currentStep ?? 1,
      challengeType: session.currentGame ?? games.firstGame,
      resumed: false,
    }),
  );
});
