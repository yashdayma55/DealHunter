// src/scrapers/reddit/redditMapper.ts
import { RedditPost } from "./redditTypes.js";
import { isValidDeal } from "../../utils/isValidDeal.js";
import { extractDealInfo } from "../../utils/extractDealInfo.js";

function extractAndroidPackage(url: string): string | null {
  if (!url) return null;
  const match = url.match(/id=([a-zA-Z0-9._]+)/);
  return match ? match[1] : null;
}

function extractIosPackage(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/id(\d+)/);
  return match ? `ios-${match[1]}` : null;
}

// ✅ NEW: Helper to find links inside text body
function extractUrlFromText(text?: string): string | null {
  if (!text) return null;
  // Looks for http/https links, stops at space, bracket ] or parenthesis )
  const match = text.match(/(https?:\/\/[^\s\]\)]+)/);
  return match ? match[1] : null;
}

export function mapRedditToDeal(post: RedditPost) {
  // 1. Filter out trash
  if (!isValidDeal(post.title, post.selftext)) {
    return null;
  }

  const dealInfo = extractDealInfo(post.title);
  
  // 2. SMART URL EXTRACTION
  let url = post.url;
  
  // If the "url" is missing, or it is a link to Reddit itself, check the body text
  const isSelfPost = !url || url.includes("reddit.com") || url.startsWith("/r/");
  
  if (isSelfPost && post.selftext) {
     const bodyUrl = extractUrlFromText(post.selftext);
     if (bodyUrl) {
         url = bodyUrl;
     }
  }

  // 3. Extract Package ID
  let package_uid =
    extractAndroidPackage(url) ||
    extractIosPackage(url) ||
    (post.selftext
      ? extractAndroidPackage(post.selftext) ||
        extractIosPackage(post.selftext)
      : null);

  return {
    title: dealInfo.appName,
    description: post.selftext || null,
    price_before: dealInfo.priceBefore,
    price_after: dealInfo.priceAfter,
    currency: dealInfo.currency,
    discount_type: dealInfo.discountType,
    discount_value: dealInfo.discountValue,
    url: url, 
    referral_code: null,
    score_at_scrape: post.ups ?? 0,
    posted_utc: new Date(post.created_utc * 1000).toISOString(),
    expiry_date: null,
    package_uid,
  };
}