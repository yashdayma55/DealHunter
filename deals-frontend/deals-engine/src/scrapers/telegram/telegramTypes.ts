export interface TelegramDeal {
  /** Main message headline */
  title: string;

  /** Full message text */
  description?: string;

  /** Extracted URL (if present in message text) */
  url?: string;

  /** Telegram message timestamp (ISO string) */
  posted_utc?: string;

  /**
   * Raw Telegram-specific data
   * Stored in Supabase as jsonb
   */
  metadata?: {
    telegram_msg_id?: number;
    views?: number | null;
    forwards?: number | null;
    channel?: string;
    [key: string]: any;
  };
}
