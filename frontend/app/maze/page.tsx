// app/page.tsx
//
// SafeGate — Lavirint (Maze)
//
// This page hosts the original canvas engine from `/public/games/maze/script.js`
// (unchanged except TIME_LIMIT: 30 → 12). All SafeGate design work is done in
// this file via `style jsx global`, inline styles, and the JSX structure.
//
// CRITICAL: the class names, IDs, and DOM structure below must stay in sync
// with script.js, which uses document.querySelector to bind to:
//   .le-canvas, .btn-start, .lives-display, .timer-display, .game, .game-ui,
//   .menu, .input-data, .editor-ui, .lose-overlay, .message-overlay,
//   .banned-overlay, .banned-reason, .banned-sub, .win-message-overlay,
//   .map-data, #img0..#img3
// Do not rename any of these.

'use client';

import { useRef } from 'react';
import Script from 'next/script';

export default function MazePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <>
      {/* ─────────────────────────────────────────
          SafeGate design tokens + global styles
          ───────────────────────────────────────── */}
      <style jsx global>{`
        /* --- Font loading (Geist + JetBrains Mono to match siblings) --- */
        @import url("https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap");

        :root {
          --bg: #020617;
          --surface: #0f172a;
          --surface-elev: #1e293b;
          --border: #1e293b;
          --primary: #22d3ee;
          --success: #10b981;
          --warning: #fbbf24;
          --danger: #e11d48;
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
          --text-muted: #64748b;
        }

        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: var(--bg);
          color: var(--text-primary);
          font-family: "Geist", "Inter", system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* Atmospheric grid background painted behind the canvas */
        body::before {
          content: "";
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(34, 211, 238, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.05) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        body::after {
          content: "";
          position: fixed;
          inset: 0;
          background: radial-gradient(
            ellipse 80% 60% at 50% 40%,
            rgba(34, 211, 238, 0.08) 0%,
            transparent 60%
          );
          pointer-events: none;
          z-index: 0;
        }

        /* --- Cursor visibility rule --- */
        /* Keep the system cursor visible at all times so the user always
           knows where their pointer is. The engine draws an additional cyan
           aimpoint on top during active play. */
        .le-canvas {
          cursor: default !important;
        }

        /* --- Game container --- */
        .game {
          display: block;
          position: relative;
          z-index: 1;
          font-family: "Geist", sans-serif;
        }

        .le-canvas {
          display: block;
          position: relative;
          z-index: 1;
        }

        /* --- SafeGate sticky header --- */
        .safegate-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          background: rgba(2, 6, 23, 0.8);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(30, 41, 59, 0.8);
        }

        .safegate-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .safegate-header-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.6);
          flex-shrink: 0;
        }

        .safegate-header-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--text-primary);
          margin: 0;
        }

        .safegate-header-subtitle {
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--text-muted);
          margin: 0;
        }

        .safegate-header-dots {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .safegate-header-dot-step {
          height: 6px;
          border-radius: 999px;
          transition: all 0.3s;
        }

        .safegate-header-dot-step.done {
          width: 6px;
          background: rgba(34, 211, 238, 0.6);
        }

        .safegate-header-dot-step.active {
          width: 24px;
          background: var(--primary);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.6);
        }

        .safegate-header-dot-step.pending {
          width: 6px;
          background: #334155;
        }

        /* --- HUD bar (lives + timer) under the header --- */
        .game-ui {
          display: block;
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          top: 80px;
          z-index: 30;
          color: var(--text-primary);
          font-family: "Geist", sans-serif;
          margin: 0;
          padding: 12px 24px;
          border: 1px solid var(--border);
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.15);
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .game-ui-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .game-ui-label {
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--text-muted);
        }

        .lives-display {
          font-family: "JetBrains Mono", monospace;
          font-size: 18px;
          letter-spacing: 2px;
          color: var(--primary);
          text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
          margin: 0;
          line-height: 1;
        }

        .timer-display {
          font-family: "JetBrains Mono", monospace;
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          font-variant-numeric: tabular-nums;
          line-height: 1;
          transition: color 0.15s;
        }

        .game-ui-divider {
          width: 1px;
          height: 24px;
          background: var(--border);
        }

        /* --- Instruction caption near bottom --- */
        .safegate-instructions {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 30;
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: center;
          padding: 10px 20px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border);
          border-radius: 10px;
          backdrop-filter: blur(6px);
          pointer-events: none;
        }

        .safegate-instructions-line {
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--text-secondary);
          margin: 0;
        }

        .safegate-instructions-line strong {
          color: var(--primary);
          font-weight: 700;
        }

        /* --- Start button (the S tile trigger) --- */
        .btn-start {
          position: fixed;
          margin: 0;
          width: 24px;
          height: 24px;
          color: #020617;
          background-color: rgba(34, 211, 238, 0.95);
          display: none;
          text-align: center;
          font-family: "JetBrains Mono", monospace;
          font-weight: 700;
          text-decoration: none;
          line-height: 24px;
          font-size: 14px;
          box-shadow: 0 0 16px rgba(34, 211, 238, 0.7);
          z-index: 10;
          border-radius: 3px;
        }

        /* --- Lose overlay (between attempts) --- */
        .lose-overlay {
          display: none;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          position: fixed;
          z-index: 35;
          pointer-events: none;
          background: rgba(225, 29, 72, 0.08);
          backdrop-filter: blur(2px);
        }

        .message-overlay {
          font-family: "Geist", sans-serif;
          text-align: center;
          top: 50%;
          position: relative;
          margin-top: -60px;
          color: var(--text-primary);
          font-size: 18px;
          padding: 24px 40px;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          background: rgba(15, 23, 42, 0.95);
          border: 2px solid rgba(225, 29, 72, 0.7);
          border-radius: 16px;
          box-shadow: 0 0 30px rgba(225, 29, 72, 0.35);
          line-height: 1.5;
        }

        .message-overlay::before {
          content: "Wall hit";
          display: block;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: var(--danger);
          margin-bottom: 8px;
          font-weight: 700;
        }

        /* --- Banned overlay (GAME OVER / Tier 3 Denied) --- */
        .banned-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(2, 6, 23, 0.97);
          backdrop-filter: blur(12px);
          z-index: 9999;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: "Geist", sans-serif;
        }

        .banned-overlay-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 96px;
          height: 96px;
          border-radius: 20px;
          border: 2px solid rgba(225, 29, 72, 0.6);
          background: rgba(225, 29, 72, 0.1);
          box-shadow: 0 0 30px rgba(225, 29, 72, 0.35);
          margin-bottom: 24px;
        }

        .banned-overlay-tier {
          font-family: "JetBrains Mono", monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: var(--danger);
          margin-bottom: 8px;
        }

        .banned-title {
          color: var(--text-primary);
          font-family: "Geist", sans-serif;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 16px 0;
          text-shadow: none;
          text-align: center;
        }

        .banned-reason {
          color: var(--text-secondary);
          font-family: "Geist", sans-serif;
          font-size: 14px;
          text-align: center;
          max-width: 480px;
          padding: 0 20px;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .banned-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 64px;
          padding: 0 40px;
          font-family: "Geist", sans-serif;
          font-size: 16px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: white;
          background: var(--danger);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 0 20px rgba(225, 29, 72, 0.35);
          transition: all 0.2s;
        }

        .banned-cta:hover {
          background: #f43f5e;
          box-shadow: 0 0 30px rgba(225, 29, 72, 0.5);
        }

        .banned-cta:active {
          transform: scale(0.98);
        }

        .banned-sub {
          color: var(--text-muted);
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          margin-top: 20px;
        }

        /* --- Win message overlay --- */
        .win-message-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(2, 6, 23, 0.85);
          backdrop-filter: blur(10px);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          pointer-events: none;
        }

        .win-message-box {
          background: rgba(15, 23, 42, 0.95);
          border: 2px solid rgba(16, 185, 129, 0.6);
          padding: 40px 60px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.4);
          animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-family: "Geist", sans-serif;
          max-width: 480px;
        }

        .win-message-box h2 {
          color: var(--success);
          font-family: "Geist", sans-serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0 0 12px 0;
          text-shadow: none;
        }

        .win-message-box h2::before {
          content: "Tier 1 — Approved";
          display: block;
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: var(--success);
          margin-bottom: 10px;
          font-weight: 600;
          text-shadow: none;
        }

        .win-message-box p {
          color: var(--text-secondary);
          font-family: "Geist", sans-serif;
          font-size: 15px;
          margin: 0;
          font-weight: 500;
          line-height: 1.5;
        }

        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          80%  { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }

        /* --- Hide all legacy menu / editor chrome --- */
        /* The original game had a menu and editor UI; SafeGate ships as
           game-only. We keep the DOM elements (script queries them) but
           force them hidden. */
        .menu,
        .editor-ui,
        .selectors,
        .btn-map-data,
        .btn-play-map,
        .btn-hide-map-data,
        .map-data {
          display: none !important;
        }

        .image-selectors,
        .audio-selectors {
          display: none !important;
        }
      `}</style>

      {/* ─────────────────────────────────────────
          Header (decorative, does not interact with script)
          ───────────────────────────────────────── */}
      <header className="safegate-header">
        <div className="safegate-header-left">
          <div className="safegate-header-dot" />
          <div>
            <h1 className="safegate-header-title">The Maze</h1>
            <p className="safegate-header-subtitle">Motor Control</p>
          </div>
        </div>
        <div className="safegate-header-dots" aria-label="Step 2 of 3">
          <span className="safegate-header-dot-step done" />
          <span className="safegate-header-dot-step active" />
          <span className="safegate-header-dot-step pending" />
        </div>
      </header>

      {/* ─────────────────────────────────────────
          DOM that the script needs — unchanged structure
          ───────────────────────────────────────── */}

      {/* Hidden menu — kept for script.js compatibility */}
      <div className="menu" style={{ display: 'none' }}>
        <input type="text" className="input-data" style={{ display: 'none' }} />
      </div>

      {/* Game container */}
      <div className="game">
        {/* Hidden editor UI — kept for script.js compatibility */}
        <div className="editor-ui" style={{ display: 'none' }}>
          <div className="selectors">
            <div className="audio-selectors" />
            <div className="image-selectors">
              <div>
                {/* The script queries these by ID in selectImage(). They can
                    be empty src since we never show the editor. */}
                <img alt="" src="" className="image-selector selected" id="img0" />
                <img alt="" src="" className="image-selector" id="img1" />
                <img alt="" src="" className="image-selector" id="img2" />
                <img alt="" src="" className="image-selector" id="img3" />
              </div>
            </div>
          </div>
          <a
            href="#"
            className="btn-map-data"
            onClick={(e) => {
              e.preventDefault();
              (window as unknown as { toggleMapData?: () => void }).toggleMapData?.();
            }}
          >
            Toggle sharable map data
          </a>
          <a
            href="#"
            className="btn-play-map"
            onClick={(e) => {
              e.preventDefault();
              (window as unknown as { togglePreview?: () => void }).togglePreview?.();
            }}
          >
            Toggle preview
          </a>
          <span className="map-data" />
        </div>

        {/* HUD — lives and timer */}
        <div className="game-ui">
          <div className="game-ui-section">
            <span className="game-ui-label">Lives</span>
            <div className="lives-display">❤❤❤</div>
          </div>
          <div className="game-ui-divider" />
          <div className="game-ui-section">
            <span className="game-ui-label">Time</span>
            <div className="timer-display">12s</div>
          </div>
        </div>

        {/* Caption */}
        <div className="safegate-instructions">
          <p className="safegate-instructions-line">
            Hover <strong>S</strong> to start &middot; reach the exit without touching walls
          </p>
          <p className="safegate-instructions-line">
            3 lives &middot; 12 seconds
          </p>
        </div>

        {/* The start-tile trigger; script positions this over the S tile */}
        <a
          href="#"
          className="btn-start"
          onMouseOver={() =>
            (window as unknown as { startGame?: () => void }).startGame?.()
          }
          onClick={(e) => e.preventDefault()}
        >
          S
        </a>

        {/* The canvas the engine paints on */}
        <canvas className="le-canvas" ref={canvasRef} />
      </div>

      {/* Between-attempt overlay — wall-hit message */}
      <div className="lose-overlay">
        <div className="message-overlay">
          Touched a wall. Move cursor back to the cyan <strong>S</strong> tile to try again.
        </div>
      </div>

      {/* Banned overlay (game over / Tier 3 Denied) — redesigned inside */}
      <div className="banned-overlay">
        <div className="banned-overlay-badge" aria-hidden>
          {/* Triangle alert icon as inline SVG */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#e11d48"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        <div className="banned-overlay-tier">Tier 3 — Denied</div>
        <h1 className="banned-title">Access Denied</h1>
        <div className="banned-reason" />
        <a href="tel:+38614444555" className="banned-cta">
          {/* Phone icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Call Taxi
        </a>
        <div className="banned-sub">SafeGate • Cognitive Gate Protocol</div>
      </div>

      {/* Load the engine — unchanged except for TIME_LIMIT tweak */}
      <Script src="/games/maze/script.js" strategy="afterInteractive" />
    </>
  );
}