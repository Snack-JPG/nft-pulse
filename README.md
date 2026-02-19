# 🎯 NFT Pulse — Solana Volume Tracker

Real-time Solana NFT volume spike detection with a dashboard and Telegram alerts.

## What It Does

- **Tracks** NFT sales across Solana marketplaces via Helius webhooks
- **Polls** Tensor API for collection-level stats (floor, volume, listings)
- **Detects** volume spikes using z-score anomaly detection with rolling 7-day baselines
- **Alerts** via Telegram bot and Discord — subscribe, set thresholds, watch specific collections
- **Discord** bot with slash commands, severity-routed alerts, top movers leaderboard, and NFT-gated role verification
- **Displays** a dark-themed dashboard with trending tables, volume charts, and alert feeds

## Architecture

```
Helius Webhooks → API Route → PostgreSQL (raw sales)
Tensor Polling  → Cron       → Collection Snapshots
                                    ↓
                              Spike Detection (z-score)
                                    ↓
                    Dashboard UI + Telegram + Discord Alerts
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router, RSC) |
| Database | Neon PostgreSQL + Drizzle ORM |
| Charts | Recharts |
| Tables | TanStack Table |
| Telegram | grammY (webhook mode) |
| Discord | discord.js / @discordjs/rest |
| Styling | Tailwind CSS v4 (dark theme) |

## Setup

```bash
# Install dependencies
npm install

# Copy env and fill in your keys
cp .env.example .env

# Push schema to database
npx drizzle-kit push

# Run dev server
npm run dev
```

### Required API Keys

1. **Helius** (free tier) — [helius.dev](https://helius.dev) — Solana RPC + webhooks
2. **Tensor** — [tensor.so](https://tensor.so) — NFT marketplace API
3. **Neon** — [neon.tech](https://neon.tech) — Serverless PostgreSQL
4. **Telegram Bot** — [@BotFather](https://t.me/BotFather) — Create bot, get token

### Register Telegram Webhook

After deploying, hit:
```
GET /api/telegram/setup?secret=YOUR_CRON_SECRET
```

### Discord Bot Setup

1. Create an application at [discord.com/developers](https://discord.com/developers/applications)
2. Under **Bot**, enable the bot and copy the token → `DISCORD_BOT_TOKEN`
3. Copy the **Application ID** and **Public Key** → `DISCORD_PUBLIC_KEY`
4. Under **OAuth2 → URL Generator**, select `bot` + `applications.commands` scopes with permissions: Send Messages, Embed Links, Manage Roles
5. Invite the bot to your server using the generated URL
6. Set the **Interactions Endpoint URL** to `https://your-domain.com/api/discord`
7. Create channels for alerts and copy their IDs into `.env`:
   - `DISCORD_CHANNEL_ELEVATED` — moderate volume spikes
   - `DISCORD_CHANNEL_SPIKE` — significant spikes
   - `DISCORD_CHANNEL_EXTREME` — extreme spikes
   - `DISCORD_CHANNEL_TOP_MOVERS` — hourly leaderboard
8. Create a "Premium" role and copy its ID → `DISCORD_ROLE_PREMIUM`

**Register slash commands** (one-time, run locally):
```bash
npx ts-node -e "
const { REST, Routes } = require('discord-api-types/v10');
const rest = new (require('@discordjs/rest').REST)({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
rest.put(Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, process.env.DISCORD_GUILD_ID), {
  body: [
    { name: 'top', description: 'Top 10 collections by 1h volume' },
    { name: 'alerts', description: 'Recent spike alerts' },
    { name: 'status', description: 'NFT Pulse system status' },
  ]
});
"
```

**NFT-gated verification:** Users connect their Solana wallet on the dashboard and verify NFT ownership to receive the Premium role, granting access to #alpha channels.

### Cron Endpoints

Set up external cron (e.g. Vercel Cron, QStash) to call these:

| Endpoint | Frequency | Purpose |
|----------|-----------|---------|
| `/api/cron/poll-tensor` | Every 2 min | Fetch trending collection stats |
| `/api/cron/aggregate` | Every 2 min | Aggregate sale data into snapshots |
| `/api/cron/detect` | Every 1 min | Run spike detection + send alerts |
| `/api/cron/top-movers` | Every 1 hour | Post top movers leaderboard to Discord |

All cron endpoints require `Authorization: Bearer CRON_SECRET` header.

## Pages

- `/` — Trending collections (sortable table, spike badges)
- `/collection/[id]` — Collection detail (volume chart, stats, spike history)
- `/alerts` — Chronological spike alert feed

## Telegram Bot Commands

- `/start` — Subscribe to alerts
- `/stop` — Unsubscribe
- `/top` — Top 10 collections by 1h volume
- `/watchlist` — View/add/remove watched collections
- `/threshold` — Set alert sensitivity (elevated/spike/extreme)

## Spike Detection

Uses z-score anomaly detection:
- **Baseline:** Rolling 7-day average of hourly volumes
- **Elevated:** z ≥ 2.0
- **Spike:** z ≥ 3.0  
- **Extreme:** z ≥ 5.0

Minimum thresholds (1 SOL volume, 5 sales) filter out noise from tiny collections.

## License

MIT
