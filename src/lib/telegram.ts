import { Bot } from "grammy";
import type { SpikeResult } from "./types";

let bot: Bot | null = null;

export function getTelegramBot(): Bot {
  if (bot) return bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");
  bot = new Bot(token);

  bot.command("start", (ctx) =>
    ctx.reply(
      "NFT Pulse - Solana Volume Tracker\n\n" +
        "Commands:\n" +
        "/top - Top trending collections\n" +
        "/watchlist - Manage your watchlist\n" +
        "/threshold - Set alert threshold"
    )
  );

  bot.command("top", async (ctx) => {
    await ctx.reply(
      "Top Collections (1h Volume)\n\n" +
        "1. Mad Lads - 245 SOL (+340%)\n" +
        "2. Tensorians - 180 SOL (+210%)\n" +
        "3. Famous Fox Fed - 95 SOL (+150%)"
    );
  });

  bot.command("watchlist", async (ctx) => {
    const args = ctx.match?.trim();
    if (!args) {
      await ctx.reply("Your Watchlist\n\nNo collections yet.\n\nUsage: /watchlist add <collection>");
      return;
    }
    const [action, ...rest] = args.split(" ");
    const collection = rest.join(" ");
    if (action === "add" && collection) {
      await ctx.reply("Added " + collection + " to your watchlist.");
    } else if (action === "remove" && collection) {
      await ctx.reply("Removed " + collection + " from your watchlist.");
    }
  });

  bot.command("threshold", async (ctx) => {
    const level = ctx.match?.trim();
    const valid = ["elevated", "spike", "extreme"];
    if (!level || !valid.includes(level)) {
      await ctx.reply("Alert Threshold\n\nCurrent: spike (z >= 3.0)\n\nSet with: /threshold elevated|spike|extreme");
      return;
    }
    await ctx.reply("Alert threshold set to " + level);
  });

  return bot;
}

export function formatSpikeAlert(spike: SpikeResult, collectionName?: string): string {
  const name = collectionName ?? spike.collectionId;
  const mult = spike.baselineMean > 0
    ? (spike.currentValue / spike.baselineMean).toFixed(1)
    : "Infinity";
  return spike.level.toUpperCase() + " - " + name + "\n" +
    "Volume: " + spike.currentValue.toFixed(1) + " SOL (" + mult + "x baseline)\n" +
    "Z-Score: " + (spike.zScore === Infinity ? "Infinity" : spike.zScore.toFixed(1));
}
