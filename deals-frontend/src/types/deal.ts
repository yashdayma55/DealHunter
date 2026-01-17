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

  channel?: { channel_name: string | null }[] | null;
  source?: { name: string | null }[] | null;

  // 🔥 NEW
  package?: { name: string | null }[] | null;
}
