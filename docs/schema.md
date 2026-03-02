# DealHunter Database Schema (Supabase)

This document describes the actual Supabase schema used by DealHunter.

- The backend (`deals-engine`) writes to these tables.
- The frontend (`deals-frontend`) reads from these tables.
- Supabase (Postgres) acts as the contract layer between both systems.

---

# Core Tables

## 1. data_sources

Represents the origin system of a deal (e.g., Reddit, Telegram).

| Column      | Type    | Description |
|------------|---------|------------|
| id         | int4 (PK) | Primary key |
| name       | varchar | Source name (reddit, telegram) |
| base_url   | text    | Base URL of the source |
| is_active  | boolean | Whether ingestion is enabled |

---

## 2. channels

Represents a subreddit or Telegram channel.

| Column           | Type    | Description |
|-----------------|---------|------------|
| id              | int4 (PK) | Primary key |
| data_source_id  | int4 (FK → data_sources.id) | Source reference |
| channel_name    | varchar | Internal channel identifier |
| display_name    | varchar | UI-friendly name |
| description     | text    | Channel description |
| benchmark_score | numeric | Optional ranking metric |

---

## 3. categories

Represents content categories (e.g., Games, Apps).

| Column | Type | Description |
|--------|------|------------|
| id     | int4 (PK) | Primary key |
| name   | varchar | Category name |

---

## 4. platforms

Represents store platform metadata (Android, iOS, Web).

| Column       | Type    | Description |
|-------------|---------|------------|
| id          | int4 (PK) | Primary key |
| name        | varchar | Platform name |
| description | text    | Platform description |
| rating      | numeric | Store rating |
| category_id | int4 (FK → categories.id) | Category reference |
| platform_id | int4 (nullable) | Optional self-reference |
| store_url   | text    | Store URL |
| scraped_json| jsonb   | Raw metadata |
| created_at  | timestamp | Created timestamp |
| updated_at  | timestamp | Updated timestamp |
| icon_url    | text    | App icon |
| installs    | text    | Install count |

---

## 5. deals

Core deal records ingested by the backend.

| Column          | Type      | Description |
|-----------------|-----------|------------|
| id              | int4 (PK) | Primary key |
| title           | varchar   | Deal title |
| description     | text      | Deal description |
| price_before    | numeric   | Original price |
| price_after     | numeric   | Discounted price |
| currency        | varchar   | Currency code |
| discount_type   | varchar   | percentage / amount |
| discount_value  | numeric   | Discount value |
| url             | text      | External link |
| referral_code   | varchar   | Optional referral |
| score_at_scrape | int4      | Reddit score at scrape time |
| posted_utc      | timestamp | Original post time |
| expiry_date     | timestamp | Optional expiry |
| created_at      | timestamp | Record creation |
| updated_at      | timestamp | Last update |
| channel_id      | int4 (FK → channels.id) |
| data_source_id  | int4 (FK → data_sources.id) |
| package_id      | int4 (FK → platforms.id) |
| metadata        | jsonb     | Additional structured data |

---

## 6. deal_votes

User voting records.

| Column    | Type | Description |
|-----------|------|------------|
| id        | int4 (PK) | Primary key |
| deal_id   | int4 (FK → deals.id) |
| vote_type | varchar | upvote / downvote |
| created_at| timestamp | Vote timestamp |

---

## 7. deal_comments

User comments on deals.

| Column       | Type | Description |
|--------------|------|------------|
| id           | int4 (PK) | Primary key |
| deal_id      | int4 (FK → deals.id) |
| comment_text | text | Comment body |
| created_at   | timestamp | Comment timestamp |

---

## 8. fetch_logs

Tracks scraper execution health.

| Column          | Type | Description |
|-----------------|------|------------|
| id              | int4 (PK) |
| channel_id      | int4 (FK → channels.id) |
| run_started_at  | timestamp |
| run_finished_at | timestamp |
| status          | varchar (success / failed) |

Used for observability and debugging failed ingestion runs.

---

# Relationships Overview

```
data_sources (1) ───< channels (many)
channels (1) ───< deals (many)
data_sources (1) ───< deals (many)
platforms (1) ───< deals (many)
categories (1) ───< platforms (many)
deals (1) ───< deal_votes (many)
deals (1) ───< deal_comments (many)
channels (1) ───< fetch_logs (many)
```

---

# Design Notes

- Supabase is the system of record.
- Backend writes using service role key.
- Frontend reads using anon key with RLS.
- Deals ingestion uses idempotent upsert strategy.
- JSONB fields allow flexible enrichment.
