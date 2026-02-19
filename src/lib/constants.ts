// Spike detection thresholds (z-score)
export const SPIKE_THRESHOLDS = {
  elevated: 2.0,
  spike: 3.0,
  extreme: 5.0,
} as const;

// Minimum volume (SOL) for a collection to be considered in spike detection
export const MIN_VOLUME_SOL = 1;

// Minimum sale count in window to trigger spike detection
export const MIN_SALE_COUNT = 5;

// Rolling baseline window in days
export const BASELINE_WINDOW_DAYS = 7;

// Polling intervals (ms)
export const TENSOR_POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 min
export const SPIKE_DETECT_INTERVAL_MS = 60 * 1000; // 1 min

// Rolling window sizes
export const WINDOWS = ["5m", "1h", "6h", "24h", "7d"] as const;
export type WindowSize = (typeof WINDOWS)[number];

// Marketplaces
export const MARKETPLACES = [
  "tensor",
  "magic_eden",
  "hadeswap",
  "solanart",
  "unknown",
] as const;
