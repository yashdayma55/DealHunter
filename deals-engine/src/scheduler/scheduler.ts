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
  "iosapps",
];

const TELEGRAM_CHANNELS = [
  "@PLAYSTOREDEAL",
  "@iosappdeals",
  "@freegames",
  "@FreeGamesNews",
];

async function runOnce() {
  console.log("\n🚀 Scheduler tick: Starting batch import...");

  // ---------------------------------------------
  // 1. REDDIT SCRAPER
  // ---------------------------------------------
  console.log("🔹 [1/2] Starting Reddit Import...");
  for (const sub of SUBREDDITS) {
    try {
      const count = await importRedditDeals(sub);
      console.log(`   ✅ r/${sub}: ${count} deals inserted`);
    } catch (err: any) {
      // Fixed the typo here: || instead of ||ux
      console.error(`   ❌ r/${sub} Failed:`, err.message || err);
    }
  }

  // ---------------------------------------------
  // 2. TELEGRAM SCRAPER
  // ---------------------------------------------
  console.log("🔹 [2/2] Starting Telegram Import...");
  
  if (!process.env.TELEGRAM_SESSION) {
    console.warn("   ⚠️ WARNING: TELEGRAM_SESSION is missing in .env. Telegram scraper may hang or fail.");
  }

  for (const channel of TELEGRAM_CHANNELS) {
    try {
      const count = await importTelegramDeals(channel);
      console.log(`   ✅ ${channel}: ${count} deals inserted`);
    } catch (err: any) {
      console.error(`   ❌ ${channel} Failed:`, err.message || err);
    }
  }

  console.log("🎉 Scheduler batch finished.\n");
}

// ▶ Run once on startup
runOnce();

// ⏰ Run every 15 minutes
cron.schedule("*/15 * * * *", async () => {
  await runOnce();
});