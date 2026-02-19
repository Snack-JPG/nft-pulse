import { NextRequest, NextResponse } from "next/server";
import { getTelegramBot } from "@/lib/telegram";
import { webhookCallback } from "grammy";

// grammY webhook handler for Telegram Bot API
const bot = (() => {
  try {
    return getTelegramBot();
  } catch {
    return null;
  }
})();

export async function POST(req: NextRequest) {
  if (!bot) {
    return NextResponse.json(
      { error: "Bot not configured" },
      { status: 503 }
    );
  }

  try {
    // grammY's webhookCallback expects a web-standard handler
    const handler = webhookCallback(bot, "std/http");
    return await handler(req);
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
