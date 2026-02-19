"use client";

import { Activity, Bell, Zap, BarChart3, MessageCircle, Shield } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Spike Detection",
    desc: "Z-score anomaly detection on 7-day rolling baselines. Know before the crowd.",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    desc: "Telegram & Discord alerts the moment volume spikes — elevated, spike, or extreme.",
  },
  {
    icon: BarChart3,
    title: "Live Dashboard",
    desc: "Trending collections, sparkline charts, floor prices, and buyer counts in real-time.",
  },
  {
    icon: Activity,
    title: "Helius Webhooks",
    desc: "Every Solana NFT sale captured in real-time via Helius — no polling delay.",
  },
  {
    icon: MessageCircle,
    title: "Custom Thresholds",
    desc: "Set your own multiplier thresholds. Watch specific collections. Your alerts, your rules.",
  },
  {
    icon: Shield,
    title: "NFT-Gated Alpha",
    desc: "Hold the NFT, unlock the #alpha channel. Premium signals for holders only.",
  },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
            <Activity className="w-3.5 h-3.5" />
            Real-time Solana NFT Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Catch Volume Spikes
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Before Everyone Else
            </span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            NFT Pulse monitors every Solana NFT sale in real-time, detects anomalous volume
            spikes using z-score analysis, and alerts you instantly via Telegram and Discord.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://t.me/nftpulse_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Join Telegram Bot
            </a>
            <a
              href="#trending"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition-colors border border-zinc-700"
            >
              <BarChart3 className="w-4 h-4" />
              View Dashboard
            </a>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <f.icon className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-white font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
