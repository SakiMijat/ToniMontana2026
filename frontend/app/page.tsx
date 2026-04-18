"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { startSession } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const begin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { sessionId } = await startSession();
      router.push(`/session/${sessionId}/swipe`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex w-full max-w-md flex-col items-center gap-8 text-center"
      >
        <div className="rounded-full bg-safegate-surface p-5 text-safegate-primary shadow-glow">
          <ShieldCheck className="h-14 w-14" strokeWidth={1.6} />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-slate-50">
            SafeGate
          </h1>
          <p className="text-slate-400 font-medium">
            A 60-second cognitive check to unlock your vehicle. No hardware, no
            friction — just proof you're fit to drive.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={begin}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Initializing..." : "Begin Cognitive Check"}
        </Button>

        {error && (
          <p className="w-full rounded-xl border border-safegate-danger/40 bg-safegate-danger/10 p-3 text-sm text-safegate-danger">
            {error}
          </p>
        )}

        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
          Game 6 · Decision Speed · Kartice Levo/Desno
        </p>
      </motion.div>
    </main>
  );
}
