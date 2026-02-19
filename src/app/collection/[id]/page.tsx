import { VolumeChart } from "@/components/volume-chart";
import { SpikeBadge } from "@/components/spike-badge";
import Link from "next/link";
import type { SpikeLevel } from "@/lib/types";

interface Snapshot {
  floor_price_sol: string | null;
  volume_1h: string | null;
  volume_24h: string | null;
  sales_count_1h: number | null;
  sales_count_24h: number | null;
  unique_buyers_1h: number | null;
  listings_count: number | null;
  snapshot_at: string;
}

interface Spike {
  id: number;
  spike_type: string;
  current_value: string;
  baseline_value: string;
  multiplier: string;
  detected_at: string;
}

interface CollectionData {
  collection: {
    id: string;
    name: string | null;
    image_url: string | null;
    total_supply: number | null;
  };
  snapshots: Snapshot[];
  spikes: Spike[];
}

function latestSpikeLevel(spikes: Spike[]): SpikeLevel | null {
  if (spikes.length === 0) return null;
  const mult = parseFloat(spikes[0].multiplier);
  if (mult >= 5) return "extreme";
  if (mult >= 3) return "spike";
  if (mult >= 2) return "elevated";
  return null;
}

async function getCollectionData(id: string): Promise<CollectionData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/collections/${id}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCollectionData(id);

  if (!data) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          ← Back to trending
        </Link>
        <div className="text-center py-16 text-zinc-500 mt-8">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-lg font-medium">Collection not found</p>
          <p className="text-sm mt-1">
            No data available for <span className="font-mono text-zinc-400">{id}</span>.
            It may not be tracked yet.
          </p>
        </div>
      </main>
    );
  }

  const name = data.collection?.name ?? id.replace(/-/g, " ");
  const latestSnapshot = data.snapshots?.[0];
  const spikeLevel = latestSpikeLevel(data.spikes);

  const chartData = (data.snapshots ?? [])
    .slice(0, 72)
    .reverse()
    .map((s) => ({
      time: new Date(s.snapshot_at).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      volume: parseFloat(s.volume_1h ?? "0"),
    }));

  const stats = [
    { label: "Floor Price", value: latestSnapshot ? `${parseFloat(latestSnapshot.floor_price_sol ?? "0").toFixed(2)} SOL` : "—" },
    { label: "Volume (1h)", value: latestSnapshot ? `${parseFloat(latestSnapshot.volume_1h ?? "0").toFixed(1)} SOL` : "—" },
    { label: "Volume (24h)", value: latestSnapshot ? `${parseFloat(latestSnapshot.volume_24h ?? "0").toFixed(0)} SOL` : "—" },
    { label: "Sales (24h)", value: latestSnapshot?.sales_count_24h?.toString() ?? "—" },
    { label: "Listings", value: latestSnapshot?.listings_count?.toString() ?? "—" },
    { label: "Supply", value: data.collection?.total_supply?.toLocaleString() ?? "—" },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          ← Back to trending
        </Link>

        <div className="flex items-center gap-4">
          {data.collection?.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.collection.image_url}
              alt={name}
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl">
              🖼️
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white capitalize">{name}</h1>
              <SpikeBadge level={spikeLevel} />
            </div>
            <p className="text-zinc-500 text-sm font-mono">{id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map(({ label, value }) => (
            <div
              key={label}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
            >
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
              <p className="text-lg font-bold text-white mt-1 font-mono">{value}</p>
            </div>
          ))}
        </div>

        {chartData.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">
              Volume History
            </h2>
            <VolumeChart data={chartData} />
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <p>No snapshot data available yet.</p>
          </div>
        )}

        {data.spikes.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">
              Recent Spikes
            </h2>
            <div className="space-y-2">
              {data.spikes.map((spike) => (
                <div
                  key={spike.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-purple-400">
                      {parseFloat(spike.current_value).toFixed(1)} SOL
                    </span>
                    <span className="text-xs text-zinc-500">
                      {parseFloat(spike.multiplier).toFixed(1)}x baseline
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(spike.detected_at).toLocaleString("en-GB")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
