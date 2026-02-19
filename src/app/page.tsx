import { TrendingTable } from "@/components/trending-table";
import type { SpikeLevel } from "@/lib/types";

const mockData: Array<{
  id: string;
  name: string;
  floorPriceSol: number;
  volume1h: number;
  volume24h: number;
  salesCount1h: number;
  uniqueBuyers1h: number;
  spikeLevel: SpikeLevel | null;
}> = [
  { id: "mad-lads", name: "Mad Lads", floorPriceSol: 142.5, volume1h: 245, volume24h: 1820, salesCount1h: 18, uniqueBuyers1h: 15, spikeLevel: "extreme" },
  { id: "tensorians", name: "Tensorians", floorPriceSol: 38.2, volume1h: 180, volume24h: 950, salesCount1h: 42, uniqueBuyers1h: 35, spikeLevel: "spike" },
  { id: "famous-fox-federation", name: "Famous Fox Federation", floorPriceSol: 12.8, volume1h: 95, volume24h: 420, salesCount1h: 28, uniqueBuyers1h: 22, spikeLevel: "elevated" },
  { id: "claynosaurz", name: "Claynosaurz", floorPriceSol: 8.4, volume1h: 62, volume24h: 310, salesCount1h: 15, uniqueBuyers1h: 12, spikeLevel: null },
  { id: "okay-bears", name: "Okay Bears", floorPriceSol: 22.1, volume1h: 55, volume24h: 280, salesCount1h: 8, uniqueBuyers1h: 7, spikeLevel: null },
  { id: "degenerate-ape", name: "Degenerate Ape Academy", floorPriceSol: 10.5, volume1h: 48, volume24h: 195, salesCount1h: 12, uniqueBuyers1h: 10, spikeLevel: "elevated" },
  { id: "smb-gen2", name: "SMB Gen2", floorPriceSol: 185.0, volume1h: 42, volume24h: 890, salesCount1h: 3, uniqueBuyers1h: 3, spikeLevel: null },
  { id: "bonk-nft", name: "Bonk NFT", floorPriceSol: 1.2, volume1h: 38, volume24h: 150, salesCount1h: 55, uniqueBuyers1h: 40, spikeLevel: "spike" },
];

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trending Collections</h1>
        <p className="text-zinc-400 mt-1">
          Real-time volume and spike detection across Solana NFT marketplaces
        </p>
      </div>
      <TrendingTable data={mockData} />
    </div>
  );
}
