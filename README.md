# NFT Pulse — Solana Volume Tracker

Real-time Solana NFT volume spike detection and alerts. Monitors all major marketplaces (Tensor, Magic Eden, etc.) for unusual trading activity using statistical anomaly detection.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   DATA INGESTION                     │
│                                                      │
│  Helius Webhooks ──► /api/webhooks/helius            │
│       (NFT sales)       │                            │
│                         ▼                            │
│                    PostgreSQL (Neon)                  │
│                    ┌──────────┐                      │
│                    │ nft_sales │                     │
│                    └────┬─────┘                      │
│                         │                            │
│  /api/cron/aggregate    ▼                            │
│  (every 2 min)    collection_snapshots               │
│                         │                            │
│  /api/cron/detect       ▼                            │
│  (every 1 min)    Z-Score Spike Detection            │
│                    │              │                   │
│                    ▼              ▼                   │
│              volume_spikes   Telegram Alerts          │
│                    │                                  │
│                    ▼                                  │
│              Dashboard UI (Next.js)                   │
│              ├── /          Trending table            │
│              ├── /alerts    Spike feed                │
│              └── /collection/:id  Detail + charts     │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** PostgreSQL via Neon Serverless + Drizzle ORM
- **Data Sources:** Helius (webhooks), Tensor (GraphQL)
- **Spike Detection:** Z-score algorithm with rolling 7-day baseline
- **Alerts:** Telegram bot (grammY)
- **Charts:** Recharts
- **Tables:** TanStack Table
- **Styling:** Tailwind CSS v4 (dark theme)

## Getting Started

```bash
cp .env.example .env.local
# Fill in your API keys

npm install
npx drizzle-kit push     # Create DB tables
npm run dev               # Start dev server
```

## Spike Detection

Uses Z-score anomaly detection with configurable thresholds:
- **Elevated** (z ≥ 2.0) — Above normal
- **Spike** (z ≥ 3.0) — Significant anomaly
- **Extreme** (z ≥ 5.0) — Major event

Minimum filters: 1 SOL volume + 5 sales to avoid noise from low-activity collections.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/webhooks/helius` | POST | Receive Helius NFT sale webhooks |
| `/api/cron/aggregate` | GET | Compute rolling window aggregations |
| `/api/cron/detect` | GET | Run spike detection |
| `/api/collections` | GET | Trending collections |
| `/api/collections/[id]` | GET | Collection detail + history |

## Telegram Bot Commands

- `/start` — Subscribe to alerts
- `/top` — Current top movers
- `/watchlist add/remove <collection>` — Manage watchlist
- `/threshold elevated|spike|extreme` — Set alert level
