// src/scrapers/reddit/redditToSupabase.ts
import { scrapeRedditDeals } from "./redditScraper.js"; // This returns CLEAN deals now
import {
  getOrCreateDataSource,
  getOrCreateChannel,
  getOrCreatePackage,
  getOrCreateCategory,
  getPlatformId,
  updatePackageMetadata,
} from "../../services/db.js";
import { fetchPlayStoreMetadata } from "../../services/playstore.js";
import { supabase } from "../../supabaseClient.js";

// ✅ FINAL DEAL VALIDATION
function isVerifiedDeal(deal: any) {
  if (deal.price_after === 0) return true;

  if (
    deal.price_before !== null &&
    deal.price_after !== null &&
    deal.price_before > deal.price_after
  ) {
    return true;
  }

  if (deal.discount_value && deal.discount_value > 0) return true;

  return false;
}

export async function importRedditDeals(subreddit: string) {
  console.log(`\n📥 Importing deals from r/${subreddit}...`);

  // 1. Get Clean Deals directly (No need to map again!)
  const deals = await scrapeRedditDeals(subreddit);

  const dataSourceId = await getOrCreateDataSource(
    "reddit",
    "https://reddit.com"
  );

  const channelId = await getOrCreateChannel(
    dataSourceId,
    `r/${subreddit}`,
    `/r/${subreddit}/new`
  );

  let insertedCount = 0;

  for (const deal of deals) {
    // 🚫 HARD FILTER: no real price/discount
    if (!isVerifiedDeal(deal)) continue;

    // Use the package_uid already found by the scraper, or fallback to a manual ID
    const effectivePkg = deal.package_uid || `manual-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const platformId = await getPlatformId("android");
    const fallbackCategoryId = await getOrCreateCategory("misc");

    // Create or Get Package
    const packageId = await getOrCreatePackage(
      effectivePkg,
      deal.title,
      fallbackCategoryId,
      platformId,
      deal.url || ""
    );

    // Fetch Metadata if it looks like a real package ID (contains dots usually)
    if (effectivePkg.includes(".")) {
        const metadata = await fetchPlayStoreMetadata(effectivePkg);
        if (metadata) {
            await updatePackageMetadata(packageId, metadata);
            if (metadata.category) {
                const autoCategoryId = await getOrCreateCategory(metadata.category);
                await supabase
                .from("packages")
                .update({ category_id: autoCategoryId })
                .eq("id", packageId);
            }
        }
    }

    const cleanDeal = {
      title: deal.title,
      description: deal.description,
      price_before: deal.price_before,
      price_after: deal.price_after,
      currency: deal.currency,
      discount_type: deal.discount_type,
      discount_value: deal.discount_value,
      url: deal.url,
      referral_code: deal.referral_code,
      score_at_scrape: deal.score_at_scrape,
      posted_utc: deal.posted_utc,
      expiry_date: deal.expiry_date,
      data_source_id: dataSourceId,
      channel_id: channelId,
      package_id: packageId,
    };

    const { error } = await supabase.from("deals").upsert(cleanDeal, {
      onConflict: "channel_id,package_id,data_source_id,posted_utc",
    });

    if (!error) insertedCount++;
    else console.error("Deal INSERT failed:", error.message);
  }

  return insertedCount;
}