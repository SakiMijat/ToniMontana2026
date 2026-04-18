import type {
  OcularSubmitPayload,
  OcularSubmitResponse,
  SessionStartResponse,
  StroopAttempt,
  StroopSubmitResponse,
  SwipeAttempt,
  SwipeSubmitResponse,
  TimerAttempt,
  TimerSubmitResponse,
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

export function submitOcularGame(
  payload: OcularSubmitPayload,
): Promise<OcularSubmitResponse> {
  return postJson<OcularSubmitResponse>("/api/games/ocular/submit", payload);
}
