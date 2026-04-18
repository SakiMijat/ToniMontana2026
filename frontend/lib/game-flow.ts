import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { SessionGameResult } from "./types";

export function advanceOrFinishSession(
  router: AppRouterInstance,
  sessionId: string,
  result: SessionGameResult,
) {
  if (!result.sessionCompleted && result.nextChallengePath) {
    router.push(result.nextChallengePath);
    return;
  }

  if (result.sessionCompleted) {
    window.localStorage.setItem(`safegate:result:${sessionId}`, JSON.stringify(result));
    router.push(`/session/${sessionId}/result`);
    return;
  }

  throw new Error("The session is active, but no next challenge was returned.");
}
