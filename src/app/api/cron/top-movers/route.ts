import { NextRequest, NextResponse } from "next/server";
import { sendTopMoversEmbed } from "@/lib/discord";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * Hourly cron: posts the top movers leaderboard to Discord #top-movers.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await sendTopMoversEmbed();
    return NextResponse.json({ success: true, posted: sent });
  } catch (error) {
    console.error("Top movers cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
