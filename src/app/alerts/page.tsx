import { SpikeBadge } from "@/components/spike-badge";
import Link from "next/link";
import type { SpikeLevel } from "@/lib/types";

interface AlertRow {
  id: number;
  collection_id: string;
  collection_name: string;
  image_url: string | null;
  spike_type: string;
  current_value: number;
  baseline_value: number;
  multiplier: number;
  detected_at: string;
  alerted: boolean;
}

function multiplierToLevel(mult: number): SpikeLevel {
  if (mult >= 5) return "extreme";
  if (mult >= 3) return "spike";
  return "elevated";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function getAlerts(): Promise<AlertRow[] | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/alerts?hours=48&limit=50`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🔔 Volume Alerts</h1>
          <p className="text-zinc-400 mt-1">
            Real-time spike detection across all tracked collections.
          </p>
        </div>

        {alerts === null ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-4xl mb-3">⚠️</p>
            <p>Database not connected. Set DATABASE_URL in .env.</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-4xl mb-3">🔕</p>
            <p className="text-lg font-medium">No spikes detected</p>
            <p className="text-sm mt-1">
              When volume anomalies are detected, they&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={`/collection/${alert.collection_id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <SpikeBadge level={multiplierToLevel(alert.multiplier)} />
                  <div>
                    <p className="text-white font-medium">
                      {alert.collection_name}
                    </p>
                    <p className="text-zinc-500 text-xs">
                      {alert.current_value.toFixed(1)} SOL volume ·{" "}
                      {alert.multiplier.toFixed(1)}x baseline
                    </p>
                  </div>
                </div>
                <span className="text-zinc-500 text-xs whitespace-nowrap">
                  {timeAgo(alert.detected_at)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
