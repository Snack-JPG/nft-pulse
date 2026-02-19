import {
  pgTable,
  bigserial,
  text,
  numeric,
  integer,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const collections = pgTable("collections", {
  id: text("id").primaryKey(),
  name: text("name"),
  imageUrl: text("image_url"),
  totalSupply: integer("total_supply"),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const nftSales = pgTable(
  "nft_sales",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    signature: text("signature").unique(),
    collectionId: text("collection_id").notNull(),
    marketplace: text("marketplace"),
    priceSol: numeric("price_sol", { precision: 20, scale: 9 }),
    buyer: text("buyer"),
    seller: text("seller"),
    mint: text("mint"),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_sales_collection_time").on(
      table.collectionId,
      table.timestamp
    ),
  ]
);

export const collectionSnapshots = pgTable(
  "collection_snapshots",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    collectionId: text("collection_id").notNull(),
    floorPriceSol: numeric("floor_price_sol", { precision: 20, scale: 9 }),
    volume1h: numeric("volume_1h", { precision: 20, scale: 9 }),
    volume24h: numeric("volume_24h", { precision: 20, scale: 9 }),
    salesCount1h: integer("sales_count_1h"),
    salesCount24h: integer("sales_count_24h"),
    uniqueBuyers1h: integer("unique_buyers_1h"),
    listingsCount: integer("listings_count"),
    snapshotAt: timestamp("snapshot_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("idx_snapshots_collection_time").on(
      table.collectionId,
      table.snapshotAt
    ),
  ]
);

export const volumeSpikes = pgTable("volume_spikes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  collectionId: text("collection_id").notNull(),
  spikeType: text("spike_type"),
  currentValue: numeric("current_value"),
  baselineValue: numeric("baseline_value"),
  multiplier: numeric("multiplier"),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
  alerted: boolean("alerted").default(false),
});
