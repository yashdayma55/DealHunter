// src/types/deal.ts
export interface Deal {
  id: number;

  title: string;
  description: string | null;

  price_before: number | null;
  price_after: number | null;
  currency: string | null;

  discount_type: string | null;
  discount_value: number | null;

  url: string | null;
  referral_code: string | null;

  score_at_scrape: number | null;

  posted_utc: string | null;
  expiry_date: string | null;

  // metadata
  channel_id?: number | null;
  data_source_id?: number | null;

  // ✅ Supabase relations are ARRAYS
  channel?: { channel_name: string | null }[] | null;
  source?: { name: string | null }[] | null;
}
