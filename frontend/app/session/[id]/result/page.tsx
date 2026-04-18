"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GameHeader } from "@/components/game-header";
import { TierResult } from "@/components/tier-result";
import { tierFromSessionResult, type SessionGameResult } from "@/lib/types";

export default function SwipeResultPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [result, setResult] = useState<SessionGameResult | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(`safegate:result:${sessionId}`);
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setResult(JSON.parse(raw) as SessionGameResult);
    } catch {
      router.replace("/");
    }
  }, [sessionId, router]);

  useEffect(() => {
    if (result && result.sessionResult === null) {
      router.replace("/");
    }
  }, [result, router]);

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-safegate-primary border-t-transparent shadow-glow" />
      </div>
    );
  }

  if (result.sessionResult === null) {
    return null;
  }

  const tier = tierFromSessionResult(result.sessionResult);

  return (
    <div className="flex min-h-screen flex-col">
      <GameHeader title="Result" progress={{ current: 2, total: 2 }} />
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <TierResult
          tier={tier}
          score={result.score}
          accuracy={result.metrics.accuracy}
          avgLatencyMs={result.metrics.avgLatencyMs}
          onRetry={() => {
            window.localStorage.removeItem(`safegate:result:${sessionId}`);
            router.push("/");
          }}
          onUnlock={() => {
            // Placeholder for the real "unlock vehicle" handoff to Avant2go.
            alert("🚗  Vehicle unlocked (demo)");
          }}
          onCallTaxi={() => {
            // Placeholder for Taxi/Uber deep link.
            alert("🚕  Taxi requested (demo)");
          }}
        />
      </main>
    </div>
  );
}
