// src/scrapers/reddit/redditToSupabase.ts
import { scrapeRedditDeals } from "./redditScraper.js";
import { mapRedditToDeal } from "./redditMapper.js";

import {
  getOrCreateDataSource,
  getOrCreateChannel,
  getOrCreatePackage,
  getOrCreateCategory,
  getPlatformId,
  updatePackageMetadata,
} from "../../services/db.js";

import { extractPackageId } from "../../utils/extract.js";
import { fetchPlayStoreMetadata } from "../../services/playstore.js";

import { supabase } from "../../supabaseClient.js";

export async function importRedditDeals(subreddit: string) {
  const posts = await scrapeRedditDeals(subreddit);

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

  for (const post of posts) {
    const deal = mapRedditToDeal(post);

    // Extract package UID
    const pkgUid = extractPackageId(post.url);
    const effectivePkg = pkgUid ?? post.id;

    const platformId = await getPlatformId("android");
    const fallbackCategoryId = await getOrCreateCategory("misc");

    // Create package
    const packageId = await getOrCreatePackage(
      effectivePkg,
      post.title,
      fallbackCategoryId,
      platformId,
      post.url
    );

    // Fetch metadata
    const metadata = await fetchPlayStoreMetadata(effectivePkg);

    if (metadata) {
      await updatePackageMetadata(packageId, metadata);

      if (metadata.category) {
        const autoCategoryId = await getOrCreateCategory(metadata.category);

        await supabase.from("packages")
          .update({ category_id: autoCategoryId })
          .eq("id", packageId);
      }
    }

    // CLEAN DEAL PAYLOAD (only valid columns)
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

    const { error } = await supabase
      .from("deals")
      .upsert(cleanDeal, {
        onConflict:
          "channel_id,package_id,data_source_id,posted_utc",
      });

    if (!error) {
      insertedCount++;
    } else {
      console.error("Deal INSERT failed:", error);
    }
  }

  return insertedCount;
}
