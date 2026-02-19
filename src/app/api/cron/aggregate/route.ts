import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Aggregate sales data per collection for 1h and 24h windows
    const aggregations = await db.execute(sql`
      SELECT
        collection_id,
        COALESCE(SUM(CASE WHEN timestamp > NOW() - INTERVAL '1 hour' THEN price_sol::numeric ELSE 0 END), 0) as volume_1h,
        COALESCE(SUM(CASE WHEN timestamp > NOW() - INTERVAL '24 hours' THEN price_sol::numeric ELSE 0 END), 0) as volume_24h,
        COALESCE(COUNT(CASE WHEN timestamp > NOW() - INTERVAL '1 hour' THEN 1 END), 0) as sales_count_1h,
        COALESCE(COUNT(CASE WHEN timestamp > NOW() - INTERVAL '24 hours' THEN 1 END), 0) as sales_count_24h,
        COALESCE(COUNT(DISTINCT CASE WHEN timestamp > NOW() - INTERVAL '1 hour' THEN buyer END), 0) as unique_buyers_1h
      FROM nft_sales
      WHERE timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY collection_id
      HAVING COUNT(*) > 0
    `);

    const rows = aggregations.rows as Array<{
      collection_id: string;
      volume_1h: string;
      volume_24h: string;
      sales_count_1h: string;
      sales_count_24h: string;
      unique_buyers_1h: string;
    }>;

    // Insert snapshots
    for (const row of rows) {
      await db.insert(schema.collectionSnapshots).values({
        collectionId: row.collection_id,
        volume1h: row.volume_1h,
        volume24h: row.volume_24h,
        salesCount1h: parseInt(row.sales_count_1h),
        salesCount24h: parseInt(row.sales_count_24h),
        uniqueBuyers1h: parseInt(row.unique_buyers_1h),
        snapshotAt: now,
      });
    }

    return NextResponse.json({ aggregated: rows.length, timestamp: now });
  } catch (error) {
    console.error("Aggregation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
