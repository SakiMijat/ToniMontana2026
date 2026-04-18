"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WebGazerInstance } from "webgazer";

export type WebGazerStatus = "idle" | "loading" | "ready" | "error";

export interface GazePoint {
  x: number;
  y: number;
}

export interface UseWebGazerReturn {
  status: WebGazerStatus;
  error: Error | null;
  /** Latest gaze in client pixels (throttled to ~30Hz), null if never captured */
  gaze: GazePoint | null;
  init: () => Promise<void>;
  teardown: () => Promise<void>;
  recordCalibrationClick: (x: number, y: number) => void;
  setOverlaysVisible: (visible: boolean) => void;
}

const GAZE_THROTTLE_MS = 33; // ~30 Hz — matches backend MIN_SAMPLE_HZ guardrail

/**
 * React hook wrapping WebGazer.js lifecycle. Dynamic-imports the library
 * on demand so Next.js never tries to SSR it. Releases the camera on unmount.
 *
 * Privacy: `saveDataAcrossSessions(false)` ensures calibration data is
 * discarded when the tab closes — no localStorage persistence.
 */
export function useWebGazer(): UseWebGazerReturn {
  const [status, setStatus] = useState<WebGazerStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [gaze, setGaze] = useState<GazePoint | null>(null);

  const wgRef = useRef<WebGazerInstance | null>(null);
  const mountedRef = useRef(true);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Release camera immediately on unmount so the browser indicator clears.
      const wg = wgRef.current;
      if (wg) {
        wg.clearGazeListener();
        wg.end().catch(() => {
          /* ignore — user left the page */
        });
        wgRef.current = null;
      }
    };
  }, []);

  const init = useCallback(async () => {
    if (wgRef.current) return;
    setStatus("loading");
    setError(null);

    try {
      const { default: webgazer } = await import("webgazer");

      webgazer
        .setRegression("ridge")
        .saveDataAcrossSessions(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false)
        .showVideoPreview(false)
        .showPredictionPoints(false)
        .showVideo(false);

      webgazer.setGazeListener((data) => {
        if (!mountedRef.current || !data) return;
        const now = performance.now();
        if (now - lastUpdateRef.current < GAZE_THROTTLE_MS) return;
        lastUpdateRef.current = now;
        setGaze({ x: data.x, y: data.y });
      });

      await webgazer.begin();

      if (!mountedRef.current) {
        // Hook unmounted while begin() was pending — clean up immediately.
        await webgazer.end().catch(() => undefined);
        return;
      }

      wgRef.current = webgazer;
      setStatus("ready");
    } catch (err) {
      const e = err instanceof Error ? err : new Error("WebGazer failed to initialize");
      if (mountedRef.current) {
        setError(e);
        setStatus("error");
      }
      throw e;
    }
  }, []);

  const teardown = useCallback(async () => {
    const wg = wgRef.current;
    if (!wg) return;
    wg.clearGazeListener();
    await wg.end().catch(() => undefined);
    wgRef.current = null;
    if (mountedRef.current) {
      setStatus("idle");
      setGaze(null);
    }
  }, []);

  const recordCalibrationClick = useCallback((x: number, y: number) => {
    wgRef.current?.recordScreenPosition(x, y, "click");
  }, []);

  const setOverlaysVisible = useCallback((visible: boolean) => {
    const wg = wgRef.current;
    if (!wg) return;
    wg.showVideo(visible);
    wg.showVideoPreview(visible);
    wg.showFaceOverlay(visible);
    wg.showFaceFeedbackBox(visible);
  }, []);

  return {
    status,
    error,
    gaze,
    init,
    teardown,
    recordCalibrationClick,
    setOverlaysVisible,
  };
}
