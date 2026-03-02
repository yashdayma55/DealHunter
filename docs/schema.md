# DealHunter Database Schema (Inferred)

This schema is inferred from the code usage. The actual tables live in
Supabase. Use this as a reference for how the backend and frontend expect
the database to behave.

---

## 1) Tables

### 1.1 deals

Core deal records written by the backend and read by the frontend.

Suggested fields (from code):
- `id` (pk, integer)
- `title` (text)
- `description` (text, nullable)
- `price_before` (numeric, nullable)
- `price_after` (numeric, nullable)
- `currency` (text, nullable)
- `discount_type` (text, nullable)
- `discount_value` (numeric, nullable)
- `url` (text, nullable)
- `referral_code` (text, nullable)
- `score_at_scrape` (integer, nullable)
- `posted_utc` (timestamptz, nullable)
- `expiry_date` (timestamptz, nullable)
- `data_source_id` (fk -> data_sources.id)
- `channel_id` (fk -> channels.id)
- `package_id` (fk -> packages.id)

Indexes implied by upsert usage:
- unique or composite index on:
  - reddit upsert: `(channel_id, package_id, data_source_id, posted_utc)`
  - telegram upsert: `(url)`

### 1.2 data_sources

Represents the origin system (reddit, telegram).

Fields:
- `id` (pk)
- `name` (unique)
- `base_url`

### 1.3 channels

Represents a source channel, such as a subreddit or telegram channel.

Fields:
- `id` (pk)
- `data_source_id` (fk -> data_sources.id)
- `channel_name`
- `base_route`

### 1.4 packages

Represents an app or product package extracted from a URL.

Fields:
- `id` (pk)
- `package_uid` (unique)
- `name`
- `category_id` (fk -> categories.id)
- `platform_id` (fk -> platforms.id)
- `store_url`
- `description` (nullable)
- `rating` (nullable)
- `installs` (nullable)
- `icon_url` (nullable)
- `scraped_json` (nullable)
- `updated_at` (timestamptz)

### 1.5 platforms

Represents the target platform (android, ios, web).

Fields:
- `id` (pk)
- `name` (unique)

### 1.6 categories

Represents a category or genre.

Fields:
- `id` (pk)
- `name` (unique)

---

## 2) Relationships (Logical)

```
data_sources 1---n channels
channels     1---n deals
packages     1---n deals
platforms    1---n packages
categories   1---n packages
```

---

## 3) Notes

- The frontend expects `deals` to include joinable `channels` and
  `data_sources` for UI labels.
- `packages` are enriched from Play Store data for Android apps only.
- Telegram deals that do not contain a Play Store URL still create a
  `packages` row with a generated package_uid.

