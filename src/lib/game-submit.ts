import type { GameType } from "@prisma/client";
import type { Request, Response } from "express";

import { prisma } from "./prisma";
import {
  applySessionGameOutcome,
  currentStepNumber,
  isSessionActive,
  resolveCurrentGame,
  SESSION_FLOW_SELECT,
} from "./session-flow";

interface ParsedGamePayload {
  sessionId: number;
}

interface GameScoreResult {
  score: number;
  passed: boolean;
  metrics: unknown;
}

interface GameSubmitOptions<TPayload extends ParsedGamePayload> {
  gameType: GameType;
  invalidDetail: string;
  parsePayload: (body: unknown) => TPayload | null;
  score: (payload: TPayload, stepIndex: number) => Promise<GameScoreResult>;
}

export function createGameSubmitHandler<TPayload extends ParsedGamePayload>(
  options: GameSubmitOptions<TPayload>,
) {
  return async (req: Request, res: Response) => {
    const payload = options.parsePayload(req.body);
    if (!payload) {
      res.status(400).json({
        error: "Invalid payload",
        detail: options.invalidDetail,
      });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { sessionId: payload.sessionId },
      select: SESSION_FLOW_SELECT,
    });

    if (!session) {
      res.status(404).json({ error: "Session not found", sessionId: payload.sessionId });
      return;
    }

    if (!isSessionActive(session)) {
      res.status(409).json({ error: "Session is no longer active" });
      return;
    }

    if (resolveCurrentGame(session) !== options.gameType) {
      res.status(409).json({
        error: `${options.gameType} is not the active game for this session`,
      });
      return;
    }

    const stepIndex = currentStepNumber(session);
    const result = await options.score(payload, stepIndex);
    const transition = await applySessionGameOutcome(
      session,
      options.gameType,
      result.passed,
    );

    res.status(200).json({
      gameType: options.gameType,
      sessionId: String(payload.sessionId),
      passed: result.passed,
      score: result.score,
      metrics: result.metrics,
      ...transition,
    });
  };
}
