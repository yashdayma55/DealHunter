// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import type { Deal } from "@/src/types/deal";
import { DealCard } from "@/components/DealCard";
import { DealSkeleton } from "@/components/DealSkeleton";
import { Search, Filter } from "lucide-react";

function getSourceName(d: Deal): string {
  return d.source?.[0]?.name?.toLowerCase() ?? "";
}

function getChannelName(d: Deal): string {
  return d.channel?.[0]?.channel_name?.toLowerCase() ?? "";
}


type SortOption = "newest" | "hottest" | "biggest-discount";
type QuickFilter = "all" | "hot" | "free" | "expiring";
type SourceFilter = "all" | "reddit" | "telegram";

export default function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  // ─────────────────────────────────────────────────────────────
  // Fetch deals from Supabase
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadDeals() {
      setLoading(true);
      setError(null);

      /**
       * IMPORTANT:
       * You insert 125 Reddit deals per run (5 subs × 25).
       * If we limit(120), Telegram deals will never appear.
       */
      const { data, error } = await supabase
        .from("deals")
        .select(
          `
          id,
          title,
          description,
          price_before,
          price_after,
          currency,
          discount_type,
          discount_value,
          url,
          referral_code,
          score_at_scrape,
          posted_utc,
          expiry_date,
          channel_id,
          data_source_id,
          channel:channels(channel_name),
          source:data_sources(name)
        `
        )
        .order("posted_utc", { ascending: false })
        .limit(400);

      if (error) {
        console.error("Error loading deals:", error);
        setError(error.message ?? "Unknown error");
      } else if (data) {
        setDeals(data as Deal[]);
      }

      setLoading(false);
    }

    loadDeals();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Derived stats
  // ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = deals.length;

    const hot = deals.filter((d) => (d.score_at_scrape ?? 0) >= 50).length;
    const free = deals.filter((d) => d.price_after === 0).length;

  const telegram = deals.filter((d) => {
  const src = getSourceName(d);
  const ch = getChannelName(d);
  return src.includes("telegram") || ch.startsWith("@");
}).length;


    const reddit = total - telegram;

    const latest = deals[0]?.posted_utc ? new Date(deals[0].posted_utc as any) : null;

    return { total, hot, free, latest, telegram, reddit };
  }, [deals]);

  // ─────────────────────────────────────────────────────────────
  // Filtering & sorting
  // ─────────────────────────────────────────────────────────────
  const filteredDeals = useMemo(() => {
    let result = [...deals];

    // Source filter
    if (sourceFilter !== "all") {
      result = result.filter((d) => {
        const src = getSourceName(d);
        const ch = getChannelName(d);
        const isTelegram = src.includes("telegram") || ch.startsWith("@");

      });
    }

    // Search by title
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.title.toLowerCase().includes(q));
    }

    // Min score
    if (minScore > 0) {
      result = result.filter((d) => (d.score_at_scrape ?? 0) >= minScore);
    }

    // Quick filter chips
    if (quickFilter === "hot") {
      result = result.filter((d) => (d.score_at_scrape ?? 0) >= 50);
    } else if (quickFilter === "free") {
      result = result.filter((d) => d.price_after === 0);
    } else if (quickFilter === "expiring") {
      const now = new Date();
      const twoDays = 1000 * 60 * 60 * 24 * 2;
      result = result.filter((d) => {
        if (!d.expiry_date) return false;
        const exp = new Date(d.expiry_date as any).getTime();
        return exp - now.getTime() <= twoDays && exp >= now.getTime();
      });
    }

    // Sorting
    if (sortBy === "hottest") {
      result.sort((a, b) => (b.score_at_scrape ?? 0) - (a.score_at_scrape ?? 0));
    } else if (sortBy === "biggest-discount") {
      result.sort((a, b) => {
        const getPct = (d: Deal) => {
          if (!d.price_before || d.price_after == null) return 0;
          const diff = d.price_before - d.price_after;
          if (diff <= 0) return 0;
          return diff / d.price_before;
        };
        return getPct(b) - getPct(a);
      });
    }
    // newest is default from DB order

    return result;
  }, [deals, search, minScore, sortBy, quickFilter, sourceFilter]);

  const chipClasses = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs transition-colors ${
      active
        ? "border-pink-500 bg-pink-500/10 text-pink-200"
        : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-pink-500/60 hover:text-pink-200"
    }`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-50">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-70">
        <div className="absolute -left-10 top-20 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">
              Latest Deals
            </h1>
            <p className="mt-3 text-sm text-zinc-400 max-w-xl">
              Deals pulled from Reddit + Telegram. Use filters and jump straight to the link.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <button onClick={() => setQuickFilter("all")} className={chipClasses(quickFilter === "all")}>
                All deals ({stats.total})
              </button>
              <button onClick={() => setQuickFilter("hot")} className={chipClasses(quickFilter === "hot")}>
                🔥 Hot (50+)
              </button>
              <button onClick={() => setQuickFilter("free")} className={chipClasses(quickFilter === "free")}>
                🆓 Free / 0$
              </button>
              <button onClick={() => setQuickFilter("expiring")} className={chipClasses(quickFilter === "expiring")}>
                ⏰ Expiring soon
              </button>
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              Sources: Reddit {stats.reddit} • Telegram {stats.telegram}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 text-xs">
            <span className="inline-flex items-center rounded-full bg-zinc-900/80 px-3 py-1 text-zinc-400 border border-zinc-700/80">
              <span className="mr-1 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Live data from Supabase
            </span>

            {stats.latest && (
              <span className="text-zinc-500">
                Last update:{" "}
                {stats.latest.toLocaleString(undefined, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </header>

        <section className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search deals (e.g. VPN, photo editor, game)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-zinc-700 bg-zinc-900/80 pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div className="flex flex-wrap gap-3 text-xs z-50 relative">
            <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1">
              <Filter className="h-3 w-3 text-zinc-500" />
              <span className="text-zinc-400">Min heat</span>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="bg-zinc-800 text-zinc-100 rounded px-2 py-1 outline-none"
              >
                <option value={0}>Any</option>
                <option value={25}>25+</option>
                <option value={50}>50+</option>
                <option value={100}>100+</option>
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1">
              <span className="text-zinc-400">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-zinc-800 text-zinc-100 rounded px-2 py-1 outline-none"
              >
                <option value="newest">Newest</option>
                <option value="hottest">Hottest</option>
                <option value="biggest-discount">Biggest discount</option>
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1">
              <span className="text-zinc-400">Source</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                className="bg-zinc-800 text-zinc-100 rounded px-2 py-1 outline-none"
              >
                <option value="all">All</option>
                <option value="reddit">Reddit</option>
                <option value="telegram">Telegram</option>
              </select>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DealSkeleton key={i} />
            ))}
          </section>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-red-500/40 bg-red-500/5 p-6 text-sm text-red-200">
            <p className="font-semibold mb-1">Failed to load deals</p>
            <p className="text-red-300">{error}</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/70 px-6 py-10 text-center text-sm text-zinc-300">
            <p className="text-lg font-semibold">No deals match your filters 🔍</p>
            <p className="text-zinc-400 max-w-md">
              Clear search / lower heat / switch source to <span className="font-medium text-pink-300">All</span>.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
