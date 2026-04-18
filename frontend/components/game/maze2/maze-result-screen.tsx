// frontend/components/game/maze2/maze-result-screen.tsx
'use client';

import { motion } from 'framer-motion';
import { CarFront, Check, Phone, RotateCcw, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MazePhase, MazeResult } from './maze-game';

interface MazeResultScreenProps {
  phase: MazePhase;
  result: MazeResult;
  onRetry: () => void;
}

export function MazeResultScreen({ phase, result, onRetry }: MazeResultScreenProps) {
  const approved = phase === 'win';
  const cfg = approved ? approvedConfig(result) : deniedConfig(result);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex w-full flex-col items-center"
    >
      {/* Tier badge */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className={cn(
          'relative mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2',
          cfg.badgeBorder, cfg.badgeBg, cfg.badgeShadow,
        )}
      >
        <cfg.Icon className={cn('h-12 w-12', cfg.iconColor)} strokeWidth={2} />
      </motion.div>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={cn('font-mono text-xs uppercase tracking-[0.3em]', cfg.tierLabelColor)}
      >
        {cfg.tierLabel}
      </motion.p>

      <motion.h2
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mb-2 mt-1 text-center text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl"
      >
        {cfg.headline}
      </motion.h2>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8 max-w-md text-center text-sm text-slate-400"
      >
        {cfg.body}
      </motion.p>

      {/* Score bar */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 24 }}
        className="mb-6 w-full max-w-md"
      >
        <div className="mb-2 flex items-baseline justify-between font-mono text-xs uppercase tracking-widest text-slate-500">
          <span>Time Used</span>
          <AnimatedScore target={result.elapsedSec} suffix="s" />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className={cn('h-full', cfg.barColor)}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((result.elapsedSec / 30) * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Metrics */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mb-8 grid w-full max-w-md grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800"
      >
        <DataCell label="Time" value={`${result.elapsedSec.toFixed(1)}s`} />
        <DataCell label="Time Limit" value="30s" />
        <DataCell label="Lives Left" value={`${result.livesLeft} / 3`} />
        <DataCell label="Result" value={approved ? 'PASS' : result.timedOut ? 'TIMEOUT' : 'FAIL'} />
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="flex w-full max-w-md flex-col gap-3"
      >
        {approved ? (
          <>
            <Button variant="success" size="lg" disabled className="w-full">
              <CarFront className="h-5 w-5" />
              Vehicle Unlocked
            </Button>
            <Button variant="ghost" size="default" onClick={onRetry} className="w-full">
              <RotateCcw className="h-4 w-4" />
              Run Again
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="danger"
              size="lg"
              onClick={() => { window.location.href = 'tel:+38614444555'; }}
              className="w-full"
            >
              <Phone className="h-5 w-5" />
              Call Taxi
            </Button>
            <Button variant="ghost" size="default" onClick={onRetry} className="w-full">
              <RotateCcw className="h-4 w-4" />
              Retry Diagnostic
            </Button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Tier configs ─────────────────────────────────────────────────────────── */

function approvedConfig(r: MazeResult) {
  return {
    tierLabel: 'Tier 1 — Approved',
    tierLabelColor: 'text-success',
    headline: 'Motor Check Passed',
    body: `Maze completed in ${r.elapsedSec.toFixed(1)}s with ${r.livesLeft} ${r.livesLeft === 1 ? 'life' : 'lives'} remaining. Motor control within sober baseline. Have a safe drive.`,
    Icon: Check,
    iconColor: 'text-success',
    badgeBorder: 'border-success/60',
    badgeBg: 'bg-success/10',
    badgeShadow: 'shadow-glow-success',
    barColor: 'bg-success shadow-glow-success',
  };
}

function deniedConfig(r: MazeResult) {
  const body = r.timedOut
    ? `You exceeded the 30s time limit (${r.elapsedSec.toFixed(1)}s elapsed). Slow reaction time indicates possible impairment.`
    : `You ran out of lives. Repeated wall collisions indicate impaired fine motor control.`;
  return {
    tierLabel: 'Tier 3 — Denied',
    tierLabelColor: 'text-danger',
    headline: 'Access Denied',
    body: `${body} Vehicle access is blocked. Please choose a safer mobility option.`,
    Icon: TriangleAlert,
    iconColor: 'text-danger',
    badgeBorder: 'border-danger/60',
    badgeBg: 'bg-danger/10',
    badgeShadow: 'shadow-glow-danger',
    barColor: 'bg-danger shadow-glow-danger',
  };
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function AnimatedScore({ target, suffix = '' }: { target: number; suffix?: string }) {
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
      {displayed.toFixed(1)}{suffix}
    </span>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-50">{value}</p>
    </div>
  );
}