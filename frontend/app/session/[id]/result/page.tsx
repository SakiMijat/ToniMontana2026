"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GameHeader } from "@/components/game-header";
import { TierResult } from "@/components/tier-result";
import { tierFromScore, type SwipeSubmitResponse } from "@/lib/types";

export default function SwipeResultPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [result, setResult] = useState<SwipeSubmitResponse | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(`safegate:result:${sessionId}`);
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setResult(JSON.parse(raw) as SwipeSubmitResponse);
    } catch {
      router.replace("/");
    }
  }, [sessionId, router]);

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-safegate-primary border-t-transparent shadow-glow" />
      </div>
    );
  }

  const tier = tierFromScore(result.score);

  return (
    <div className="flex min-h-screen flex-col">
      <GameHeader title="Result" progress={{ current: 3, total: 3 }} />
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
