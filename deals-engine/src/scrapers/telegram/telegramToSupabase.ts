import { supabase } from "../../supabaseClient.js";
import { scrapeTelegramChannel } from "./telegramScraper.js";
import { TelegramDeal } from "./telegramTypes.js";

export async function importTelegramDeals(channelName: string) {
  // Fetch channel row
  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("id, data_source_id")
    .eq("channel_name", channelName)
    .single();

  if (channelError || !channel) {
    throw new Error(`Channel not found: ${channelName}`);
  }

  const deals: TelegramDeal[] = await scrapeTelegramChannel(channelName);

  const rows = deals.map((d: TelegramDeal) => ({
  title: d.title,
  description: d.description ?? null,

  // Telegram does NOT have pricing → must be NULL
  price_before: null,
  price_after: null,
  currency: null,

  discount_type: null,
  discount_value: null,

  url: d.url ?? null,

  // REQUIRED by frontend sorting
  posted_utc: d.posted_utc ?? null,

  // Telegram has no score → keep 0
  score_at_scrape: 0,

  channel_id: channel.id,
  data_source_id: channel.data_source_id,

  // Optional relations
  package_id: null,
  referral_code: null,
  expiry_date: null,

  // Telegram-specific info
  metadata: d.metadata ?? {},
}));


  const { error } = await supabase.from("deals").insert(rows);

  if (error) throw error;

  return rows.length;
}
