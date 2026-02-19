import { SPIKE_THRESHOLDS, MIN_VOLUME_SOL, MIN_SALE_COUNT } from "./constants";
import type { SpikeLevel, SpikeResult } from "./types";

interface Baseline {
  mean: number;
  stddev: number;
}

export function computeBaseline(values: number[]): Baseline {
  if (values.length === 0) return { mean: 0, stddev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return { mean, stddev: Math.sqrt(variance) };
}

export function classifyZScore(zScore: number): SpikeLevel | null {
  if (zScore >= SPIKE_THRESHOLDS.extreme) return "extreme";
  if (zScore >= SPIKE_THRESHOLDS.spike) return "spike";
  if (zScore >= SPIKE_THRESHOLDS.elevated) return "elevated";
  return null;
}

export function detectSpike(
  collectionId: string,
  currentVolume: number,
  currentSaleCount: number,
  baseline: Baseline,
  spikeType: SpikeResult["spikeType"] = "volume"
): SpikeResult | null {
  // Filter out low-volume noise
  if (currentVolume < MIN_VOLUME_SOL) return null;
  if (currentSaleCount < MIN_SALE_COUNT) return null;

  // Handle zero stddev (flat baseline)
  if (baseline.stddev === 0) {
    if (baseline.mean === 0) {
      // No historical data — treat any meaningful volume as elevated
      return currentVolume >= MIN_VOLUME_SOL
        ? {
            collectionId,
            level: "elevated",
            zScore: Infinity,
            currentValue: currentVolume,
            baselineMean: 0,
            baselineStddev: 0,
            spikeType,
          }
        : null;
    }
    // Flat baseline with value — use multiplier heuristic
    const mult = currentVolume / baseline.mean;
    if (mult >= 5) return makeResult(collectionId, "extreme", mult * 2, currentVolume, baseline, spikeType);
    if (mult >= 3) return makeResult(collectionId, "spike", mult * 1.5, currentVolume, baseline, spikeType);
    if (mult >= 2) return makeResult(collectionId, "elevated", mult, currentVolume, baseline, spikeType);
    return null;
  }

  const zScore = (currentVolume - baseline.mean) / baseline.stddev;
  const level = classifyZScore(zScore);
  if (!level) return null;

  return makeResult(collectionId, level, zScore, currentVolume, baseline, spikeType);
}

function makeResult(
  collectionId: string,
  level: SpikeLevel,
  zScore: number,
  currentValue: number,
  baseline: Baseline,
  spikeType: SpikeResult["spikeType"]
): SpikeResult {
  return {
    collectionId,
    level,
    zScore,
    currentValue,
    baselineMean: baseline.mean,
    baselineStddev: baseline.stddev,
    spikeType,
  };
}
