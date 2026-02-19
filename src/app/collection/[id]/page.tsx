import { VolumeChart } from "@/components/volume-chart";
import { SpikeBadge } from "@/components/spike-badge";
import Link from "next/link";

const mockChartData = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  volume: Math.random() * 50 + (i > 14 && i < 20 ? 80 : 10),
}));

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
          Back
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl">
          NFT
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white capitalize">
              {id.replace(/-/g, " ")}
            </h1>
            <SpikeBadge level="spike" />
          </div>
          <p className="text-zinc-400 text-sm">Collection ID: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Floor Price", value: "38.2 SOL" },
          { label: "Volume (1h)", value: "180 SOL" },
          { label: "Volume (24h)", value: "950 SOL" },
          { label: "Sales (1h)", value: "42" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
          >
            <p className="text-xs text-zinc-400 uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Volume (24h)</h2>
        <VolumeChart data={mockChartData} />
      </div>
    </div>
  );
}
