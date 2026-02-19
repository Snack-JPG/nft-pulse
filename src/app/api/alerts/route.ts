import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const hours = Math.min(parseInt(searchParams.get("hours") ?? "24"), 168);

  try {
    const results = await db.execute(sql`
      SELECT
        vs.id,
        vs.collection_id,
        COALESCE(c.name, vs.collection_id) as collection_name,
        c.image_url,
        vs.spike_type,
        vs.current_value::float,
        vs.baseline_value::float,
        vs.multiplier::float,
        vs.detected_at,
        vs.alerted
      FROM volume_spikes vs
      LEFT JOIN collections c ON c.id = vs.collection_id
      WHERE vs.detected_at > NOW() - INTERVAL '1 hour' * ${hours}
      ORDER BY vs.detected_at DESC
      LIMIT ${limit}
    `);

    return NextResponse.json(results.rows);
  } catch (error) {
    console.error("Alerts API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
