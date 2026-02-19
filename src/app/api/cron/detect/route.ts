import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { sql, eq } from "drizzle-orm";
import { computeBaseline, detectSpike } from "@/lib/spike-detector";
import { BASELINE_WINDOW_DAYS } from "@/lib/constants";
import { broadcastSpikeAlert, notifyWatchers } from "@/lib/telegram";
import { verifyCronAuth } from "@/lib/cron-auth";
import type { SpikeResult } from "@/lib/types";

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
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
    let alertsSent = 0;

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

        const multiplier = spike.baselineMean > 0
          ? spike.currentValue / spike.baselineMean
          : 0;

        await db.insert(schema.volumeSpikes).values({
          collectionId: spike.collectionId,
          spikeType: spike.spikeType,
          currentValue: spike.currentValue.toString(),
          baselineValue: spike.baselineMean.toString(),
          multiplier: multiplier.toString(),
          detectedAt: new Date(),
        });

        // Resolve collection name for alerts
        const [collection] = await db
          .select({ name: schema.collections.name })
          .from(schema.collections)
          .where(eq(schema.collections.id, spike.collectionId))
          .limit(1);

        const name = collection?.name ?? spike.collectionId;

        // Send alerts — broadcast to subscribers + notify watchlist
        const [broadcastCount, watcherCount] = await Promise.all([
          broadcastSpikeAlert(spike, name).catch((e) => {
            console.error("Broadcast alert error:", e);
            return 0;
          }),
          notifyWatchers(spike.collectionId, spike, name).catch((e) => {
            console.error("Watcher notify error:", e);
            return 0;
          }),
        ]);

        alertsSent += broadcastCount + watcherCount;

        // Mark as alerted
        // (update the latest spike row — simplistic but works for V1)
        await db.execute(sql`
          UPDATE volume_spikes
          SET alerted = true
          WHERE collection_id = ${spike.collectionId}
            AND detected_at = (
              SELECT MAX(detected_at) FROM volume_spikes
              WHERE collection_id = ${spike.collectionId}
            )
        `);
      }
    }

    return NextResponse.json({
      checked: latestSnapshots.rows.length,
      spikes: spikesDetected.length,
      alertsSent,
      details: spikesDetected,
    });
  } catch (error) {
    console.error("Spike detection error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
