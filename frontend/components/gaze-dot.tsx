"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface GazeDotProps {
  /** Gaze in client pixels. When null, dot is hidden. */
  gaze: { x: number; y: number } | null;
  /** When true, dot renders in amber (off-target). Design.md §4B. */
  offTarget?: boolean;
}

/**
 * Live gaze indicator — ring-within-a-ring per design.md §4B.
 * Renders fixed to viewport, non-interactive (pointer-events: none).
 */
export function GazeDot({ gaze, offTarget = false }: GazeDotProps) {
  if (!gaze) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-50"
      animate={{ x: gaze.x - 24, y: gaze.y - 24 }}
      transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.3 }}
    >
      <div className="relative h-12 w-12">
        {/* Outer pulse ring */}
        <span
          className={cn(
            "absolute inset-0 rounded-full border-2 animate-pulse-glow",
            offTarget ? "border-safegate-warning" : "border-safegate-primary",
          )}
          style={{ opacity: 0.5 }}
        />
        {/* Inner dot */}
        <span
          className={cn(
            "absolute inset-[14px] rounded-full",
            offTarget ? "bg-safegate-warning" : "bg-safegate-primary",
          )}
        />
      </div>
    </motion.div>
  );
}
