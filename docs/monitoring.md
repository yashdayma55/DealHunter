# Monitoring and Production Hardening

This guide covers lightweight monitoring and operational safeguards.

---

## 1) Backend Health Signals

Recommended metrics:
- `last_successful_import` (timestamp)
- `deals_inserted_per_run`
- `import_duration_ms`
- `errors_per_run`

Simple approach:
- Log these metrics after each batch.
- If logs are shipped to a log service, create alerts on:
  - zero inserts for multiple runs
  - error count spikes

---

## 2) Failure Modes and Alerts

### 2.1 Reddit API issues
Symptoms:
- scraper returns 0 posts or errors

Alert:
- zero Reddit insertions across 2+ scheduled runs

### 2.2 Telegram session expired
Symptoms:
- Telegram client fails to connect or hangs

Alert:
- repeated connection errors
- zero Telegram insertions across 2+ runs

### 2.3 Supabase write failures
Symptoms:
- errors from `upsert` calls

Alert:
- error count > 0 for a batch

---

## 3) Rate Limits and Throttling

For stability:
- limit the number of posts fetched per subreddit
- run with a fixed schedule (already every 15 minutes)
- avoid parallelizing subreddits/channels too aggressively

---

## 4) Data Quality Checks

Add periodic checks:
- deal titles not empty
- URLs match expected domains
- price_before > price_after when discount exists

---

## 5) Optional Enhancements

If you want stronger monitoring:
- write a small “heartbeat” table in Supabase
- export counters to Prometheus
- add a Slack webhook on batch completion

