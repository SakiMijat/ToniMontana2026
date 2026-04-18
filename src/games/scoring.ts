export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function average(values: number[], fallback = 0) {
  if (values.length === 0) return fallback;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function latencyNormalized(
  avgLatencyMs: number,
  floorMs: number,
  ceilingMs: number,
) {
  return clamp(
    1 - (avgLatencyMs - floorMs) / (ceilingMs - floorMs),
    0,
    1,
  );
}
