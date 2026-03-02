# ER Diagram (Text)

Text-only entity-relationship diagram for the DealHunter Supabase schema.

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

users (optional; for future auth / votes / comments)
```

---

## Entity Notes

### data_sources
- Origin system (reddit, telegram).
- Has `is_active` flag.

### channels
- Subreddits or Telegram channels.
- Belongs to `data_sources`.
- Has `display_name`, `benchmark_score`.

### deals
- Core dataset read by the frontend.
- References `channels`, `data_sources`, and `platforms` (via `package_id`).
- Has `metadata` (JSONB) for extensibility.

### platforms
- App platforms with store metadata (store_url, icon_url, rating, installs).
- Belongs to `categories`.

### categories
- Genres (e.g. Games, Apps).

### deal_votes
- User votes on deals (upvote/downvote).
- References `deals`.

### deal_comments
- User comments on deals.
- References `deals`.

### fetch_logs
- Logs scraper runs per channel.
- References `channels`.
