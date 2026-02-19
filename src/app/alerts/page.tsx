"use client";

import { SpikeBadge } from "@/components/spike-badge";
import type { SpikeLevel } from "@/lib/types";

const MOCK_ALERTS = [
  { id: 1, collection: "Mad Lads", level: "extreme" as SpikeLevel, volume: 3210, time: "5 min ago" },
  { id: 2, collection: "Tensorians", level: "spike" as SpikeLevel, volume: 890, time: "12 min ago" },
  { id: 3, collection: "Okay Bears", level: "elevated" as SpikeLevel, volume: 420, time: "1h ago" },
  { id: 4, collection: "Famous Fox Federation", level: "spike" as SpikeLevel, volume: 670, time: "2h ago" },
  { id: 5, collection: "Claynosaurz", level: "elevated" as SpikeLevel, volume: 310, time: "4h ago" },
];

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🔔 Volume Alerts</h1>
        <p className="text-zinc-400 mt-1">Real-time spike detection across all tracked collections.</p>
      </div>

      <div className="space-y-2">
        {MOCK_ALERTS.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <SpikeBadge level={alert.level} />
              <div>
                <p className="text-white font-medium">{alert.collection}</p>
                <p className="text-zinc-500 text-xs">{alert.volume.toLocaleString()} SOL volume</p>
              </div>
            </div>
            <span className="text-zinc-500 text-xs">{alert.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
