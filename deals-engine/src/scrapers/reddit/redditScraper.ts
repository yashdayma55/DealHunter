import { fetchRedditPosts } from "./redditClient.js";
import { RedditPost } from "./redditTypes.js";
import { mapRedditToDeal } from "./redditMapper.js";

/**
 * Scrape Reddit deals from a subreddit
 * ✅ Filters out non-deal posts
 * ✅ Returns only valid deal objects
 */
export async function scrapeRedditDeals(subreddit: string) {
  console.log(`🔎 Fetching posts from r/${subreddit}`);

  const posts: RedditPost[] = await fetchRedditPosts(subreddit, 25);

  const deals = [];

  for (const post of posts) {
    const deal = mapRedditToDeal(post);

    // 🚫 Skip non-deal posts (questions, discussions, etc.)
    if (!deal) continue;

    deals.push(deal);
  }

  return deals;
}
