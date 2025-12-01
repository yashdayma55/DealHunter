import { fetchRedditPosts } from "./redditClient.js";
export async function scrapeRedditDeals(subreddit) {
    console.log(`🔎 Fetching posts from r/${subreddit}`);
    const posts = await fetchRedditPosts(subreddit, 25);
    return posts.map((p) => ({
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
