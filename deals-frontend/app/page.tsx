"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import type { Deal } from "@/src/types/deal";
import { DealCard } from "@/components/DealCard";
import { DealSkeleton } from "@/components/DealSkeleton";
import { Flame, Clock, Gift, Search } from "lucide-react";

/* =========================================================
   Helpers
========================================================= */
function isTelegramDeal(d: Deal): boolean {
  const raw = (d as any).source;

  if (!raw) return false;

  // Supabase may return object OR array
  if (Array.isArray(raw)) {
    return raw[0]?.name === "telegram";
  }

  return raw.name === "telegram";
}


type SortOption = "newest" | "hottest" | "biggest-discount";
type QuickFilter = "all" | "hot" | "free" | "expiring";
type SourceFilter = "all" | "reddit" | "telegram";

export default function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  /* =========================================================
     Fetch deals
  ========================================================= */
  useEffect(() => {
    async function loadDeals() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("deals")
        .select(`
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
          channel:channels(channel_name),
          source:data_sources(name)
        `)
        .order("posted_utc", { ascending: false })
        .limit(1000);

      if (error) setError(error.message);
      else setDeals((data ?? []) as Deal[]);

      setLoading(false);
    }

    loadDeals();
  }, []);

  /* =========================================================
     Stats
  ========================================================= */
  const stats = useMemo(() => {
    const total = deals.length;
    const telegram = deals.filter(isTelegramDeal).length;
    const reddit = total - telegram;
    const hot = deals.filter(d => (d.score_at_scrape ?? 0) >= 50).length;
    const free = deals.filter(d => d.price_after === 0).length;

    return { total, telegram, reddit, hot, free };
  }, [deals]);

  /* =========================================================
     Filtering & sorting
  ========================================================= */
  const filteredDeals = useMemo(() => {
    let result = [...deals];

    if (sourceFilter !== "all") {
      result = result.filter(d =>
        sourceFilter === "telegram"
          ? isTelegramDeal(d)
          : !isTelegramDeal(d)
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d => d.title.toLowerCase().includes(q));
    }

    if (quickFilter === "hot") {
      result = result.filter(d => (d.score_at_scrape ?? 0) >= 50);
    } else if (quickFilter === "free") {
      result = result.filter(d => d.price_after === 0);
    } else if (quickFilter === "expiring") {
      const now = Date.now();
      const twoDays = 1000 * 60 * 60 * 24 * 2;
      result = result.filter(d => {
        if (!d.expiry_date) return false;
        const exp = new Date(d.expiry_date as any).getTime();
        return exp >= now && exp - now <= twoDays;
      });
    }

    if (sortBy === "hottest") {
      result.sort((a, b) => (b.score_at_scrape ?? 0) - (a.score_at_scrape ?? 0));
    } else if (sortBy === "biggest-discount") {
      result.sort((a, b) => {
        const pct = (d: Deal) => {
          if (!d.price_before || d.price_after == null) return 0;
          return (d.price_before - d.price_after) / d.price_before;
        };
        return pct(b) - pct(a);
      });
    }

    return result;
  }, [deals, search, sortBy, quickFilter, sourceFilter]);

  /* =========================================================
     UI
  ========================================================= */
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* HERO */}
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
            Latest Deals
          </h1>
          <p className="mt-3 text-zinc-400">
            Deals pulled from Reddit & Telegram. Filter smart and jump straight to the link.
          </p>

          {/* Stats pills */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full bg-zinc-900 px-3 py-1 border border-zinc-700">
              All deals ({stats.total})
            </span>
            <span className="rounded-full bg-zinc-900 px-3 py-1 border border-orange-500/40 text-orange-300">
              🔥 Hot ({stats.hot})
            </span>
            <span className="rounded-full bg-zinc-900 px-3 py-1 border border-green-500/40 text-green-300">
              🎁 Free ({stats.free})
            </span>
            <span className="rounded-full bg-zinc-900 px-3 py-1 border border-zinc-700">
              Reddit {stats.reddit} • Telegram {stats.telegram}
            </span>
          </div>
        </header>

        {/* FILTER BAR */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          {/* Search */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              className="w-full rounded-full bg-zinc-900 border border-zinc-700 pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-pink-500"
              placeholder="Search deals (apps, games, tools...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            <select
              value={quickFilter}
              onChange={e => setQuickFilter(e.target.value as QuickFilter)}
              className="rounded-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="hot">🔥 Hot</option>
              <option value="free">🎁 Free</option>
              <option value="expiring">⏳ Expiring</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="rounded-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="hottest">Hottest</option>
              <option value="biggest-discount">Biggest discount</option>
            </select>

            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value as SourceFilter)}
              className="rounded-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm"
            >
              <option value="all">All sources</option>
              <option value="reddit">Reddit</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <DealSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
