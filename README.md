# DealHunter

DealHunter is a two-part system:
1) a backend "engine" that scrapes deals from Reddit and Telegram, enriches them, and stores them in Supabase, and
2) a Next.js frontend that reads those deals from Supabase and renders a searchable, filterable UI.

This README explains the architecture, data flow, and how to run each part locally.

---

## Architecture at a glance

High-level flow:

```
Reddit + Telegram
        |
        v
deals-engine (Node/TS)
  - scheduler (every 15 min + on startup)
  - scrapers + validators
  - package detection + metadata enrichment
  - upsert into Supabase
        |
        v
Supabase (Postgres)
        |
        v
deals-frontend (Next.js)
  - fetch deals
  - UI filters/sorting
  - render DealCards
```

Key characteristics:
- Backend runs as a scheduled batch importer.
- Frontend is read-only (uses anon key).
- Database is the contract between both sides.

---

## Repository layout

```
deals-engine/         # Backend scraper + importer
deals-frontend/       # Next.js UI
vercel.json           # Vercel project config (frontend)
eslint.config.mjs     # Root lint config
```

Backend (`deals-engine`) highlights:
- `src/index.ts` -> imports the scheduler to run on start.
- `src/scheduler/scheduler.ts` -> cron schedule + batch orchestration.
- `src/scrapers/` -> Reddit + Telegram scraper logic.
- `src/services/` -> DB helpers + Play Store enrichment.
- `src/utils/` -> validation + parsing helpers.

Frontend (`deals-frontend`) highlights:
- `app/page.tsx` -> main page, data fetch, filtering, sorting, rendering.
- `app/layout.tsx` -> app shell + fonts.
- `components/` -> `DealCard` and `DealSkeleton`.
- `src/lib/supabaseClient.ts` -> Supabase client.
- `src/types/deal.ts` -> shared data shape.

---

## Backend architecture (deals-engine)

### 1) Scheduler
Entry points:
- `src/index.ts`
- `src/scheduler/scheduler.ts`

What it does:
- Runs `runOnce()` immediately on startup.
- Runs `runOnce()` every 15 minutes via `node-cron`.
- For each run:
  - Import Reddit deals from a list of subreddits.
  - Import Telegram deals from a list of channels.

### 2) Reddit pipeline
Primary files:
- `src/scrapers/reddit/redditScraper.ts`
- `src/scrapers/reddit/redditMapper.ts`
- `src/scrapers/reddit/redditToSupabase.ts`

Steps:
1. Fetch posts from a subreddit (`fetchRedditPosts`).
2. Map each post into a normalized deal object.
3. Drop posts that are not real deals.
4. Extract URL from body if the post is a self-post.
5. Extract package id (Android or iOS) from URL/body.
6. Validate deal again before insert (price/discount check).
7. Upsert the clean deal into Supabase.

Validation and parsing:
- `src/utils/isValidDeal.ts` filters spam/questions/non-deals.
- `src/utils/extractDealInfo.ts` parses price, discount, and title.

Metadata enrichment:
- If package id looks real (contains dots), fetch Play Store metadata.
- Store metadata back into `packages` table.
- Auto-assign category when Play Store data is present.
- See `src/services/playstore.ts` and `src/services/db.ts`.

### 3) Telegram pipeline
Primary files:
- `src/scrapers/telegram/telegramScraper.ts`
- `src/scrapers/telegram/telegramToSupabase.ts`

Steps:
1. Connect to Telegram via a stored session.
2. Iterate recent messages.
3. Extract title + URL (text links or hidden entities).
4. Reject posts without URLs.
5. Run validation + spam filters.
6. Infer pricing from text (free, percent off, or "X -> Y").
7. Upsert the clean deal into Supabase.

URL constraints:
- Only allows store URLs (Play Store, App Store, Steam, Epic).
- Filters instructional or non-deal content aggressively.

### 4) Database helpers
Primary file:
- `src/services/db.ts`

Responsibilities:
- Create or lookup data sources (reddit, telegram).
- Create or lookup channels (subreddit, telegram channel).
- Create or lookup categories and platforms.
- Create or lookup packages.

### 5) Supabase client
Primary file:
- `src/supabaseClient.ts`

Uses a Supabase service role key (server-only) to insert/update data.

---

## Frontend architecture (deals-frontend)

Primary file:
- `app/page.tsx`

Flow:
1. On page load, fetch the latest 1000 deals from Supabase.
2. Join related tables: `channels` and `data_sources`.
3. Compute stats (total, hot, free, per source).
4. Apply filters:
   - search
   - source (reddit or telegram)
   - quick filters (hot, free, expiring)
5. Apply sorting:
   - newest
   - hottest
   - biggest discount
6. Render cards for each deal.

UI components:
- `components/DealCard.tsx`
  - Renders prices, discount labels, and "View link" CTA.
  - Filters explicit non-deal content on the client for safety.
- `components/DealSkeleton.tsx`
  - Skeleton loader while data loads.

Supabase client:
- `src/lib/supabaseClient.ts` uses public (anon) keys.
- Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Supabase schema

The database schema used by DealHunter. The backend writes to these tables; the frontend reads from them.

### Tables and columns

| Table | Columns | Description |
|-------|---------|-------------|
| **`users`** | `email`, `role`, `created_at` | User accounts and roles |
| **`data_sources`** | `id`, `name`, `base_url`, `is_active` | Origin systems (e.g. Reddit, Telegram) |
| **`channels`** | `id`, `data_source_id`, `channel_name`, `display_name`, `description`, `benchmark_score` | Subreddits or Telegram channels |
| **`categories`** | `id`, `name` | Categories/genres (e.g. Games, Apps) |
| **`platforms`** | `id`, `name`, `description`, `rating`, `category_id`, `platform_id`, `store_url`, `scraped_json`, `created_at`, `updated_at`, `icon_url`, `installs` | App platforms and metadata |
| **`deals`** | `id`, `title`, `description`, `price_before`, `price_after`, `currency`, `discount_type`, `discount_value`, `url`, `referral_code`, `score_at_scrape`, `posted_utc`, `expiry_date`, `created_at`, `updated_at`, `channel_id`, `data_source_id`, `package_id`, `metadata` | Core deal records |
| **`deal_votes`** | `id`, `deal_id`, `vote_type`, `created_at` | User votes on deals |
| **`deal_comments`** | `id`, `deal_id`, `comment_text`, `created_at` | User comments on deals |
| **`fetch_logs`** | `id`, `channel_id`, `run_started_at`, `run_finished_at`, `status` | Logs for scraper runs |

### Relationships

```
data_sources (1) ───< (many) channels
      │                        │
      │                        └──< fetch_logs
      │
      └──< deals >─── deal_votes
      │       │            deal_comments
      │       │
      │       └── channel_id ──> channels
      │       └── data_source_id ──> data_sources
      │       └── package_id ──> platforms
      │
platforms ──> category_id ──> categories
```

### Key fields (deals)

- **Pricing**: `price_before`, `price_after`, `currency`, `discount_type`, `discount_value`
- **Content**: `title`, `description`, `url`, `referral_code`
- **Metadata**: `score_at_scrape`, `posted_utc`, `expiry_date`, `metadata` (JSONB)
- **Foreign keys**: `channel_id`, `data_source_id`, `package_id`

---

## Environment variables

Backend (`deals-engine`):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE` (server-only, do not expose in frontend)
- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `TELEGRAM_SESSION` (string session for Telegram client)

Frontend (`deals-frontend`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Running locally

### Backend

```
cd deals-engine
npm install
npm run build
npm run scheduler
```

Notes:
- The scheduler runs once immediately and then every 15 minutes.
- Make sure the Supabase service role key is configured.
- Telegram scraping requires a valid session string.

### Frontend

```
cd deals-frontend
npm install
npm run dev
```

Then open:
- http://127.0.0.1:5173

---

## Scripts

Backend scripts (`deals-engine/package.json`):
- `npm run build` -> compile TypeScript into `dist/`.
- `npm run scheduler` -> run the cron scheduler.
- `npm run backfill:packages` -> backfill package metadata.

Frontend scripts (`deals-frontend/package.json`):
- `npm run dev` -> start Next dev server on port 5173.
- `npm run build` -> production build.
- `npm run start` -> run production server on port 5173.

---

## Deployment

- Frontend is configured for Vercel via `vercel.json`.
- Backend is not configured for deployment in this repo; it can run on
  any Node environment or scheduler (VM, container, serverless cron).

---

## Troubleshooting

- "Missing Supabase env vars":
  - Check `.env` for backend and `.env.local` for frontend.
- Telegram scraper hangs:
  - Ensure `TELEGRAM_SESSION` is set and valid.
- No deals appear:
  - Check Supabase tables and row permissions.
  - Verify cron is running and inserts are successful.

---

## Security notes

- Never expose `SUPABASE_SERVICE_ROLE` to the frontend.
- Only use the anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the browser.

