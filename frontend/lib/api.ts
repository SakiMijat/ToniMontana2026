import type {
  OcularSubmitPayload,
  OcularSubmitResponse,
  SessionStartResponse,
  SwipeAttempt,
  SwipeSubmitResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`POST ${path} failed: ${res.status} ${detail}`);
  }

  return (await res.json()) as T;
}

export async function startSession(): Promise<SessionStartResponse> {
  const raw = await postJson<{ _id: string; user_id: string }>("/api/sessions", {});
  return { sessionId: raw._id, userId: raw.user_id };
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
