import { scrapeRedditDeals } from "./scrapers/reddit/redditScraper.js";



async function testReddit() {
  try {
    console.log("🚀 Testing Reddit scraper...\n");

    const subreddit = "googleplaydeals";
    const posts = await scrapeRedditDeals(subreddit);

    console.log(`✅ Fetched ${posts.length} posts from r/${subreddit}\n`);

    posts.slice(0, 5).forEach((post, i) => {
      console.log(`--- Post ${i + 1} ---`);
      console.log("Title:", post.title);
      console.log("Ups:", post.ups);
      console.log("URL:", post.permalink);
      console.log("");
    });

  } catch (err) {
    console.error("❌ Reddit test failed");
    console.error(err);
  }
}

testReddit();
