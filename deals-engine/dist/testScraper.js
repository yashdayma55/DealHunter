import { scrapeRedditDeals } from "./scrapers/reddit/redditScraper";
async function run() {
    const posts = await scrapeRedditDeals("googleplaydeals");
    console.log(posts);
}
run();
