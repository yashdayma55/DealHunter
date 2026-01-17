import { scrapeTelegramChannel } from "./telegramScraper.js";
import {
  getOrCreateDataSource,
  getOrCreateChannel,
  getOrCreatePackage,
  getOrCreateCategory,
  getPlatformId,
} from "../../services/db.js";
import { extractPackageId } from "../../utils/extract.js";
import { supabase } from "../../supabaseClient.js";
import { TelegramDeal } from "./telegramTypes.js";
import { isValidDeal } from "../../utils/isValidDeal.js";

/* =========================================================
   HELPERS (KEEP ALL LOGIC)
========================================================= */

// ✅ Only allow real store URLs (NO instruction posts)
function isAllowedStoreUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  return (
    url.includes("store.steampowered.com") ||
    url.includes("epicgames.com") ||
    url.includes("play.google.com") ||
    url.includes("apps.apple.com")
  );
}

// ❌ Filter instructional / spam Telegram posts
function isSpamContent(text?: string | null): boolean {
  if (!text) return false;

  const badWords = [
    "how to",
    "instructions",
    "comment",
    "join",
    "discussion",
    "guide",
    "steps",
    "claim via",
    "transactions page",
    "see if you claimed",
    "check if you claimed",
  ];

  const lower = text.toLowerCase();
  return badWords.some(word => lower.includes(word));
}

// 💰 Infer pricing from title + description
function inferPricing(text?: string | null) {
  if (!text) {
    return {
      price_before: null,
      price_after: null,
      discount_type: null,
      discount_value: null,
    };
  }

  const lower = text.toLowerCase();

  let price_before: number | null = null;
  let price_after: number | null = null;
  let discount_type: string | null = null;
  let discount_value: number | null = null;

  // FREE / 100%
  if (lower.includes("free") || lower.includes("100%")) {
    price_after = 0;
    discount_type = "free";
    discount_value = 100;
  }

  // $19.99 → $0.99 | $19.99 to $0 | $19.99 - $4.99
  const match = lower.match(
    /\$?(\d+(\.\d+)?)\s*(→|->|to|-)\s*\$?(\d+(\.\d+)?)/i
  );

  if (match) {
    const before = Number(match[1]);
    const after = Number(match[4]);

    if (!Number.isNaN(before) && !Number.isNaN(after)) {
      price_before = before;
      price_after = after;

      if (after === 0) {
        discount_type = "free";
        discount_value = 100;
      } else {
        discount_type = "discount";
        discount_value = Math.round(
          ((before - after) / before) * 100
        );
      }
    }
  }

  // 90% off (fallback)
  if (discount_value === null) {
    const pct = lower.match(/(\d+)\s*%\s*off/);
    if (pct) {
      discount_type = "discount";
      discount_value = Number(pct[1]);
    }
  }

  return {
    price_before,
    price_after,
    discount_type,
    discount_value,
  };
}

/* =========================================================
   MAIN IMPORTER (DO NOT REMOVE ANYTHING)
========================================================= */

export async function importTelegramDeals(channelName: string) {
  console.log(`\n📥 Importing Telegram deals from ${channelName}...`);

  // 1️⃣ Scrape Telegram
  const deals: TelegramDeal[] = await scrapeTelegramChannel(channelName);

  // 2️⃣ Data source + channel
  const dataSourceId = await getOrCreateDataSource(
    "telegram",
    "https://telegram.org"
  );

  const channelId = await getOrCreateChannel(
    dataSourceId,
    channelName,
    `https://t.me/${channelName}`
  );

  let insertedCount = 0;

  for (const deal of deals) {
    const combinedText = `${deal.title ?? ""} ${deal.description ?? ""}`.trim();

    // ❌ Invalid / foreign language / spam
    if (!isValidDeal(deal.title, deal.description)) continue;
    if (isSpamContent(combinedText)) continue;

    // ❌ URL guard
    if (!isAllowedStoreUrl(deal.url)) continue;
    const url: string = deal.url!.trim();

    // 📦 Package ID
    const extractedPkg = extractPackageId(url);
    const effectivePkg =
      extractedPkg ??
      `telegram-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 🖥 Platform detection (TS-safe)
    const platformId =
      url.includes("play.google.com")
        ? await getPlatformId("android")
        : url.includes("apps.apple.com")
        ? await getPlatformId("ios")
        : await getPlatformId("web"); // Steam / Epic / PC

    // 🗂 Category
    const fallbackCategoryId = await getOrCreateCategory("games");

    // 📦 Package
    const packageId = await getOrCreatePackage(
      effectivePkg,
      deal.title,
      fallbackCategoryId,
      platformId,
      url
    );

    // 💰 Pricing
    const pricing = inferPricing(combinedText);

    // 🧼 Final deal row
    const cleanDeal = {
      title: deal.title,
      description: deal.description ?? null,

      price_before: pricing.price_before,
      price_after: pricing.price_after,
      currency: pricing.price_after !== null ? "USD" : null,

      discount_type: pricing.discount_type,
      discount_value: pricing.discount_value,

      url,
      referral_code: null,

      score_at_scrape: 0,
      posted_utc: deal.posted_utc,
      expiry_date: null,

      data_source_id: dataSourceId,
      channel_id: channelId,
      package_id: packageId,
    };

    const { error } = await supabase.from("deals").upsert(cleanDeal, {
      onConflict: "url",
    });

    if (!error) insertedCount++;
    else console.error("Telegram deal INSERT failed:", error.message);
  }

  return insertedCount;
}
