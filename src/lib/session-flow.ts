import type { GameType, SessionStatus } from "@prisma/client";

import { prisma } from "./prisma";
import { gamePath, TOTAL_SESSION_STEPS } from "./game-catalog";

export const SESSION_FLOW_SELECT = {
  sessionId: true,
  endTime: true,
  result: true,
  status: true,
  firstGame: true,
  secondGame: true,
  currentGame: true,
  currentStep: true,
} as const;

export interface SessionFlowSnapshot {
  sessionId: number;
  endTime: Date | null;
  result: number | null;
  status: SessionStatus | null;
  firstGame: GameType | null;
  secondGame: GameType | null;
  currentGame: GameType | null;
  currentStep: number | null;
}

export interface SessionTransition {
  sessionCompleted: boolean;
  sessionResult: 0 | 1 | null;
  currentStep: number;
  totalSteps: number;
  nextChallengeType?: GameType;
  nextChallengePath?: string;
}

export function isSessionActive(session: SessionFlowSnapshot): boolean {
  if (session.status === "ACTIVE") return true;
  return session.endTime === null && session.result === null;
}

export function resolveCurrentGame(session: SessionFlowSnapshot): GameType | null {
  if (session.currentGame) return session.currentGame;

  const step = session.currentStep ?? 1;
  if (step <= 1) return session.firstGame;
  if (step === 2) return session.secondGame;
  return null;
}

export function currentStepNumber(session: SessionFlowSnapshot): number {
  return session.currentStep ?? 1;
}

export async function applySessionGameOutcome(
  session: SessionFlowSnapshot,
  submittedGame: GameType,
  passed: boolean,
): Promise<SessionTransition> {
  const expectedGame = resolveCurrentGame(session);
  if (!expectedGame || expectedGame !== submittedGame) {
    throw new Error("Submitted game does not match the active session step.");
  }

  const step = currentStepNumber(session);

  if (!passed) {
    await prisma.session.update({
      where: { sessionId: session.sessionId },
      data: {
        endTime: new Date(),
        result: 0,
        status: "FAILED",
      },
    });

    return {
      sessionCompleted: true,
      sessionResult: 0,
      currentStep: step,
      totalSteps: TOTAL_SESSION_STEPS,
    };
  }

  if (step >= TOTAL_SESSION_STEPS) {
    await prisma.session.update({
      where: { sessionId: session.sessionId },
      data: {
        endTime: new Date(),
        result: 1,
        status: "PASSED",
      },
    });

    return {
      sessionCompleted: true,
      sessionResult: 1,
      currentStep: step,
      totalSteps: TOTAL_SESSION_STEPS,
    };
  }

  const nextGame = session.secondGame;
  if (!nextGame) {
    throw new Error("The next game is not configured for this session.");
  }

  await prisma.session.update({
    where: { sessionId: session.sessionId },
    data: {
      currentStep: step + 1,
      currentGame: nextGame,
      status: "ACTIVE",
    },
  });

  return {
    sessionCompleted: false,
    sessionResult: null,
    currentStep: step,
    totalSteps: TOTAL_SESSION_STEPS,
    nextChallengeType: nextGame,
    nextChallengePath: gamePath(session.sessionId, nextGame),
  };
}
