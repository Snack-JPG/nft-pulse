import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const results = await db.execute(sql`
      SELECT
        cs.collection_id,
        c.name,
        c.image_url,
        cs.floor_price_sol::float,
        cs.volume_1h::float,
        cs.volume_24h::float,
        cs.sales_count_1h,
        cs.sales_count_24h,
        cs.unique_buyers_1h,
        cs.listings_count,
        vs.spike_type,
        vs.multiplier::float
      FROM (
        SELECT DISTINCT ON (collection_id) *
        FROM collection_snapshots
        ORDER BY collection_id, snapshot_at DESC
      ) cs
      LEFT JOIN collections c ON c.id = cs.collection_id
      LEFT JOIN (
        SELECT DISTINCT ON (collection_id) *
        FROM volume_spikes
        WHERE detected_at > NOW() - INTERVAL '1 hour'
        ORDER BY collection_id, detected_at DESC
      ) vs ON vs.collection_id = cs.collection_id
      ORDER BY cs.volume_1h DESC NULLS LAST
      LIMIT 50
    `);

    return NextResponse.json(results.rows);
  } catch (error) {
    console.error("Collections API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
