// src/types/deal.ts
export interface Deal {
  id: number;
  title: string;
  description: string | null;
  price_before: number | null;
  price_after: number | null;
  currency: string | null;
  discount_type: string | null;   // "percentage" | "absolute" | null
  discount_value: number | null;
  url: string | null;
  referral_code: string | null;
  score_at_scrape: number | null;
  posted_utc: string | null;      // ISO string
  expiry_date: string | null;
}
