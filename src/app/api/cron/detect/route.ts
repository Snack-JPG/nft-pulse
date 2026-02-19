import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { computeBaseline, detectSpike } from "@/lib/spike-detector";
import { BASELINE_WINDOW_DAYS } from "@/lib/constants";
import type { SpikeResult } from "@/lib/types";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get latest snapshot per collection
    const latestSnapshots = await db.execute(sql`
      SELECT DISTINCT ON (collection_id)
        collection_id, volume_1h::float, sales_count_1h
      FROM collection_snapshots
      WHERE snapshot_at > NOW() - INTERVAL '10 minutes'
      ORDER BY collection_id, snapshot_at DESC
    `);

    const spikesDetected: SpikeResult[] = [];

    for (const row of latestSnapshots.rows as Array<{
      collection_id: string;
      volume_1h: number;
      sales_count_1h: number;
    }>) {
      // Fetch baseline: hourly volumes over past N days
      const baselineRows = await db.execute(sql`
        SELECT volume_1h::float as vol
        FROM collection_snapshots
        WHERE collection_id = ${row.collection_id}
          AND snapshot_at > NOW() - INTERVAL '${sql.raw(String(BASELINE_WINDOW_DAYS))} days'
          AND snapshot_at < NOW() - INTERVAL '1 hour'
        ORDER BY snapshot_at DESC
        LIMIT ${BASELINE_WINDOW_DAYS * 24}
      `);

      const values = (baselineRows.rows as Array<{ vol: number }>).map((r) => r.vol);
      const baseline = computeBaseline(values);

      const spike = detectSpike(
        row.collection_id,
        row.volume_1h,
        row.sales_count_1h,
        baseline,
        "volume"
      );

      if (spike) {
        spikesDetected.push(spike);
        await db.insert(schema.volumeSpikes).values({
          collectionId: spike.collectionId,
          spikeType: spike.spikeType,
          currentValue: spike.currentValue.toString(),
          baselineValue: spike.baselineMean.toString(),
          multiplier: (spike.baselineMean > 0
            ? spike.currentValue / spike.baselineMean
            : 0
          ).toString(),
          detectedAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      checked: latestSnapshots.rows.length,
      spikes: spikesDetected.length,
      details: spikesDetected,
    });
  } catch (error) {
    console.error("Spike detection error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
