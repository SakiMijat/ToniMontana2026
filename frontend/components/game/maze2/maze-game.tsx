// frontend/components/game/maze2/maze-game.tsx
'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

import { GameHeader } from '@/components/game-header';
import { MazeStartScreen } from './maze-start-screen';
import { MazeGame2View } from './maze-game-view';
import { MazeResultScreen } from './maze-result-screen';

export type MazePhase = 'idle' | 'playing' | 'win' | 'banned';

export interface MazeResult {
  elapsedSec: number;
  livesLeft: number;
  timedOut: boolean;
}

const PHASE_PROGRESS: Record<MazePhase, number> = {
  idle:    0,
  playing: 1,
  win:     2,
  banned:  2,
};

export function MazeGame2() {
  const [phase, setPhase] = useState<MazePhase>('idle');
  const [result, setResult] = useState<MazeResult | null>(null);

  // Live values fed from script.js — shown in GameHeader during play
  const [lives, setLives] = useState(3);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // script.js → React: game won
    (window as any).__mazeOnWin = (elapsedSec: number, livesLeft: number) => {
      setResult({ elapsedSec, livesLeft, timedOut: false });
      setPhase('win');
    };

    // script.js → React: game lost (lives=0 or timed out)
    (window as any).__mazeOnBanned = (elapsedSec: number, livesLeft: number, timedOut: boolean) => {
      setResult({ elapsedSec, livesLeft, timedOut });
      setPhase('banned');
    };

    // script.js → React: player hovered S, game started
    (window as any).__mazeOnStart = () => setPhase('playing');

    // script.js → React: lives updated
    (window as any).__mazeOnLivesChange = (n: number) => setLives(n);

    // script.js → React: timer tick
    (window as any).__mazeOnTimerChange = (s: number) => setElapsed(s);

    return () => {
      delete (window as any).__mazeOnWin;
      delete (window as any).__mazeOnBanned;
      delete (window as any).__mazeOnStart;
      delete (window as any).__mazeOnLivesChange;
      delete (window as any).__mazeOnTimerChange;
    };
  }, []);

  const handleBegin = () => setPhase('playing');

  const handleRetry = () => {
    setResult(null);
    setLives(3);
    setElapsed(0);
    setPhase('playing');
    (window as any).retryMaze?.();
  };

  // Timer color: red when > 20s (matching script.js original logic)
  const timerUrgent = elapsed > 20;
  const secondsLeft = phase === 'playing' ? (30 - elapsed) : undefined;

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none fixed inset-0 bg-radial-fade" />

      <GameHeader
        title="Maze Runner"
        secondsLeft={phase === 'playing' ? Math.max(0, 30 - elapsed) : undefined}
        progress={{ current: PHASE_PROGRESS[phase], total: 3 }}
      />

      {/* Lives bar — only during play */}
      {phase === 'playing' && (
        <div className="relative z-20 flex justify-center gap-2 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="text-2xl" style={{ opacity: i < lives ? 1 : 0.2 }}>
              ❤️
            </span>
          ))}
        </div>
      )}

      <main className="relative z-10 flex flex-1 flex-col">
        {phase === 'idle' && (
          <div className="flex flex-1 items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
              <MazeStartScreen onStart={handleBegin} />
            </div>
          </div>
        )}

        {(phase === 'win' || phase === 'banned') && result && (
          <div className="flex flex-1 items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
              <MazeResultScreen
                phase={phase}
                result={result}
                onRetry={handleRetry}
              />
            </div>
          </div>
        )}

        {/* Always mounted — script.js needs the DOM nodes */}
        <MazeGame2View hidden={phase === 'idle'} />
      </main>

      <footer className="relative z-10 border-t border-slate-800/80 bg-background/60 py-3 backdrop-blur">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-slate-600">
          SafeGate • Cognitive Gate Protocol • v1.0
        </p>
      </footer>

      <Script
        src="/games/maze/script.js"
        strategy="afterInteractive"
      />
    </div>
  );
}