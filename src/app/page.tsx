import { LandingHero } from "@/components/landing-hero";
import { TrendingTable } from "@/components/trending-table";
import type { SpikeLevel } from "@/lib/types";

interface CollectionRow {
  collection_id: string;
  name: string | null;
  image_url: string | null;
  floor_price_sol: number | null;
  volume_1h: number | null;
  volume_24h: number | null;
  sales_count_1h: number | null;
  sales_count_24h: number | null;
  unique_buyers_1h: number | null;
  listings_count: number | null;
  spike_type: string | null;
  multiplier: number | null;
  volume_history: number[] | null;
}

function inferSpikeLevel(multiplier: number | null): SpikeLevel | null {
  if (!multiplier) return null;
  if (multiplier >= 5) return "extreme";
  if (multiplier >= 3) return "spike";
  if (multiplier >= 2) return "elevated";
  return null;
}

async function getCollections() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/collections`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return (await res.json()) as CollectionRow[];
  } catch {
    return null;
  }
}

export default async function Home() {
  const collections = await getCollections();

  const data = collections
    ? collections.map((c) => ({
        id: c.collection_id,
        name: c.name ?? c.collection_id,
        floorPriceSol: c.floor_price_sol ?? 0,
        volume1h: c.volume_1h ?? 0,
        volume24h: c.volume_24h ?? 0,
        salesCount1h: c.sales_count_1h ?? 0,
        uniqueBuyers1h: c.unique_buyers_1h ?? 0,
        spikeLevel: inferSpikeLevel(c.multiplier),
        volumeHistory: c.volume_history ?? [],
      }))
    : null;

  return (
    <main>
      <LandingHero />
      <div id="trending" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Trending Collections</h2>
          <p className="text-zinc-400 mt-1">
            Real-time volume and spike detection across Solana NFT marketplaces
          </p>
        </div>
        {data ? (
          data.length > 0 ? (
            <TrendingTable data={data} />
          ) : (
            <div className="text-center py-16 text-zinc-500">
              <p className="text-4xl mb-3">📡</p>
              <p className="text-lg font-medium">No data yet</p>
              <p className="text-sm mt-1">
                Waiting for data from Helius webhooks and Tensor polling.
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-lg font-medium">Database not connected</p>
            <p className="text-sm mt-1">
              Set DATABASE_URL in .env to connect to Neon PostgreSQL.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

