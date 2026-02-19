import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { fetchTrendingCollections, normalizeTensorStats } from "@/lib/tensor";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawCollections = await fetchTrendingCollections(50);
    const now = new Date();
    let upserted = 0;

    for (const raw of rawCollections) {
      const stats = normalizeTensorStats(raw);

      // Upsert collection metadata
      await db
        .insert(schema.collections)
        .values({
          id: stats.id,
          name: stats.name,
          imageUrl: stats.imageUrl,
          totalSupply: stats.totalSupply,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.collections.id,
          set: {
            name: stats.name,
            imageUrl: stats.imageUrl,
            totalSupply: stats.totalSupply,
            updatedAt: now,
          },
        });

      // Insert snapshot
      await db.insert(schema.collectionSnapshots).values({
        collectionId: stats.id,
        floorPriceSol: stats.floorPriceSol.toString(),
        volume1h: stats.volume1h.toString(),
        volume24h: stats.volume24h.toString(),
        salesCount1h: 0, // Tensor doesn't give 1h sales directly
        salesCount24h: stats.salesCount24h,
        uniqueBuyers1h: 0,
        listingsCount: stats.listingsCount,
        snapshotAt: now,
      });

      upserted++;
    }

    return NextResponse.json({ upserted, timestamp: now.toISOString() });
  } catch (error) {
    console.error("Tensor poll error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
