export interface TelegramDeal {
  title: string;
  description?: string;

  price_before?: number;
  price_after?: number;
  currency?: string;

  discount_type?: string;
  discount_value?: number;

  url?: string;
  posted_utc?: string;
  score?: number;

  metadata?: Record<string, any>;
}
