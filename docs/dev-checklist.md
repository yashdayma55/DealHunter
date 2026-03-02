# Developer Onboarding Checklist

Use this checklist to set up and validate a local environment quickly.

---

## 1) Prerequisites

- Node.js installed (latest LTS recommended).
- A Supabase project with the required tables.
- Telegram API credentials if you want Telegram scraping.

---

## 2) Backend Setup (deals-engine)

1. Create `.env` in `deals-engine` with:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE`
   - `TELEGRAM_API_ID`
   - `TELEGRAM_API_HASH`
   - `TELEGRAM_SESSION`
2. Install dependencies:
   - `npm install`
3. Build:
   - `npm run build`
4. Run the scheduler:
   - `npm run scheduler`

Validation:
- You should see logs indicating imported deals for each subreddit/channel.
- Supabase `deals` table should receive new rows.

---

## 3) Frontend Setup (deals-frontend)

1. Create `.env.local` in `deals-frontend` with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm run dev`
4. Open the app:
   - http://127.0.0.1:5173

Validation:
- Deals should appear.
- Filters should update results.

---

## 4) Common Issues

- "Missing Supabase env vars":
  - confirm `.env` and `.env.local` values exist
- Telegram scraper hangs:
  - verify `TELEGRAM_SESSION` is valid
- No deals appear:
  - check Supabase read policies
  - confirm the backend is inserting rows

