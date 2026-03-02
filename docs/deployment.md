# Deployment Guide

This guide describes a practical, production-ready deployment strategy for
DealHunter. The frontend and backend can be deployed independently.

---

## 1) Frontend (Vercel)

The frontend is already configured for Vercel via `vercel.json`.

### Steps
1. Import the repo into Vercel.
2. Set the project root to `deals-frontend`.
3. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Build and deploy.

### Notes
- The frontend is read-only.
- Ensure Supabase row-level security policies allow read access to `deals`.

---

## 2) Backend (deals-engine)

The backend is a scheduled batch importer and can run on:
- a VM
- a container platform (Docker)
- a serverless scheduled job

### Requirements
- Node.js runtime
- a cron-capable scheduler or external trigger
- secure access to environment variables

### Environment variables
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`
- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `TELEGRAM_SESSION`

### Suggested approach (VM or Container)
1. Build the project:
   - `npm install`
   - `npm run build`
2. Run scheduler:
   - `npm run scheduler`
3. Monitor logs for failures in:
   - Reddit API access
   - Telegram session auth
   - Supabase insert errors

### Alternative approach (Serverless cron)
If using a platform like AWS, GCP, or Render:
- Deploy `deals-engine` as a service.
- Trigger `node dist/scheduler/scheduler.js` on a fixed schedule.

---

## 3) Supabase Configuration Notes

- Ensure the service role key is **never** exposed to the frontend.
- Restrict RLS policies so:
  - backend can insert/update
  - frontend can read

---

## 4) Health Checks / Monitoring

Recommended checks:
- A "last_imported_at" metric in a monitoring system.
- A simple log-based alert if no deals were inserted in a batch.
- Supabase row count trend checks over time.

