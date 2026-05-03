import { setTelegramCommands, setTelegramWebhook } from "../src/lib/telegram";

async function main() {
  const url = process.env.NEXT_PUBLIC_APP_URL || "https://aegis-pa.vercel.app";
  const webhookUrl = `${url}/api/webhooks/telegram`;
  
  console.log("Setting Telegram commands...");
  const cmdOk = await setTelegramCommands();
  console.log("Commands set:", cmdOk);
  
  console.log("Setting Telegram webhook to:", webhookUrl);
  const webOk = await setTelegramWebhook(webhookUrl);
  console.log("Webhook set:", webOk);
}

main().catch(console.error);
