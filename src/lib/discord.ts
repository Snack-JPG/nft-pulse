import { REST } from "@discordjs/rest";
import {
  Routes,
  type RESTPostAPIChannelMessageJSONBody,
  type APIEmbed,
} from "discord-api-types/v10";
import { db } from "./db";
import { sql } from "drizzle-orm";
import type { SpikeLevel, SpikeResult } from "./types";

// Channel mapping by spike severity — uses env var channel IDs
const SEVERITY_CHANNEL_ENVS: Record<SpikeLevel, string> = {
  elevated: "DISCORD_CHANNEL_ELEVATED",
  spike: "DISCORD_CHANNEL_SPIKE",
  extreme: "DISCORD_CHANNEL_EXTREME",
};

const SEVERITY_COLORS: Record<SpikeLevel, number> = {
  elevated: 0xffd700, // yellow (#FFD700)
  spike: 0xff8c00, // orange (#FF8C00)
  extreme: 0xff0000, // red (#FF0000)
};

const SEVERITY_EMOJI: Record<SpikeLevel, string> = {
  elevated: "📊",
  spike: "⚡",
  extreme: "🚨",
};

function getRest(): REST {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN not set");
  return new REST({ version: "10" }).setToken(token);
}

/** Build a spike alert embed */
export function buildSpikeEmbed(
  spike: SpikeResult,
  collectionName?: string
): APIEmbed {
  const name = collectionName ?? spike.collectionId;
  const mult =
    spike.baselineMean > 0
      ? (spike.currentValue / spike.baselineMean).toFixed(1)
      : "∞";
  const changePct =
    spike.baselineMean > 0
      ? (((spike.currentValue - spike.baselineMean) / spike.baselineMean) * 100).toFixed(0)
      : "∞";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nftpulse.app";

  return {
    title: `${SEVERITY_EMOJI[spike.level]} ${spike.level.toUpperCase()} — ${name}`,
    url: `${appUrl}/collection/${encodeURIComponent(spike.collectionId)}`,
    color: SEVERITY_COLORS[spike.level],
    fields: [
      {
        name: "Volume",
        value: `**${spike.currentValue.toFixed(1)} SOL** (${mult}x baseline)`,
        inline: true,
      },
      {
        name: "Change",
        value: `+${changePct}%`,
        inline: true,
      },
      {
        name: "Baseline",
        value: `${spike.baselineMean.toFixed(1)} SOL`,
        inline: true,
      },
      {
        name: "Z-Score",
        value: spike.zScore === Infinity ? "∞" : spike.zScore.toFixed(1),
        inline: true,
      },
      {
        name: "Type",
        value: spike.spikeType,
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "NFT Pulse · Solana Volume Tracker" },
  };
}

/** Send spike alert to the appropriate severity channel */
export async function sendDiscordSpikeAlert(
  spike: SpikeResult,
  collectionName?: string
): Promise<boolean> {
  try {
    const rest = getRest();
    const envKey = SEVERITY_CHANNEL_ENVS[spike.level];
    const channelId = process.env[envKey];

    if (!channelId) {
      console.error(`${envKey} not set — cannot send Discord alert`);
      return false;
    }

    const body: RESTPostAPIChannelMessageJSONBody = {
      embeds: [buildSpikeEmbed(spike, collectionName)],
    };

    await rest.post(Routes.channelMessages(channelId), { body });
    return true;
  } catch (err) {
    console.error("Discord alert error:", err);
    return false;
  }
}

/** Build and send hourly top movers leaderboard */
export async function sendTopMoversEmbed(): Promise<boolean> {
  try {
    const rest = getRest();
    const channelId = process.env.DISCORD_CHANNEL_TOP_MOVERS;
    if (!channelId) {
      console.warn("DISCORD_CHANNEL_TOP_MOVERS not set");
      return false;
    }

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
      collection_id: string;
      name: string;
      volume_1h: number;
      volume_24h: number;
      floor_price_sol: number;
    }>;

    if (rows.length === 0) return false;

    const lines = rows.map(
      (r, i) =>
        `**${i + 1}.** ${r.name}\n` +
        `Floor: ${r.floor_price_sol?.toFixed(2) ?? "—"} SOL · ` +
        `1h: ${r.volume_1h?.toFixed(1)} SOL · ` +
        `24h: ${r.volume_24h?.toFixed(0)} SOL`
    );

    const embed: APIEmbed = {
      title: "📈 Top Movers — Hourly Leaderboard",
      color: 0x8b5cf6, // purple
      description: lines.join("\n\n"),
      timestamp: new Date().toISOString(),
      footer: { text: "NFT Pulse · Updates every hour" },
    };

    const body: RESTPostAPIChannelMessageJSONBody = { embeds: [embed] };
    await rest.post(Routes.channelMessages(channelId), { body });
    return true;
  } catch (err) {
    console.error("Top movers embed error:", err);
    return false;
  }
}
