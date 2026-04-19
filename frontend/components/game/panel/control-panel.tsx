"use client";

import { motion } from "framer-motion";
import { PANEL_GAMES } from "@/lib/gamesPanel";
import { GameTile } from "./game-tile";
import { PanelHeader } from "./panel-header";

/**
 * The SafeGate Control Panel — landing page for the Cognitive Gate suite.
 * Shows 6 game tiles in a responsive grid. Each tile links to its game.
 */
export function ControlPanel() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Atmospheric background */}
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none fixed inset-0 bg-radial-fade" />

      <PanelHeader />

      <main className="relative z-10 flex-1 px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 text-center sm:mb-14"
          >
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-primary/80">
              Cognitive Gate Protocol
            </p>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">
              Control Panel
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Select a diagnostic to launch. Each test measures a distinct
              cognitive domain. In production, the{" "}
              <span className="text-primary">session orchestrator</span>{" "}
              automatically picks 3 games per session.
            </p>
          </motion.div>

          {/* Tile grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {PANEL_GAMES.map((game, index) => (
              <GameTile key={game.id} game={game} index={index} />
            ))}
          </div>


        </div>
      </main>

      <footer className="relative z-10 border-t border-slate-800/80 bg-background/60 py-3 backdrop-blur">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-slate-600">
          SafeGate • Cognitive Gate Protocol • v1.0
        </p>
      </footer>
    </div>
  );
}

function StatCell({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="bg-surface px-4 py-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-50">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-600">{note}</p>
    </div>
  );
}
