import { Bot } from "grammy";
import { db, schema } from "./db";
import { sql, eq, and } from "drizzle-orm";
import type { SpikeLevel, SpikeResult } from "./types";

let bot: Bot | null = null;

const SPIKE_ORDER: Record<SpikeLevel, number> = {
  elevated: 0,
  spike: 1,
  extreme: 2,
};

export function getTelegramBot(): Bot {
  if (bot) return bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");
  bot = new Bot(token);

  bot.command("start", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    // Upsert subscriber
    await db
      .insert(schema.telegramSubscribers)
      .values({ chatId, threshold: "spike", active: true })
      .onConflictDoUpdate({
        target: schema.telegramSubscribers.chatId,
        set: { active: true },
      });

    await ctx.reply(
      "🎯 *NFT Pulse — Solana Volume Tracker*\n\n" +
        "You're subscribed to spike alerts\\!\n\n" +
        "*Commands:*\n" +
        "/top — Top collections by 1h volume\n" +
        "/watchlist — Manage your watchlist\n" +
        "/threshold — Set alert sensitivity\n" +
        "/stop — Unsubscribe from alerts",
      { parse_mode: "MarkdownV2" }
    );
  });

  bot.command("stop", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    await db
      .update(schema.telegramSubscribers)
      .set({ active: false })
      .where(eq(schema.telegramSubscribers.chatId, chatId));
    await ctx.reply("Unsubscribed from alerts. Use /start to re-subscribe.");
  });

  bot.command("top", async (ctx) => {
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
        collection_id: string;
        name: string;
        volume_1h: number;
        volume_24h: number;
        floor_price_sol: number;
      }>;

      if (rows.length === 0) {
        await ctx.reply("📡 No data yet. Waiting for collections to be tracked.");
        return;
      }

      let msg = "📈 *Top Collections (1h Volume)*\n\n";
      rows.forEach((r, i) => {
        const floor = r.floor_price_sol?.toFixed(2) ?? "—";
        const v1h = r.volume_1h?.toFixed(1) ?? "0";
        const v24h = r.volume_24h?.toFixed(0) ?? "0";
        msg += `${i + 1}. *${escapeMarkdown(r.name)}*\n`;
        msg += `   Floor: ${floor} SOL · 1h: ${v1h} SOL · 24h: ${v24h} SOL\n\n`;
      });

      await ctx.reply(msg, { parse_mode: "MarkdownV2" });
    } catch (err) {
      console.error("Error in /top:", err);
      await ctx.reply("⚠️ Failed to fetch data. Try again later.");
    }
  });

  bot.command("watchlist", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const args = ctx.match?.trim();

    if (!args) {
      // Show current watchlist
      const entries = await db
        .select({
          collectionId: schema.watchlistEntries.collectionId,
          name: schema.collections.name,
        })
        .from(schema.watchlistEntries)
        .leftJoin(
          schema.collections,
          eq(schema.watchlistEntries.collectionId, schema.collections.id)
        )
        .where(eq(schema.watchlistEntries.chatId, chatId));

      if (entries.length === 0) {
        await ctx.reply(
          "📋 Your watchlist is empty.\n\nAdd collections:\n/watchlist add <collection-slug>"
        );
        return;
      }

      let msg = "📋 *Your Watchlist*\n\n";
      entries.forEach((e, i) => {
        msg += `${i + 1}. ${escapeMarkdown(e.name ?? e.collectionId)}\n`;
      });
      msg += "\nRemove: /watchlist remove <slug>";
      await ctx.reply(msg, { parse_mode: "MarkdownV2" });
      return;
    }

    const [action, ...rest] = args.split(" ");
    const collection = rest.join(" ").trim();

    if (action === "add" && collection) {
      await db
        .insert(schema.watchlistEntries)
        .values({ chatId, collectionId: collection })
        .onConflictDoNothing();
      await ctx.reply(`✅ Added *${escapeMarkdown(collection)}* to your watchlist.`, {
        parse_mode: "MarkdownV2",
      });
    } else if (action === "remove" && collection) {
      await db
        .delete(schema.watchlistEntries)
        .where(
          and(
            eq(schema.watchlistEntries.chatId, chatId),
            eq(schema.watchlistEntries.collectionId, collection)
          )
        );
      await ctx.reply(`🗑️ Removed *${escapeMarkdown(collection)}* from your watchlist.`, {
        parse_mode: "MarkdownV2",
      });
    } else {
      await ctx.reply("Usage: /watchlist add <slug> or /watchlist remove <slug>");
    }
  });

  bot.command("threshold", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const level = ctx.match?.trim() as SpikeLevel | undefined;
    const valid: SpikeLevel[] = ["elevated", "spike", "extreme"];

    if (!level || !valid.includes(level)) {
      // Get current threshold
      const [sub] = await db
        .select({ threshold: schema.telegramSubscribers.threshold })
        .from(schema.telegramSubscribers)
        .where(eq(schema.telegramSubscribers.chatId, chatId))
        .limit(1);

      const current = sub?.threshold ?? "spike";
      await ctx.reply(
        `🎚️ Alert threshold: *${current}*\n\n` +
          "Options:\n" +
          "• elevated — z ≥ 2.0 (most alerts)\n" +
          "• spike — z ≥ 3.0 (default)\n" +
          "• extreme — z ≥ 5.0 (rare alerts)\n\n" +
          "Set: /threshold elevated|spike|extreme",
        { parse_mode: "Markdown" }
      );
      return;
    }

    await db
      .update(schema.telegramSubscribers)
      .set({ threshold: level })
      .where(eq(schema.telegramSubscribers.chatId, chatId));
    await ctx.reply(`✅ Alert threshold set to *${level}*`, {
      parse_mode: "Markdown",
    });
  });

  return bot;
}

// Send spike alerts to all eligible subscribers
export async function broadcastSpikeAlert(
  spike: SpikeResult,
  collectionName?: string
): Promise<number> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return 0;

  const alertBot = getTelegramBot();
  const message = formatSpikeAlert(spike, collectionName);

  // Get all active subscribers whose threshold allows this spike level
  const subscribers = await db
    .select()
    .from(schema.telegramSubscribers)
    .where(
      and(
        eq(schema.telegramSubscribers.active, true)
      )
    );

  let sent = 0;
  for (const sub of subscribers) {
    const subThreshold = (sub.threshold ?? "spike") as SpikeLevel;
    if (SPIKE_ORDER[spike.level] < SPIKE_ORDER[subThreshold]) continue;

    try {
      await alertBot.api.sendMessage(sub.chatId, message, {
        parse_mode: "Markdown",
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send alert to ${sub.chatId}:`, err);
    }
  }

  return sent;
}

// Also check watchlist — send to watchers regardless of threshold
export async function notifyWatchers(
  collectionId: string,
  spike: SpikeResult,
  collectionName?: string
): Promise<number> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return 0;

  const alertBot = getTelegramBot();
  const message = "🔔 *Watchlist Alert*\n\n" + formatSpikeAlert(spike, collectionName);

  const watchers = await db
    .select({ chatId: schema.watchlistEntries.chatId })
    .from(schema.watchlistEntries)
    .where(eq(schema.watchlistEntries.collectionId, collectionId));

  let sent = 0;
  for (const w of watchers) {
    try {
      await alertBot.api.sendMessage(w.chatId, message, {
        parse_mode: "Markdown",
      });
      sent++;
    } catch (err) {
      console.error(`Failed to notify watcher ${w.chatId}:`, err);
    }
  }

  return sent;
}

export function formatSpikeAlert(
  spike: SpikeResult,
  collectionName?: string
): string {
  const name = collectionName ?? spike.collectionId;
  const mult =
    spike.baselineMean > 0
      ? (spike.currentValue / spike.baselineMean).toFixed(1)
      : "∞";
  const emoji =
    spike.level === "extreme" ? "🚨" : spike.level === "spike" ? "⚡" : "📊";

  return (
    `${emoji} *${spike.level.toUpperCase()}* — ${name}\n\n` +
    `Volume: *${spike.currentValue.toFixed(1)} SOL* (${mult}x baseline)\n` +
    `Z-Score: ${spike.zScore === Infinity ? "∞" : spike.zScore.toFixed(1)}\n` +
    `Type: ${spike.spikeType}`
  );
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}
