import { importRedditDeals } from "./redditToSupabase.js";

(async () => {
  const inserted = await importRedditDeals("googleplaydeals");
  console.log(`Inserted ${inserted} deals into Supabase`);
})();
