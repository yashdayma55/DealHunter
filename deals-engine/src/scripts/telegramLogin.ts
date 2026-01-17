// src/scripts/loginTelegram.ts
import { TelegramClient } from "telegram/client/TelegramClient.js";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import "dotenv/config";

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

if (!apiId || !apiHash) {
  console.error("❌ Missing TELEGRAM_API_ID or TELEGRAM_API_HASH in .env");
  process.exit(1);
}

const session = new StringSession("");

(async () => {
  console.log("🔐 Telegram Login Script");
  
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("📱 Enter your Phone Number: "),
    password: async () => await input.text("🔐 Enter 2FA Password (leave empty if none): "),
    phoneCode: async () => await input.text("📩 Enter the Code sent to your Telegram App: "),
    onError: (err) => console.error(err),
  });

  console.log("\n✅ Login Successful!");
  console.log("👇 COPY THE STRING BELOW AND PASTE IT INTO YOUR .env FILE AS 'TELEGRAM_SESSION' 👇\n");
  console.log(client.session.save()); 
  console.log("\n");
  
  process.exit(0);
})();