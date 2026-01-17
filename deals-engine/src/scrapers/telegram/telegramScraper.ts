import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

import dotenv from "dotenv";

dotenv.config();

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH!;
const session = new StringSession(process.env.TELEGRAM_SESSION!);

const client = new TelegramClient(session, apiId, apiHash, {
  connectionRetries: 5,
});

export async function scrapeTelegramChannel(channel: string) {
  await client.connect();

  const deals: any[] = [];

  for await (const msg of client.iterMessages(channel, { limit: 50 })) {
    if (!msg.message) continue;

    // 👉 Take first line as title
    const title = msg.message.split("\n")[0].trim();

    // ❌ Skip non-English titles
    if (!/[a-zA-Z]/.test(title)) continue;

    let url: string | null = null;

    // 1️⃣ Try extracting URL from text
    const textMatch = msg.message.match(/https?:\/\/[^\s]+/);
    if (textMatch) {
      url = textMatch[0];
    }

    // 2️⃣ Try extracting hidden Telegram links (Play Store Link)
    if (!url && msg.entities) {
      for (const ent of msg.entities) {
        if (ent instanceof Api.MessageEntityTextUrl) {
          url = ent.url;
          break;
        }
      }
    }

    // ❌ Skip deal if no URL found
    if (!url) continue;

    deals.push({
      title,
      description: msg.message,
      url,
      posted_utc: new Date(msg.date * 1000).toISOString(),
      score_at_scrape: msg.views ?? 0,
      source: "telegram",
      channel,
    });
  }

  return deals;
}
