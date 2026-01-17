"use client";

import { ExternalLink, Flame, Clock } from "lucide-react";
import type { Deal } from "@/src/types/deal";

/* =========================================================
   Helpers
========================================================= */

function formatPrice(
  price: number | null | undefined,
  currency?: string | null
) {
  if (price == null) return null;
  const curr = currency || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${price.toFixed(2)} ${curr}`;
  }
}

function formatDate(ts: string | Date | null | undefined) {
  if (!ts) return "Unknown";
  return new Date(ts).toLocaleDateString();
}

// Extract first URL from description (Telegram fallback)
function extractFirstUrl(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s)]+/i);
  return match ? match[0] : null;
}

// Final frontend safety filter (content ≠ deal)
function isClearlyNotADeal(title: string) {
  const bad = [
    "dlsite",
    "nsfw",
    "porn",
    "hentai",
    "adult",
    "sluts",
    "penis",
    "sex",
  ];
  const lower = title.toLowerCase();
  return bad.some(w => lower.includes(w));
}

// Normalize Supabase join (object | array)
function getSourceName(deal: Deal): string {
  const src: any = deal.source;
  if (Array.isArray(src)) return src[0]?.name ?? "";
  return src?.name ?? "";
}

type Props = { deal: Deal };

export const DealCard: React.FC<Props> = ({ deal }) => {
  const heat = deal.score_at_scrape ?? 0;
  const before = deal.price_before;
  const after = deal.price_after;

  const sourceName = getSourceName(deal);
  const isTelegram = sourceName === "telegram";

  // ❌ Block obvious non-deal content
  if (isTelegram && isClearlyNotADeal(deal.title)) {
    return null;
  }

  const isFree =
    after === 0 ||
    (isTelegram && before == null && deal.description?.toLowerCase().includes("free"));

  const isHot = heat >= 50;
  const isSuperHot = heat >= 100;

  // Detect real pricing vs link post
  const hasRealPrice = after != null || before != null;

  let discountLabel = "";
  if (isFree) {
    discountLabel = "FREE (Telegram Deal)";
  } else if (before != null && after != null && before > after) {
    const diff = before - after;
    const pct = Math.round((diff / before) * 100);
    discountLabel = `Save ${pct}% (${formatPrice(diff, deal.currency)})`;
  }

  // CTA URL logic
  const primaryUrl =
    deal.url && deal.url.trim() !== "" ? deal.url : null;
  const fallbackUrl = extractFirstUrl(deal.description);
  const ctaHref = primaryUrl || fallbackUrl;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-black p-[1px] transition hover:border-pink-500/60">
      <div className="relative flex h-full flex-col rounded-2xl bg-gradient-to-b from-zinc-950 via-zinc-900 to-black p-4">

        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-sm font-semibold text-white">
            {deal.title}
          </h2>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300">
              {isTelegram ? "Telegram" : "Reddit"}
            </span>

            {!isTelegram && (
              <div className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300">
                <Flame
                  className={`h-3 w-3 ${
                    isSuperHot
                      ? "text-red-400"
                      : isHot
                      ? "text-orange-400"
                      : "text-zinc-500"
                  }`}
                />
                <span>{heat}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="mb-2 flex items-baseline gap-2">
          {hasRealPrice ? (
            <>
              <span className="text-lg font-semibold text-white">
                {isFree ? "FREE" : formatPrice(after, deal.currency)}
              </span>

              {before != null && after != null && before > after && (
                <span className="text-xs text-zinc-500 line-through">
                  {formatPrice(before, deal.currency)}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-zinc-500">
              Link post (no price info)
            </span>
          )}
        </div>

        {discountLabel && (
          <p className="mb-3 text-xs text-pink-200">
            {discountLabel}
          </p>
        )}

        {/* Meta */}
        <div className="mb-4 flex items-center gap-3 text-[11px] text-zinc-500">
          <div className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(deal.posted_utc)}
          </div>
        </div>

        {/* Description */}
        {deal.description && (
          <p className="mb-4 line-clamp-2 text-xs text-zinc-400">
            {deal.description}
          </p>
        )}

        {/* CTA */}
        {ctaHref ? (
          <a
            href={ctaHref}
            target="_blank"
            rel="noreferrer"
            className="mt-auto flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
          >
            View link <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <button
            disabled
            className="mt-auto rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs text-zinc-500 cursor-not-allowed"
          >
            No link available
          </button>
        )}
      </div>
    </article>
  );
};
