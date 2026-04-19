"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Brain,
  Eye,
  Grid3x3,
  Palette,
  Route,
  Split,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { IconKey, PanelGame } from "@/lib/gamesPanel";

/** Lucide icon lookup — keeps bundle size predictable */
const ICONS: Record<IconKey, LucideIcon> = {
  brain: Brain,
  zap: Zap,
  target: Target,
  palette: Palette,
  route: Route,
  eye: Eye,
  grid3x3: Grid3x3,
  split: Split,
};

interface GameTileProps {
  game: PanelGame;
  index: number;
}

/**
 * A single tile on the control panel. Clicking navigates to the game URL.
 * Disabled/coming-soon tiles render visibly different and don't navigate.
 */
export function GameTile({ game, index }: GameTileProps) {
  const Icon = ICONS[game.iconName];
  const isComingSoon = game.status === "coming-soon";

  const content = (
    <>
      {/* Corner brackets — diagnostic feel shared with the Stroop card */}
      <CornerBracket className="left-3 top-3" />
      <CornerBracket className="right-3 top-3 rotate-90" />
      <CornerBracket className="left-3 bottom-3 -rotate-90" />
      <CornerBracket className="right-3 bottom-3 rotate-180" />

      {/* Top row — position + status chip */}
      <div className="relative flex items-start justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
          {game.position}
        </span>
        {isComingSoon ? (
          <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-warning">
            Coming soon
          </span>
        ) : (
          <span
            className="flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-success"
            aria-label="Live"
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_rgba(16,185,129,0.8)]"
              aria-hidden
            />
            Live
          </span>
        )}
      </div>

      {/* Icon badge */}
      <div className="relative mt-5 mb-5">
        <div
          className="absolute inset-0 rounded-2xl blur-xl transition-opacity duration-300 group-hover:opacity-80"
          style={{
            backgroundColor: `${game.accentHex}30`,
            opacity: isComingSoon ? 0.15 : 0.4,
          }}
          aria-hidden
        />
        <div
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-xl border bg-surface transition-all duration-200",
            isComingSoon
              ? "border-slate-800"
              : "border-primary/40 group-hover:border-primary group-hover:shadow-glow",
          )}
        >
          {Icon && (
            <Icon
              className={cn(
                "h-7 w-7 transition-colors",
                isComingSoon ? "text-slate-600" : "text-primary",
              )}
              strokeWidth={1.5}
            />
          )}
        </div>
      </div>

      {/* Text content */}
      <h3
        className={cn(
          "text-xl font-bold tracking-tight sm:text-2xl",
          isComingSoon ? "text-slate-500" : "text-slate-50",
        )}
      >
        {game.name}
      </h3>
      <p
        className={cn(
          "mt-1 font-mono text-[10px] uppercase tracking-[0.2em]",
          isComingSoon ? "text-slate-600" : "text-primary/80",
        )}
      >
        {game.subtitle}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        {game.description}
      </p>

      {/* Bottom row — CTA */}
      <div className="mt-5 flex items-center justify-between">
        <span
          className={cn(
            "font-mono text-[11px] font-semibold uppercase tracking-widest transition-colors",
            isComingSoon
              ? "text-slate-600"
              : "text-slate-400 group-hover:text-primary",
          )}
        >
          {isComingSoon ? "Unavailable" : "Launch diagnostic"}
        </span>
        {!isComingSoon && (
          <ArrowUpRight
            className="h-4 w-4 text-slate-500 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
            strokeWidth={2}
          />
        )}
      </div>
    </>
  );

  const tileClasses = cn(
    "group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border-2 bg-surface p-6 transition-all duration-200",
    isComingSoon
      ? "cursor-not-allowed border-slate-800 opacity-60"
      : "cursor-pointer border-slate-800 hover:border-primary/60 hover:shadow-glow hover:-translate-y-0.5",
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.05 + index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {isComingSoon ? (
        <div className={tileClasses} aria-disabled="true">
          {content}
        </div>
      ) : (
        <Link
          href={game.href}
          className={tileClasses}
          aria-label={`Launch ${game.name} — ${game.subtitle}`}
        >
          {content}
        </Link>
      )}
    </motion.div>
  );
}

function CornerBracket({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute h-3 w-3 border-l-2 border-t-2 border-primary/30 transition-colors duration-200 group-hover:border-primary/70",
        className,
      )}
      aria-hidden
    />
  );
}
