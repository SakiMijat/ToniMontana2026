"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Small "back to panel" link — drop this into any game route so users
 * aren't trapped in a game without the browser back button.
 *
 * Visually matches the SafeGate header aesthetic: slate pill with subtle
 * border that tints cyan on hover.
 */
export function BackToPanel() {
  return (
    <Link
      href="/"
      aria-label="Back to Control Panel"
      className="fixed left-4 top-4 z-50 flex h-8 items-center gap-1.5 rounded-full border border-slate-800 bg-surface/80 px-3 font-mono text-[10px] uppercase tracking-widest text-slate-400 backdrop-blur-md transition-all hover:border-primary/60 hover:text-primary sm:left-6 sm:top-[88px]"
    >
      <ArrowLeft className="h-3 w-3" strokeWidth={2.5} />
      Panel
    </Link>
  );
}
