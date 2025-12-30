import { TelegramClient } from "telegram/client/TelegramClient.js";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import "dotenv/config";

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

if (!apiId || !apiHash) {
  throw new Error("Missing TELEGRAM_API_ID or TELEGRAM_API_HASH");
}

// empty on first run
const session = new StringSession("");

(async () => {
  console.log("🔐 Telegram one-time login");

  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("📱 Telegram phone number: "),
    password: async () =>
      await input.text("🔐 2FA password (press Enter if none): "),
    phoneCode: async () => await input.text("📩 Code from Telegram: "),
    onError: (err) => console.error(err),
  });

  console.log("✅ Telegram connected");
  console.log("🔥 SAVE THIS SESSION STRING 🔥");
  console.log(client.session.save());

  process.exit(0);
})();
