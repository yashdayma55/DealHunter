// components/DealCard.tsx
"use client";

import { ExternalLink, Flame, Clock } from "lucide-react";
import type { Deal } from "@/src/types/deal";

type Props = { deal: Deal };

function formatPrice(price: number | null | undefined, currency?: string | null) {
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

function getSourceLabel(deal: Deal) {
  const src = (deal.source?.name ?? "").toLowerCase();
  const ch = (deal.channel?.channel_name ?? "").toLowerCase();

  if (src.includes("telegram") || ch.startsWith("@")) return "Telegram";
  return "Reddit";
}

export const DealCard: React.FC<Props> = ({ deal }) => {
  const heat = deal.score_at_scrape ?? 0;
  const before = deal.price_before;
  const after = deal.price_after;

  const isFree = after === 0;
  const isHot = heat >= 50;
  const isSuperHot = heat >= 100;

  const sourceLabel = getSourceLabel(deal);
  const channelName = deal.channel?.channel_name ?? null;

  let discountLabel = "";
  if (isFree) {
    discountLabel = "🔥 Free — 100% off";
  } else if (before != null && after != null && before > after) {
    const diff = before - after;
    const pct = Math.round((diff / before) * 100);
    discountLabel = `Save ${pct}% (${formatPrice(diff, deal.currency)})`;
  }

  const ctaHref = deal.url ?? "#";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-black p-[1px] hover:border-pink-500/60 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] transition">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20 opacity-0 blur-2xl group-hover:opacity-100" />

      <div className="relative flex h-full flex-col rounded-2xl bg-gradient-to-b from-zinc-950 via-zinc-900 to-black p-4">
        {/* Top row */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-sm font-semibold text-white">
            {deal.title}
          </h2>

          <div className="flex items-center gap-2">
            {/* Source badge */}
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300">
              {sourceLabel}
              {channelName ? ` • ${channelName}` : ""}
            </span>

            {/* Heat badge */}
            <div className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] border border-zinc-700 bg-zinc-900 text-zinc-300">
              <Flame
                className={`h-3 w-3 ${
                  isSuperHot ? "text-red-400" : isHot ? "text-orange-400" : "text-zinc-500"
                }`}
              />
              <span>{heat}</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mb-2 flex items-baseline gap-2">
          {after != null ? (
            <>
              <span className="text-lg font-semibold text-white">
                {isFree ? "FREE" : formatPrice(after, deal.currency)}
              </span>

              {before != null && before > after && (
                <span className="text-xs text-zinc-500 line-through">
                  {formatPrice(before, deal.currency)}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-zinc-400">Price not provided</span>
          )}
        </div>

        {/* Discount label */}
        {discountLabel && (
          <p className="mb-3 text-xs text-pink-200">{discountLabel}</p>
        )}

        {/* Meta */}
        <div className="mb-4 flex items-center gap-3 text-[11px] text-zinc-500">
          <div className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDate(deal.posted_utc)}</span>
          </div>

          {deal.expiry_date && (
            <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-orange-200">
              Expires {formatDate(deal.expiry_date)}
            </span>
          )}
        </div>

        {/* Description */}
        {deal.description && (
          <p className="mb-4 line-clamp-2 text-xs text-zinc-400">
            {deal.description}
          </p>
        )}

        {/* CTA */}
        <a
          href={ctaHref}
          target="_blank"
          rel="noreferrer"
          className="mt-auto flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110"
        >
          View deal <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
};
