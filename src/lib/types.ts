export type SpikeLevel = "elevated" | "spike" | "extreme";

export interface SpikeResult {
  collectionId: string;
  level: SpikeLevel;
  zScore: number;
  currentValue: number;
  baselineMean: number;
  baselineStddev: number;
  spikeType: "volume" | "sales_count" | "unique_buyers";
}

export interface CollectionStats {
  id: string;
  name: string;
  imageUrl: string | null;
  floorPriceSol: number;
  volume1h: number;
  volume24h: number;
  salesCount1h: number;
  salesCount24h: number;
  uniqueBuyers1h: number;
  listingsCount: number;
  spikeLevel: SpikeLevel | null;
}

export interface TrendingCollection extends CollectionStats {
  volumeChange24hPct: number;
}

export interface CollectionDetail extends CollectionStats {
  totalSupply: number | null;
  snapshots: CollectionSnapshot[];
  recentSpikes: VolumeSpike[];
}

export interface CollectionSnapshot {
  floorPriceSol: number;
  volume1h: number;
  volume24h: number;
  salesCount1h: number;
  salesCount24h: number;
  uniqueBuyers1h: number;
  listingsCount: number;
  snapshotAt: string;
}

export interface VolumeSpike {
  id: number;
  collectionId: string;
  collectionName?: string;
  spikeType: string;
  currentValue: number;
  baselineValue: number;
  multiplier: number;
  detectedAt: string;
  alerted: boolean;
}
