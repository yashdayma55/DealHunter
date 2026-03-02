# DealHunter Database Schema (Supabase)

This document describes the Supabase schema used by DealHunter. The backend writes to these tables; the frontend reads from them.

---

## 1) Tables and columns

### 1.1 users

User accounts and roles.

| Column      | Type        | Description                    |
|------------|-------------|--------------------------------|
| email      | varchar     | User email (likely primary key)|
| role       | varchar     | User role or permission level  |
| created_at | timestamp   | Record creation time           |

### 1.2 data_sources

Origin systems (e.g. Reddit, Telegram).

| Column    | Type    | Description                          |
|-----------|---------|--------------------------------------|
| id        | int4    | Primary key                          |
| name      | varchar | Name (e.g. "Website Scraper", "API") |
| base_url  | text    | Base URL for the source              |
| is_active | boolean | Whether the source is active         |

### 1.3 channels

Subreddits or Telegram channels.

| Column        | Type    | Description                    |
|---------------|---------|--------------------------------|
| id            | int4    | Primary key                    |
| data_source_id| int4    | FK → data_sources.id           |
| channel_name  | varchar | Internal channel name          |
| display_name  | varchar | User-facing name               |
| description   | text    | Channel description            |
| benchmark_score | numeric | Optional benchmark metric    |

### 1.4 categories

Categories or genres (e.g. Games, Apps).

| Column | Type    | Description  |
|--------|---------|--------------|
| id     | int4    | Primary key  |
| name   | varchar | Category name|

### 1.5 platforms

App platforms and metadata (store URLs, icons, ratings).

| Column      | Type      | Description                    |
|-------------|-----------|--------------------------------|
| id          | int4      | Primary key                    |
| name        | varchar   | Platform name                  |
| description | text      | Platform description           |
| rating      | numeric   | Rating                         |
| category_id | int4      | FK → categories.id             |
| platform_id | int4      | Optional self/platform reference|
| store_url   | text      | Store URL                      |
| scraped_json| jsonb     | Raw scraped data               |
| created_at  | timestamp | Creation time                  |
| updated_at  | timestamp | Last update time               |
| icon_url    | text      | Icon URL                       |
| installs    | text      | Install count (e.g. for apps)  |

### 1.6 deals

Core deal records.

| Column          | Type      | Description                       |
|-----------------|-----------|-----------------------------------|
| id              | int4      | Primary key                       |
| title           | varchar   | Deal title                        |
| description     | text      | Deal description                  |
| price_before    | numeric   | Original price                    |
| price_after     | numeric   | Discounted price                  |
| currency        | varchar   | Currency code (USD, EUR, etc.)    |
| discount_type   | varchar   | e.g. percentage, amount           |
| discount_value  | numeric   | Discount value                    |
| url             | text      | Link to the deal                  |
| referral_code   | varchar   | Optional referral code            |
| score_at_scrape | int4      | Score at scrape time (e.g. Reddit)|
| posted_utc      | timestamp | When the deal was originally posted|
| expiry_date     | timestamp | Optional expiry                   |
| created_at      | timestamp | Record creation                   |
| updated_at      | timestamp | Last update                       |
| channel_id      | int4      | FK → channels.id                  |
| data_source_id  | int4      | FK → data_sources.id              |
| package_id      | int4      | FK → platforms.id (app/product)   |
| metadata        | jsonb     | Extra deal-specific data          |

### 1.7 deal_votes

User votes on deals.

| Column    | Type      | Description          |
|-----------|-----------|----------------------|
| id        | int4      | Primary key          |
| deal_id   | int4      | FK → deals.id        |
| vote_type | varchar   | e.g. upvote, downvote|
| created_at| timestamp | Vote time            |

### 1.8 deal_comments

User comments on deals.

| Column       | Type      | Description      |
|--------------|-----------|------------------|
| id           | int4      | Primary key      |
| deal_id      | int4      | FK → deals.id    |
| comment_text | text      | Comment content  |
| created_at   | timestamp | Comment time     |

### 1.9 fetch_logs

Logs for scraper runs.

| Column         | Type      | Description                |
|----------------|-----------|----------------------------|
| id             | int4      | Primary key                |
| channel_id     | int4      | FK → channels.id           |
| run_started_at | timestamp | When the fetch started     |
| run_finished_at| timestamp | When the fetch completed   |
| status         | varchar   | e.g. success, failed       |

---

## 2) Relationships

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

---

## 3) Notes

- The frontend expects `deals` with joins to `channels` and `data_sources` for labels.
- `deal_votes` and `deal_comments` support future user interaction features.
- `fetch_logs` can be used for monitoring scraper health and run history.
