# DealHunter ER Diagram (Text)

```
data_sources
│
├──< channels
│ │
│ ├──< deals
│ │ ├──< deal_votes
│ │ └──< deal_comments
│ │
│ └──< fetch_logs
│
└──< deals

platforms
│
└──< deals

categories
│
└──< platforms
```

---

## Entity Summary

### data_sources
Origin systems (Reddit, Telegram).

### channels
Subreddits or Telegram channels. Belong to `data_sources`.

### deals
Core dataset powering the frontend. References `channels`, `data_sources`, and `platforms`.

### platforms
App/store metadata enriched from Play Store or other sources.

### categories
Logical grouping for platforms.

### deal_votes
User upvote/downvote records.

### deal_comments
User-generated comments.

### fetch_logs
Scraper execution logs for observability.
