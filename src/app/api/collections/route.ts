import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 60, windowSeconds: 60 });
  if (limited) return limited;

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

    // Fetch recent hourly volume history (last 12 snapshots) for sparklines
    const historyResults = await db.execute(sql`
      SELECT collection_id, array_agg(vol ORDER BY snapshot_at ASC) AS volume_history
      FROM (
        SELECT collection_id, volume_1h::float AS vol, snapshot_at
        FROM collection_snapshots
        WHERE snapshot_at > NOW() - INTERVAL '12 hours'
      ) sub
      GROUP BY collection_id
    `);

    const historyMap = new Map<string, number[]>();
    for (const row of historyResults.rows as Array<{ collection_id: string; volume_history: number[] }>) {
      historyMap.set(row.collection_id, row.volume_history);
    }

    const rows = (results.rows as Array<Record<string, unknown>>).map((r) => ({
      ...r,
      volume_history: historyMap.get(r.collection_id as string) ?? [],
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Collections API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
