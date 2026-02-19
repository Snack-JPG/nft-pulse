# 🎯 NFT Pulse — Solana Volume Tracker

Real-time Solana NFT volume spike detection with a dashboard and Telegram alerts.

## What It Does

- **Tracks** NFT sales across Solana marketplaces via Helius webhooks
- **Polls** Tensor API for collection-level stats (floor, volume, listings)
- **Detects** volume spikes using z-score anomaly detection with rolling 7-day baselines
- **Alerts** via Telegram bot — subscribe, set thresholds, watch specific collections
- **Displays** a dark-themed dashboard with trending tables, volume charts, and alert feeds

## Architecture

```
Helius Webhooks → API Route → PostgreSQL (raw sales)
Tensor Polling  → Cron       → Collection Snapshots
                                    ↓
                              Spike Detection (z-score)
                                    ↓
                         Dashboard UI + Telegram Alerts
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router, RSC) |
| Database | Neon PostgreSQL + Drizzle ORM |
| Charts | Recharts |
| Tables | TanStack Table |
| Telegram | grammY (webhook mode) |
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

### Cron Endpoints

Set up external cron (e.g. Vercel Cron, QStash) to call these:

| Endpoint | Frequency | Purpose |
|----------|-----------|---------|
| `/api/cron/poll-tensor` | Every 2 min | Fetch trending collection stats |
| `/api/cron/aggregate` | Every 2 min | Aggregate sale data into snapshots |
| `/api/cron/detect` | Every 1 min | Run spike detection + send alerts |

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
