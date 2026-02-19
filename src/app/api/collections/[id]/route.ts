import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const limited = checkRateLimit(_req, { limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const [collection] = await db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.id, id))
      .limit(1);

    const snapshots = await db
      .select()
      .from(schema.collectionSnapshots)
      .where(eq(schema.collectionSnapshots.collectionId, id))
      .orderBy(desc(schema.collectionSnapshots.snapshotAt))
      .limit(168);

    const spikes = await db
      .select()
      .from(schema.volumeSpikes)
      .where(eq(schema.volumeSpikes.collectionId, id))
      .orderBy(desc(schema.volumeSpikes.detectedAt))
      .limit(20);

    return NextResponse.json({
      collection: collection ?? { id, name: id, imageUrl: null, totalSupply: null },
      snapshots,
      spikes,
    });
  } catch (error) {
    console.error("Collection detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
