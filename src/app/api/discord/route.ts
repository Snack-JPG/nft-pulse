import { NextRequest, NextResponse } from "next/server";
import {
  InteractionType,
  InteractionResponseType,
  type APIInteraction,
  type APIChatInputApplicationCommandInteraction,
} from "discord-api-types/v10";
import { verifyDiscordRequest } from "@/lib/discord-verify";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { buildSpikeEmbed } from "@/lib/discord";

/**
 * Discord Interactions endpoint — receives slash command invocations
 * from Discord. Must be registered as the "Interactions Endpoint URL"
 * in the Discord Developer Portal.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const isValid = await verifyDiscordRequest(body, signature, timestamp);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const interaction = JSON.parse(body) as APIInteraction;

  // Handle ping (verification handshake)
  if (interaction.type === InteractionType.Ping) {
    return NextResponse.json({ type: InteractionResponseType.Pong });
  }

  // Handle slash commands
  if (interaction.type === InteractionType.ApplicationCommand) {
    const cmd = interaction as APIChatInputApplicationCommandInteraction;
    const name = cmd.data.name;

    switch (name) {
      case "top":
        return handleTopCommand();
      case "alerts":
        return handleAlertsCommand();
      case "status":
        return handleStatusCommand();
      default:
        return NextResponse.json({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: { content: "Unknown command.", flags: 64 },
        });
    }
  }

  return NextResponse.json({ error: "Unhandled interaction type" }, { status: 400 });
}

async function handleTopCommand() {
  try {
    const results = await db.execute(sql`
      SELECT
        cs.collection_id,
        COALESCE(c.name, cs.collection_id) as name,
        cs.volume_1h::float,
        cs.volume_24h::float,
        cs.floor_price_sol::float
      FROM (
        SELECT DISTINCT ON (collection_id) *
        FROM collection_snapshots
        ORDER BY collection_id, snapshot_at DESC
      ) cs
      LEFT JOIN collections c ON c.id = cs.collection_id
      WHERE cs.volume_1h::float > 0
      ORDER BY cs.volume_1h::float DESC
      LIMIT 10
    `);

    const rows = results.rows as Array<{
      name: string;
      volume_1h: number;
      volume_24h: number;
      floor_price_sol: number;
    }>;

    if (rows.length === 0) {
      return NextResponse.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: "📡 No data yet. Waiting for collections to be tracked." },
      });
    }

    const lines = rows.map(
      (r, i) =>
        `**${i + 1}.** ${r.name} — Floor: ${r.floor_price_sol?.toFixed(2) ?? "—"} SOL · 1h: ${r.volume_1h?.toFixed(1)} SOL · 24h: ${r.volume_24h?.toFixed(0)} SOL`
    );

    return NextResponse.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          {
            title: "📈 Top Collections (1h Volume)",
            color: 0x8b5cf6,
            description: lines.join("\n"),
            timestamp: new Date().toISOString(),
            footer: { text: "NFT Pulse" },
          },
        ],
      },
    });
  } catch (err) {
    console.error("Discord /top error:", err);
    return NextResponse.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: "⚠️ Failed to fetch data.", flags: 64 },
    });
  }
}

async function handleAlertsCommand() {
  try {
    const results = await db.execute(sql`
      SELECT
        vs.collection_id,
        COALESCE(c.name, vs.collection_id) as name,
        vs.spike_type,
        vs.current_value::float,
        vs.baseline_value::float,
        vs.multiplier::float,
        vs.detected_at
      FROM volume_spikes vs
      LEFT JOIN collections c ON c.id = vs.collection_id
      ORDER BY vs.detected_at DESC
      LIMIT 5
    `);

    const rows = results.rows as Array<{
      name: string;
      spike_type: string;
      current_value: number;
      baseline_value: number;
      multiplier: number;
      detected_at: string;
    }>;

    if (rows.length === 0) {
      return NextResponse.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: "No recent spikes detected." },
      });
    }

    const lines = rows.map(
      (r) =>
        `**${r.name}** — ${r.multiplier?.toFixed(1)}x baseline · ${r.current_value?.toFixed(1)} SOL · <t:${Math.floor(new Date(r.detected_at).getTime() / 1000)}:R>`
    );

    return NextResponse.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          {
            title: "🚨 Recent Spike Alerts",
            color: 0xef4444,
            description: lines.join("\n"),
            timestamp: new Date().toISOString(),
            footer: { text: "NFT Pulse" },
          },
        ],
      },
    });
  } catch (err) {
    console.error("Discord /alerts error:", err);
    return NextResponse.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: "⚠️ Failed to fetch alerts.", flags: 64 },
    });
  }
}

async function handleStatusCommand() {
  try {
    const [collections, spikes, snapshots] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM collections`),
      db.execute(sql`SELECT COUNT(*) as count FROM volume_spikes WHERE detected_at > NOW() - INTERVAL '24 hours'`),
      db.execute(sql`SELECT MAX(snapshot_at) as latest FROM collection_snapshots`),
    ]);

    const collectionCount = (collections.rows[0] as { count: string })?.count ?? "0";
    const spikeCount = (spikes.rows[0] as { count: string })?.count ?? "0";
    const latestSnapshot = (snapshots.rows[0] as { latest: string })?.latest;
    const lastUpdate = latestSnapshot
      ? `<t:${Math.floor(new Date(latestSnapshot).getTime() / 1000)}:R>`
      : "Never";

    return NextResponse.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          {
            title: "📊 NFT Pulse Status",
            color: 0x22c55e,
            fields: [
              { name: "Collections Tracked", value: collectionCount, inline: true },
              { name: "Spikes (24h)", value: spikeCount, inline: true },
              { name: "Last Update", value: lastUpdate, inline: true },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: "NFT Pulse" },
          },
        ],
      },
    });
  } catch (err) {
    console.error("Discord /status error:", err);
    return NextResponse.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: "⚠️ Failed to fetch status.", flags: 64 },
    });
  }
}
