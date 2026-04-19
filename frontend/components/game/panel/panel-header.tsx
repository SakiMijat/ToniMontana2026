"use client";

import { Shield } from "lucide-react";

/**
 * Sticky top bar for the control panel — visually matches the GameHeader
 * used in individual games (same height, same blur, same glyph pattern)
 * but shows panel-level chrome instead of game progress dots.
 */
export function PanelHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="h-2 w-2 rounded-full bg-primary shadow-glow"
            aria-hidden
          />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold uppercase tracking-[0.18em] text-slate-50">
              SafeGate
            </h1>
            <p className="truncate text-[10px] uppercase tracking-widest text-slate-500">
              Control Panel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-surface px-3 py-1">
          <Shield className="h-3 w-3 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Cognitive Gate v1.0
          </span>
        </div>
      </div>
    </header>
  );
}
