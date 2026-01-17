// src/testScraper.ts
import { scrapeRedditDeals } from "./scrapers/reddit/redditScraper.js"; 

async function testReddit() {
  try {
    console.log("🚀 Testing Reddit scraper...\n");

    const subreddit = "googleplaydeals";
    const deals = await scrapeRedditDeals(subreddit);

    console.log(`✅ Fetched ${deals.length} deals from r/${subreddit}\n`);

    // Added ': any' and ': number' to fix the implicit type errors
    deals.slice(0, 5).forEach((deal: any, i: number) => {
      console.log(`--- Deal ${i + 1} ---`);
      console.log("Title:", deal.title);
      console.log("Score:", deal.score_at_scrape); 
      console.log("URL:", deal.url);
      console.log("Price:", deal.price_after);
      console.log("");
    });

  } catch (err) {
    console.error("❌ Reddit test failed");
    console.error(err);
  }
}

testReddit();