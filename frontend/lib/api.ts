import type {
  MazeAttempt,
  MazeSubmitResponse,
  MemoryAttempt,
  MemorySubmitResponse,
  OcularAttempt,
  OcularSubmitResponse,
  ReflexAttempt,
  ReflexSubmitResponse,
  ReverseTypeAttempt,
  ReverseTypeSubmitResponse,
  SessionStartResponse,
  StroopAttempt,
  StroopSubmitResponse,
  SwipeAttempt,
  SwipeSubmitResponse,
  TimerAttempt,
  TimerSubmitResponse,
  TrackedOcularSubmitPayload,
  TrackedOcularSubmitResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function tryParseJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  const raw = await res.text().catch(() => "");
  const payload = raw ? tryParseJson(raw) : null;

  if (!res.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? payload.detail
        : payload && typeof payload === "object" && "error" in payload
          ? payload.error
          : raw;

    throw new Error(
      typeof detail === "string" && detail
        ? detail
        : `POST ${path} failed with status ${res.status}`,
    );
  }

  return payload as T;
}

export function startSession(input: {
  partnerId: number;
  userId: number;
}): Promise<SessionStartResponse> {
  return postJson<SessionStartResponse>("/api/sessions/start", input);
}

export function submitSwipeGame(
  sessionId: string,
  attempts: SwipeAttempt[],
): Promise<SwipeSubmitResponse> {
  return postJson<SwipeSubmitResponse>("/api/games/swipe/submit", {
    sessionId,
    attempts,
  });
}

export function submitReflexGame(
  sessionId: string,
  attempts: ReflexAttempt[],
): Promise<ReflexSubmitResponse> {
  return postJson<ReflexSubmitResponse>("/api/games/reflex/submit", {
    sessionId,
    attempts,
  });
}

export function submitTimerGame(
  sessionId: string,
  attempts: TimerAttempt[],
): Promise<TimerSubmitResponse> {
  return postJson<TimerSubmitResponse>("/api/games/timer/submit", {
    sessionId,
    attempts,
  });
}

export function submitStroopGame(
  sessionId: string,
  attempts: StroopAttempt[],
): Promise<StroopSubmitResponse> {
  return postJson<StroopSubmitResponse>("/api/games/stroop/submit", {
    sessionId,
    attempts,
  });
}

export function submitMemoryGame(
  sessionId: string,
  attempts: MemoryAttempt[],
): Promise<MemorySubmitResponse> {
  return postJson<MemorySubmitResponse>("/api/games/memory/submit", {
    sessionId,
    attempts,
  });
}

export function submitReverseTypeGame(
  sessionId: string,
  attempts: ReverseTypeAttempt[],
): Promise<ReverseTypeSubmitResponse> {
  return postJson<ReverseTypeSubmitResponse>("/api/games/reverse-type/submit", {
    sessionId,
    attempts,
  });
}

export function submitMazeGame(
  sessionId: string,
  attempts: MazeAttempt[],
): Promise<MazeSubmitResponse> {
  return postJson<MazeSubmitResponse>("/api/games/maze/submit", {
    sessionId,
    attempts,
  });
}

export function submitOcularGame(
  sessionId: string,
  attempts: OcularAttempt[],
): Promise<OcularSubmitResponse> {
  return postJson<OcularSubmitResponse>("/api/games/ocular/submit", {
    sessionId,
    attempts,
  });
}

export function submitTrackedOcularGame(
  payload: TrackedOcularSubmitPayload,
): Promise<TrackedOcularSubmitResponse> {
  return postJson<TrackedOcularSubmitResponse>(
    "/api/games/ocular/track-submit",
    payload,
  );
}
