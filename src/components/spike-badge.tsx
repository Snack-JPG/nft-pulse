"use client";

import type { SpikeLevel } from "@/lib/types";

const config: Record<SpikeLevel, { label: string; className: string }> = {
  elevated: { label: "📊 ELEVATED", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  spike: { label: "⚡ SPIKE", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  extreme: { label: "🚨 EXTREME", className: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" },
};

export function SpikeBadge({ level }: { level: SpikeLevel | null }) {
  if (!level) return null;
  const { label, className } = config[level];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${className}`}>
      {label}
    </span>
  );
}
