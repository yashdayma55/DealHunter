// src/scheduler.ts
import cron from "node-cron";
import { importRedditDeals } from "../scrapers/reddit/redditToSupabase.js";
import "dotenv/config";
const SUBREDDITS = ["googleplaydeals", "androidapps", "AppHookup"]; // you can tweak this
async function runOnce() {
    console.log("🚀 Scheduler tick: starting Reddit import batch");
    for (const sub of SUBREDDITS) {
        try {
            const count = await importRedditDeals(sub);
            console.log(`✅ ${sub}: inserted ${count} deals`);
        }
        catch (err) {
            console.error(`❌ Error importing deals from ${sub}`, err);
        }
    }
    console.log("✅ Scheduler batch finished\n");
}
// Run immediately at startup
runOnce();
// Then every 15 minutes
cron.schedule("*/15 * * * *", () => {
    runOnce();
});
