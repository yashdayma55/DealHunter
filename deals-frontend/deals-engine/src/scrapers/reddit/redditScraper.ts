import { fetchRedditPosts } from "./redditClient.js";
import { RedditPost } from "./redditTypes.js";

export async function scrapeRedditDeals(
  subreddit: string
): Promise<RedditPost[]> {
  console.log(`🔎 Fetching posts from r/${subreddit}`);

  const posts: any[] = await fetchRedditPosts(subreddit, 25);

  return posts.map((p: any) => ({
    id: p.id,
    title: p.title,
    author: p.author,
    permalink: `https://reddit.com${p.permalink}`,
    url: p.url,
    created_utc: p.created_utc,
    ups: p.ups,
    num_comments: p.num_comments,
  }));
}
