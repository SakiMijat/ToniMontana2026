"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

import { UnlockSlider } from "@/components/unlock-slider";

export default function LandingPage() {
  const handleUnlock = () => {
    // Placeholder for future route wiring once the unlock flow is finalized.
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
            Slide the lock to arm your vehicle access flow. This first version
            stays on the landing screen after unlock so we can refine the entry
            experience before wiring the next route.
          </p>
        </div>

        <UnlockSlider onUnlock={handleUnlock} />

        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-slate-600">
          Swipe to begin · No redirect yet
        </p>
      </motion.div>
    </main>
  );
}
