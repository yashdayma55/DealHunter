import { TelegramClient } from "telegram/client/TelegramClient.js";
import { StringSession } from "telegram/sessions/StringSession.js";
import input from "input";
import "dotenv/config";

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH!;

const stringSession = new StringSession(
  process.env.TELEGRAM_SESSION || ""
);

export async function getTelegramClient() {
  const client = new TelegramClient(
    stringSession,
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  await client.start({
    phoneNumber: async () =>
      await input.text("📱 Telegram phone number: "),
    password: async () =>
      await input.text("🔐 2FA password (if any): "),
    phoneCode: async () =>
      await input.text("📩 Code from Telegram: "),
    onError: (err) => console.error(err),
  });

  console.log("✅ Telegram connected");
  console.log("SESSION:", client.session.save());

  return client;
}
