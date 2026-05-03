import { NextRequest, NextResponse } from "next/server";
import { routeCommand } from "@/agents/command-router";
import { sendTelegramMessage } from "@/lib/telegram";
import { collections } from "@/lib/firestore";

/**
 * POST /api/webhooks/telegram
 *
 * Receives incoming messages from the Telegram Bot API webhook.
 * Routes messages through the command router and sends responses back.
 */
export async function POST(request: NextRequest) {
  try {
    const update = await request.json();

    // Telegram sends updates with a "message" field
    const message = update?.message;
    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text;
    const telegramUserId = String(message.from?.id || "");

    console.log(`💬 Telegram message from ${chatId}: ${text.slice(0, 100)}`);

    // Find the Aegis user by their Telegram chat ID
    const usersSnapshot = await collections
      .users()
      .where("preferences.telegramChatId", "==", chatId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      // User hasn't linked their Telegram yet
      // If they send /start, give them instructions
      if (text === "/start") {
        await sendTelegramMessage(
          chatId,
          "⚡ *Welcome to Aegis\\!*\n\n" +
          "To link your account, go to your Aegis dashboard settings and enter this Chat ID:\n\n" +
          `\`${chatId}\`\n\n` +
          "Once linked, you can use all commands\\.",
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `❓ Your Telegram isn't linked to Aegis yet\\.\n\nYour Chat ID: \`${chatId}\`\n\nAdd this in your Aegis dashboard settings\\.`,
        );
      }
      return NextResponse.json({ ok: true });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    const timezone = userData.preferences?.timezone || "UTC";

    // Route the command
    const result = await routeCommand(userId, text, timezone);

    // Send the response back
    await sendTelegramMessage(chatId, result.text, result.parseMode || "MarkdownV2");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    // Still return 200 to prevent Telegram from retrying
    return NextResponse.json({ ok: true });
  }
}
