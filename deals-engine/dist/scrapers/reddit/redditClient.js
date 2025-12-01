import axios from "axios";
const BASE_URL = "https://www.reddit.com";
export const redditClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        "User-Agent": "GMU-DealsEngine/1.0 (by: storyyell2)",
    },
});
export async function fetchRedditPosts(subreddit, limit = 20) {
    const url = `/r/${subreddit}/new.json?limit=${limit}`;
    const res = await redditClient.get(url);
    return res.data.data.children.map((post) => post.data);
}
