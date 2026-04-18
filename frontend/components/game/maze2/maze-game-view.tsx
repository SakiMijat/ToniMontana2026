// frontend/app/maze/maze-game-view.tsx
'use client';

import { cn } from '@/lib/utils';

interface MazeGame2ViewProps {
  /** Hide the view (start screen is shown instead), but keep it mounted so script.js can init */
  hidden: boolean;
}

/**
 * MazeGame2View — a thin React wrapper around the vanilla canvas game.
 *
 * The actual game logic lives in script.js (public/games/maze/script.js).
 * This component only provides the DOM structure that script.js expects:
 *   .le-canvas, .game-ui, .btn-start, .lose-overlay, .banned-overlay, .win-message-overlay
 *
 * It is always mounted (never conditionally removed) so script.js can safely
 * query selectors on load. Visibility is controlled via CSS.
 */
export function MazeGame2View({ hidden }: MazeGame2ViewProps) {
  return (
    <>
      {/* ── Maze-specific global styles ─────────────────────────────────── */}
      <style jsx global>{`
        .le-canvas {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 0;
        }

        .game-ui {
          display: block;
          position: fixed;
          z-index: 10;
          color: white;
          font-family: 'Open Sans', sans-serif;
          margin-left: 20px;
          margin-top: 72px; /* below GameHeader (64px) */
        }

        .lives-display {
          font-size: 16pt;
          letter-spacing: 4px;
          margin-bottom: 4px;
        }

        .timer-display {
          font-size: 14pt;
          font-family: 'Roboto', sans-serif;
          color: white;
          margin-bottom: 6px;
          font-weight: bold;
        }

        .btn-start {
          position: fixed;
          z-index: 20;
          width: 16px;
          height: 16px;
          color: white;
          background-color: rgba(21, 214, 38, 0.7);
          display: none;
          text-align: center;
          font-weight: bold;
          text-decoration: none;
          line-height: 16px;
          cursor: none;
          font-size: 8pt;
        }

        .lose-overlay {
          display: none;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          position: fixed;
          z-index: 30;
          pointer-events: none;
          background: rgba(0, 0, 0, 0.45);
        }

        .lose-message {
          font-family: 'Amatic SC', cursive;
          text-align: center;
          top: 50%;
          position: relative;
          margin-top: -40px;
          color: white;
          font-size: 18pt;
          text-shadow: 0 2px 8px rgba(0,0,0,0.8);
        }

        .banned-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.93);
          z-index: 9999;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .banned-title {
          color: #e74c3c;
          font-family: 'Rye', cursive;
          font-size: 52pt;
          margin-bottom: 24px;
          text-shadow: 0 0 30px rgba(231, 76, 60, 0.8);
        }

        .banned-reason {
          color: white;
          font-family: 'Bree Serif', serif;
          font-size: 16pt;
          text-align: center;
          max-width: 520px;
          padding: 20px;
          line-height: 1.5;
        }

        .banned-sub {
          color: rgba(255, 255, 255, 0.35);
          font-family: 'Roboto', sans-serif;
          font-size: 10pt;
          margin-top: 20px;
        }

        .win-message-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          pointer-events: none;
        }

        .win-message-box {
          background: #2ecc71;
          padding: 30px 50px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 0 30px rgba(46, 204, 113, 0.5);
          border: 3px solid #27ae60;
          animation: popIn 0.5s ease-out;
        }

        .win-message-box h2 {
          color: white;
          font-family: 'Bree Serif', sans-serif;
          font-size: 3rem;
          margin: 0 0 10px 0;
          text-shadow: 2px 2px 0 #1e8449;
        }

        .win-message-box p {
          color: white;
          font-family: 'Roboto', sans-serif;
          font-size: 1.8rem;
          margin: 0;
          font-weight: bold;
        }

        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          80%  { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Google Fonts needed by the vanilla script */}
      <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css?family=Amatic+SC" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css?family=Bree+Serif" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css?family=Rye" rel="stylesheet" />
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css" />

      {/* ── DOM nodes that script.js queries with document.querySelector ── */}
      <div
        className="game"
        style={{ display: hidden ? 'none' : 'block' }}
      >
        {/* Invisible editor UI — script.js expects these selectors to exist */}
        <div className="editor-ui" style={{ display: 'none' }}>
          <div className="selectors">
            <div className="audio-selectors" />
            <div className="image-selectors">
              <div>
                <img src="//www.scaryforkids.com/pics/scary-movie.jpg" className="image-selector selected" id="img0" alt="" />
                <img src="//orion-uploads.openroadmedia.com/lg_380efe-pennywiseweb.jpg" className="image-selector" id="img1" alt="" />
                <img src="//yt3.ggpht.com/-wT3VNeh42u0/AAAAAAAAAAI/AAAAAAAAAAA/yuwi_GW69dI/s900-c-k-no-mo-rj-c0xffffff/photo.jpg" className="image-selector" id="img2" alt="" />
                <img src="//media.giphy.com/media/LLHkw7UnvY3Kw/giphy.gif" className="image-selector" id="img3" alt="" />
              </div>
            </div>
          </div>
        </div>

        {/* In-game HUD */}
        <div className="game-ui">
          <div className="lives-display">❤️❤️❤️</div>
          <div className="timer-display">⏱️ 0s</div>
          <span>Move your mouse to the green field S to start.</span>
          <br />
          <span>Reach the goal without touching the walls.</span>
          <br />
          <span>You have 3 lives and 30 seconds. Good luck!</span>
        </div>

        {/* Start trigger — script.js positions this over the S tile */}
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a
          href="#"
          className="btn-start"
          onMouseOver={() => (window as any).startGame?.()}
          onClick={(e) => e.preventDefault()}
        >
          S
        </a>

        {/* Canvas — script.js queries ".le-canvas" */}
        <canvas className="le-canvas" />
      </div>

      {/* Hidden input for map data (script.js queries ".input-data") */}
      <div className="menu" style={{ display: 'none' }}>
        <input type="text" className="input-data" style={{ display: 'none' }} readOnly />
      </div>

      {/* Lose overlay */}
      <div className="lose-overlay">
        <div className="lose-message">
          Oops! You touched the wall!
          <br />
          Move your mouse back to the start S to try again!
        </div>
      </div>

      {/* Banned overlay (script.js shows this directly) */}
      <div className="banned-overlay">
        <div className="banned-title">GAME OVER</div>
        <div className="banned-reason" />
        <div className="banned-sub" />
      </div>
    </>
  );
}
