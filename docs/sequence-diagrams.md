# Sequence Diagrams (Text)

These are text-based sequence diagrams describing runtime flows.

---

## 1) Reddit Import Flow

```
Scheduler        RedditScraper        RedditMapper        DB Helpers         Supabase
    |                  |                   |                  |                  |
    | runOnce()        |                   |                  |                  |
    |----------------->|                   |                  |                  |
    |  importRedditDeals(subreddit)        |                  |                  |
    |------------------------------------->|                  |                  |
    |                  | fetchRedditPosts  |                  |                  |
    |                  |----------------->|                  |                  |
    |                  |  posts[]          |                  |                  |
    |                  |<-----------------|                  |                  |
    |                  | mapRedditToDeal  |                  |                  |
    |                  |----------------->|                  |                  |
    |                  |     deal         |                  |                  |
    |                  |<-----------------|                  |                  |
    |                  | validate deal    |                  |                  |
    |                  |----------------->|                  |                  |
    |                  | resolve data source/channel/package |                  |
    |                  |------------------------------------>|                  |
    |                  |            ids                      |                  |
    |                  |<------------------------------------|                  |
    |                  | upsert deal                           -> insert/update |
    |                  |----------------------------------------------->        |
    |                  |                                      result             |
    |                  |<-----------------------------------------------        |
```

---

## 2) Telegram Import Flow

```
Scheduler        TelegramScraper        Filters/Parser      DB Helpers         Supabase
    |                  |                     |                  |                  |
    | runOnce()        |                     |                  |                  |
    |----------------->|                     |                  |                  |
    | importTelegramDeals(channel)           |                  |                  |
    |--------------------------------------->|                  |                  |
    |                  | connect session     |                  |                  |
    |                  |-------------------->|                  |                  |
    |                  | iter messages       |                  |                  |
    |                  |-------------------->|                  |                  |
    |                  | raw message         |                  |                  |
    |                  |<--------------------|                  |                  |
    |                  | extract title + URL |                  |                  |
    |                  |-------------------->|                  |                  |
    |                  | validate + spam     |                  |                  |
    |                  |-------------------->|                  |                  |
    |                  | infer pricing       |                  |                  |
    |                  |-------------------->|                  |                  |
    |                  | resolve references  |                  |                  |
    |                  |--------------------------------------->|                  |
    |                  |            ids                         |                  |
    |                  |<---------------------------------------|                  |
    |                  | upsert deal                           -> insert/update   |
    |                  |----------------------------------------------->          |
    |                  |                                      result               |
    |                  |<-----------------------------------------------          |
```

---

## 3) Frontend Page Load

```
Browser       Next.js Page        Supabase
   |              |                  |
   | load /       |                  |
   |------------->|                  |
   | useEffect()  |                  |
   |------------->| select deals     |
   |              |----------------->|
   |              | rows + joins     |
   |              |<-----------------|
   | render cards |                  |
   |<-------------|                  |
```

