// src/scheduler/scheduler.ts
import cron from "node-cron";
import "dotenv/config";

import { importRedditDeals } from "../scrapers/reddit/redditToSupabase.js";
import { importTelegramDeals } from "../scrapers/telegram/telegramToSupabase.js";

const SUBREDDITS = [
  "googleplaydeals",
  "androidapps",
  "AppHookup",
  "GameDeals",
  "Freebies",
];

const TELEGRAM_CHANNELS = [
  "@PLAYSTOREDEAL",
  "@iosappdeals",
];


async function runOnce() {
  console.log("🚀 Scheduler tick: starting import batch");

  // 🔹 Reddit sources
  for (const sub of SUBREDDITS) {
    try {
      const count = await importRedditDeals(sub);
      console.log(`✅ Reddit ${sub}: inserted ${count} deals`);
    } catch (err) {
      console.error(`❌ Error importing Reddit ${sub}`, err);
    }
  }

  // 🔹 Telegram sources
  for (const channel of TELEGRAM_CHANNELS) {
    try {
      const count = await importTelegramDeals(channel);
      console.log(`✅ Telegram ${channel}: inserted ${count} deals`);
    } catch (err) {
      console.error(`❌ Error importing Telegram ${channel}`, err);
    }
  }

  console.log("✅ Scheduler batch finished\n");
}

// ▶ Run once on startup
runOnce();

// ⏰ Run every 15 minutes
cron.schedule("*/15 * * * *", async () => {
  await runOnce();
});
