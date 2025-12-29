import { Api } from "telegram";
import { TelegramDeal } from "./telegramTypes.js";
import { getTelegramClient } from "./telegramClient.js";

function extractUrlFromReplyMarkup(
  replyMarkup: unknown
): string | undefined {
  if (replyMarkup instanceof Api.ReplyInlineMarkup) {
    const firstRow = replyMarkup.rows?.[0];
    const firstButton = firstRow?.buttons?.[0];

    if ("url" in firstButton) {
      return firstButton.url;
    }
  }
  return undefined;
}

export async function scrapeTelegramChannel(
  channelName: string
): Promise<TelegramDeal[]> {
  const client = await getTelegramClient();
  const entity = await client.getEntity(channelName);
  const messages = await client.getMessages(entity, { limit: 50 });

  const deals: TelegramDeal[] = [];

  for (const msg of messages) {
    if (!msg.message) continue;

    deals.push({
      title: msg.message.split("\n")[0].slice(0, 120),
      description: msg.message,
      posted_utc: msg.date
        ? new Date(msg.date * 1000).toISOString()
        : undefined,
      url: extractUrlFromReplyMarkup(msg.replyMarkup),
      metadata: {
      telegram_msg_id: msg.id,
      views: msg.views,
      forwards: msg.forwards,
      },

    });
  }

  return deals;
}
