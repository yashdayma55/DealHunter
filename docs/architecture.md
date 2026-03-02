# DealHunter Architecture

This document is a deep, implementation-focused description of how the
DealHunter system works across backend, database, and frontend.

---

## 1) System Overview

DealHunter is a two-part system:

1. **deals-engine**: a Node/TypeScript batch importer that scrapes deals from
   Reddit and Telegram and writes normalized rows into Supabase.
2. **deals-frontend**: a Next.js UI that reads the latest deals from Supabase
   and renders filters, sorting, and cards.

Supabase is the single shared contract. The backend writes, the frontend reads.

---

## 2) Component Diagram (Text)

```
                 +-------------------+
                 |  Reddit API       |
                 +---------+---------+
                           |
                           v
                 +-------------------+
                 |  Reddit Scraper   |
                 +---------+---------+
                           |
                           v
                 +-------------------+
                 |  Deal Normalizer  |
                 +---------+---------+
                           |
                           v
                 +-------------------+
                 | Supabase (DB)     |
                 +---------+---------+
                           ^
                           |
                 +-------------------+
                 | Telegram Scraper |
                 +---------+---------+
                           ^
                           |
                 +-------------------+
                 | Telegram Client   |
                 +-------------------+

                 +-------------------+
                 | Next.js Frontend  |
                 +-------------------+
                           |
                           v
                 +-------------------+
                 | Supabase (DB)     |
                 +-------------------+
```

---

## 3) Backend Flow (deals-engine)

### 3.1 Entry Points

- `src/index.ts` imports and initializes the scheduler.
- `src/scheduler/scheduler.ts`:
  - runs a batch once at startup
  - runs a batch every 15 minutes via `node-cron`

### 3.2 Scheduler Sequence

```
runOnce()
  -> importRedditDeals(subreddit1..n)
  -> importTelegramDeals(channel1..n)
```

Each importer does:
1. Scrape source
2. Validate and normalize
3. Resolve foreign keys (data source, channel, package, category, platform)
4. Enrich metadata (if applicable)
5. Upsert into Supabase

### 3.3 Reddit Importer Pipeline

Files:
- `scrapers/reddit/redditScraper.ts`
- `scrapers/reddit/redditMapper.ts`
- `scrapers/reddit/redditToSupabase.ts`

Flow:
1. Fetch posts via the Reddit client.
2. For each post:
   - filter spam or non-deals (`isValidDeal`)
   - parse title for price/discount info
   - extract URL from selftext if needed
   - infer Android/iOS package id
3. Validate that the deal represents a real discount or free offer.
4. Resolve references:
   - data source (reddit)
   - channel (subreddit)
   - package + category + platform
5. Enrich:
   - if package id looks like a real Play Store package, fetch metadata
6. Upsert into `deals`

### 3.4 Telegram Importer Pipeline

Files:
- `scrapers/telegram/telegramScraper.ts`
- `scrapers/telegram/telegramToSupabase.ts`

Flow:
1. Connect to Telegram via session string.
2. Iterate recent messages.
3. Extract:
   - title (first line)
   - URL (text link or hidden entity)
4. Reject messages:
   - without URLs
   - not in allowed store domains
   - spam / instructions / non-deals
5. Infer pricing:
   - detect "free" and 100% off
   - detect price transitions like "19.99 -> 0.99"
6. Resolve references (data source, channel, package, platform).
7. Upsert into `deals` using URL as conflict key.

---

## 4) Validation and Parsing

### 4.1 Deal Validation (`utils/isValidDeal.ts`)

The validator is conservative and favors dropping questionable content:
- blocks questions and discussions
- blocks common spam keywords
- requires a "deal signal" (free, %, currency symbols, etc)
- rejects titles that look like simple version release posts
- rejects RTL/non-English content to reduce spam

### 4.2 Price Extraction (`utils/extractDealInfo.ts`)

Parses titles for:
- price_before, price_after
- discount_type, discount_value
- currency (USD/EUR/GBP/INR)

---

## 5) Database Access Layer

File: `services/db.ts`

Responsibilities:
- ensure existence of `data_sources`, `channels`, `categories`, `platforms`
- ensure existence of `packages`
- provide stable foreign keys for `deals`

This design keeps the import pipeline idempotent and consistent.

---

## 6) Frontend Flow (deals-frontend)

### 6.1 Entry

File: `app/page.tsx`

Flow:
1. On mount, query the `deals` table with related `channels` and `data_sources`.
2. Compute aggregate stats:
   - total deals
   - per-source counts
   - hot deals (score >= 50)
   - free deals (price_after == 0)
3. Apply filters:
   - text search
   - source filter
   - quick filters: hot/free/expiring
4. Apply sorting:
   - newest, hottest, biggest discount
5. Render `DealCard` per deal.

### 6.2 UI Components

- `components/DealCard.tsx`:
  - renders prices and discount label
  - applies a final safety filter against obvious non-deal content
  - provides CTA link to deal URL

- `components/DealSkeleton.tsx`:
  - renders a placeholder grid during data load

---

## 7) Runtime Configuration

Backend environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`
- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `TELEGRAM_SESSION`

Frontend environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 8) Operational Notes

- The backend cron is the heartbeat of the system.
- A failure in scraping affects freshness, not frontend availability.
- Frontend is read-only and can scale independently from the scraper.
- Supabase row-level security policies must allow frontend read access
  to the `deals` table (or a view).

