"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { UnlockSlider } from "@/components/unlock-slider";
import { startSession } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Slide-to-unlock kicks off the cognitive check: create a session, then
  // send the user to Game 1 (ocular pursuit).
  const handleUnlock = async () => {
    setError(null);
    try {
      const { sessionId } = await startSession();
      router.push(`/session/${sessionId}/ocular`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-[80%] rounded-full bg-safegate-primary/10 blur-3xl" />
        <div className="absolute bottom-10 right-[6%] h-80 w-80 rounded-full bg-safegate-success/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative flex w-full max-w-2xl flex-col items-center gap-8 text-center"
      >
        <div className="inline-flex items-center gap-3 rounded-full border border-safegate-primary/25 bg-safegate-surface/80 px-4 py-2 text-sm font-medium text-safegate-primary shadow-glow">
          <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
          Vehicle Access Gate
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-slate-50 sm:text-6xl">
            SafeGate
          </h1>
          <p className="max-w-xl text-base font-medium leading-relaxed text-slate-400 sm:text-lg">
            Slide the lock to start your 60-second cognitive check. No hardware,
            no friction — just proof you&apos;re fit to drive.
          </p>
        </div>

        <UnlockSlider onUnlock={handleUnlock} />

        {error && (
          <p className="w-full max-w-xl rounded-xl border border-safegate-danger/40 bg-safegate-danger/10 p-3 text-sm text-safegate-danger">
            {error}
          </p>
        )}

        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-slate-600">
          Game 1 · Ocular Pursuit · Prati Tačku
        </p>
      </motion.div>
    </main>
  );
}
