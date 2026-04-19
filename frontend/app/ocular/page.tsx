"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ArrowRight, Check, RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GameHeader } from "@/components/game-header";
import { OcularPursuitGame } from "@/components/ocular-pursuit-game";
import { WebGazerCalibration } from "@/components/webgazer-calibration";
import { WebGazerPermission } from "@/components/webgazer-permission";
import { submitOcularGame } from "@/lib/api";
import { completeGame } from "@/lib/game-flow";
import { newPathSeed } from "@/lib/ocular-path";
import { useWebEyeTrack } from "@/lib/use-web-eye-track";
import type { OcularSample, OcularSubmitResponse, Tier } from "@/lib/types";
import { tierFromScore } from "@/lib/types";

type Phase = "permission" | "calibrate" | "play" | "submitting" | "result" | "error";

const DURATION_MS = 10_000;

export default function OcularGamePage() {
  const router = useRouter();
  const sessionId = typeof window !== "undefined"
    ? (localStorage.getItem("safegate:session_id") ?? "")
    : "";

  const [phase, setPhase] = useState<Phase>("permission");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<OcularSubmitResponse | null>(null);
  const pathSeed = useMemo(() => newPathSeed(), []);
  const startedAtRef = useRef(Date.now());

  const {
    status,
    error: gazerError,
    gaze,
    init,
    teardown,
    recordCalibrationClick,
  } = useWebEyeTrack();

  // Abort if the tab is backgrounded mid-play — samples would be garbage.
  useEffect(() => {
    if (phase !== "play") return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        setPhase("error");
        setSubmitError("Game aborted — tab was hidden. Please try again.");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase]);

  const skipToSwipe = useCallback(() => {
    teardown().finally(() => router.replace(`/swipe`));
  }, [router, teardown]);

  const handleEnableCamera = useCallback(async () => {
    try {
      await init();
      setPhase("calibrate");
    } catch {
      // error surfaced via hook state; user can then click "Skip"
    }
  }, [init]);

  const handleCalibrationComplete = useCallback(() => {
    startedAtRef.current = Date.now();
    setPhase("play");
  }, []);

  const handleGameComplete = useCallback(
    async (samples: OcularSample[]) => {
      setPhase("submitting");
      setSubmitError(null);
      try {
        const submitted = await submitOcularGame({
          sessionId,
          pathSeed,
          startedAt: startedAtRef.current,
          durationMs: DURATION_MS,
          samples,
        });
        await teardown();
        setResult(submitted);
        setPhase("result");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Submission failed";
        setSubmitError(msg);
        setPhase("error");
      }
    },
    [sessionId, pathSeed, teardown, router],
  );

  // ────────── Render per phase ──────────

  if (phase === "permission") {
    return (
      <div className="flex min-h-screen flex-col">
        <GameHeader title="Ocular Pursuit" progress={{ current: 1, total: 3 }} />
        <main className="flex flex-1 items-center justify-center py-10">
          <WebGazerPermission
            loading={status === "loading"}
            error={gazerError}
            onEnable={handleEnableCamera}
            onSkip={skipToSwipe}
          />
        </main>
      </div>
    );
  }

  if (phase === "calibrate") {
    return (
      <div className="min-h-screen">
        <GameHeader title="Calibration" progress={{ current: 1, total: 3 }} />
        <WebGazerCalibration
          onCalibrationClick={recordCalibrationClick}
          onComplete={handleCalibrationComplete}
          gaze={gaze}
        />
      </div>
    );
  }

  if (phase === "play") {
    return (
      <OcularPursuitGame
        pathSeed={pathSeed}
        gaze={gaze}
        durationMs={DURATION_MS}
        onComplete={handleGameComplete}
      />
    );
  }

  if (phase === "result" && result) {
    const tier: Tier = tierFromScore(result.score);
    const cfg = ocularTierConfig(tier);
    const Icon = cfg.Icon;

    return (
      <div className="flex min-h-screen flex-col">
        <GameHeader title="Ocular Pursuit" progress={{ current: 1, total: 3 }} />
        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="flex w-full max-w-md flex-col items-center">

            {/* Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className={`relative mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 ${cfg.badgeBorder} ${cfg.badgeBg} ${cfg.badgeShadow}`}
            >
              <Icon className={`h-12 w-12 ${cfg.iconColor}`} strokeWidth={2} />
            </motion.div>

            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              className={`font-mono text-xs uppercase tracking-[0.3em] ${cfg.tierLabelColor}`}>
              {cfg.tierLabel}
            </motion.p>
            <motion.h2 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
              className="mb-2 mt-1 text-center text-3xl font-bold tracking-tight text-slate-50">
              {cfg.headline}
            </motion.h2>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              className="mb-8 max-w-md text-center text-sm text-slate-400">
              {cfg.body}
            </motion.p>

            {/* Hero metric */}
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 24 }}
              className="mb-6 flex items-baseline gap-2 font-mono">
              <span className="text-5xl font-bold tabular-nums text-slate-50">
                {(result.metrics.accuracy * 100).toFixed(0)}
              </span>
              <span className="text-xl uppercase tracking-widest text-slate-500">% accuracy</span>
            </motion.div>

            {/* Score bar */}
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.55 }} className="mb-6 w-full">
              <div className="mb-2 flex items-baseline justify-between font-mono text-xs uppercase tracking-widest text-slate-500">
                <span>Composite Score</span>
                <OcularAnimatedScore target={result.score} />
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <motion.div className={`h-full ${cfg.barColor}`}
                  initial={{ width: 0 }} animate={{ width: `${result.score * 100}%` }}
                  transition={{ duration: 1, delay: 0.6, ease: "easeOut" }} />
              </div>
            </motion.div>

            {/* Stats grid */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="mb-8 grid w-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800">
              {[
                { label: "Smoothness", value: `${(result.metrics.smoothness * 100).toFixed(0)}%` },
                { label: "Avg Deviation", value: result.metrics.avgDeviation.toFixed(3) },
                { label: "Saccades", value: result.metrics.saccadeCount.toString() },
                { label: "Null Samples", value: `${(result.metrics.nullRatio * 100).toFixed(0)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-50">{value}</p>
                </div>
              ))}
            </motion.div>

            {/* Actions */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.75 }} className="flex w-full flex-col gap-3">
              <Button variant="primary" size="lg" onClick={() => completeGame(result.score, "/ocular", router)} className="w-full">
                <ArrowRight className="h-5 w-5" /> Continue
              </Button>
              <Button variant="ghost" onClick={() => { setResult(null); setPhase("permission"); }} className="w-full">
                <RotateCcw className="h-4 w-4" /> Retry Diagnostic
              </Button>
            </motion.div>

          </div>
        </main>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-safegate-primary border-t-transparent shadow-glow" />
        <p className="font-mono text-sm text-slate-400">Scoring your pursuit...</p>
      </div>
    );
  }

  // phase === "error"
  return (
    <div className="flex min-h-screen flex-col">
      <GameHeader title="Ocular Pursuit" progress={{ current: 1, total: 3 }} />
      <main className="flex flex-1 items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-safegate-danger/40 bg-safegate-danger/10 p-6 text-center"
        >
          <p className="text-lg font-semibold text-slate-50">Something went wrong</p>
          <p className="text-sm text-slate-400">{submitError ?? "Unknown error"}</p>
          <div className="flex w-full flex-col gap-2">
            <button
              onClick={() => {
                setPhase("permission");
                setSubmitError(null);
              }}
              className="rounded-xl border border-slate-800 bg-safegate-surface px-4 py-3 text-sm font-semibold text-slate-50 hover:border-safegate-primary/60"
            >
              Try Again
            </button>
            <button
              onClick={skipToSwipe}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 hover:text-slate-50"
            >
              Skip to Decision Speed
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}


function ocularTierConfig(tier: Tier) {
  switch (tier) {
    case "APPROVED":
      return {
        tierLabel: "Tier 1 — Approved",
        tierLabelColor: "text-safegate-success",
        headline: "Gaze Tracking Within Normal Range",
        body: "Your eye pursuit accuracy and smoothness are within expected limits.",
        Icon: Check,
        iconColor: "text-safegate-success",
        badgeBorder: "border-safegate-success/60",
        badgeBg: "bg-safegate-success/10",
        badgeShadow: "shadow-glow-success",
        barColor: "bg-safegate-success",
      };
    case "RECALIBRATE":
      return {
        tierLabel: "Tier 2 — Recalibrate",
        tierLabelColor: "text-safegate-warning",
        headline: "Additional Verification Required",
        body: "Your gaze tracking fell in the gray area. A second test will confirm readiness.",
        Icon: TriangleAlert,
        iconColor: "text-safegate-warning",
        badgeBorder: "border-safegate-warning/60",
        badgeBg: "bg-safegate-warning/10",
        badgeShadow: "",
        barColor: "bg-safegate-warning",
      };
    case "DENIED":
      return {
        tierLabel: "Tier 3 — Denied",
        tierLabelColor: "text-safegate-danger",
        headline: "Gaze Tracking Impaired",
        body: "Significant deviation detected. A second test is required before access can be granted.",
        Icon: TriangleAlert,
        iconColor: "text-safegate-danger",
        badgeBorder: "border-safegate-danger/60",
        badgeBg: "bg-safegate-danger/10",
        badgeShadow: "shadow-glow-danger",
        barColor: "bg-safegate-danger",
      };
  }
}

function OcularAnimatedScore({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    const duration = 1100;
    let raf = 0;
    const tick = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplayed(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return (
    <span className="font-mono text-lg font-semibold tabular-nums text-slate-50">
      {displayed.toFixed(2)}
    </span>
  );
}
