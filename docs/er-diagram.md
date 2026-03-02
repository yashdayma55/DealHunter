# ER Diagram (Text)

This is a text-only entity-relationship diagram derived from the code usage.

```
data_sources (1) ───< (many) channels
      |                          |
      |                          |
      v                          v
    deals  >── (many) ─── packages
                         /   \
                        v     v
                   platforms  categories
```

---

## Entity Notes

### data_sources
- Represents the origin system (reddit, telegram).

### channels
- Represents subreddits or Telegram channels.
- Belongs to `data_sources`.

### deals
- Core dataset consumed by the frontend.
- Belongs to `data_sources`, `channels`, and `packages`.

### packages
- Represents an app or item package ID extracted from URLs.
- Belongs to `platforms` and `categories`.

### platforms
- android, ios, web.

### categories
- genres derived from store metadata or defaults.

