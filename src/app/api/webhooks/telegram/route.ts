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

    // Check for callback query (inline button press)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = String(cb.message.chat.id);
      const data = cb.data; // e.g. "approve_draft_123"

      console.log(`🔘 Telegram callback from ${chatId}: ${data}`);

      // Find user
      const usersSnapshot = await collections
        .users()
        .where("preferences.telegramChatId", "==", chatId)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        const userId = usersSnapshot.docs[0].id;
        // Import routeCallback from command router (need to add it there)
        const { routeCallback } = await import("@/agents/command-router");
        const result = await routeCallback(userId, data);
        
        // Answer callback to stop loading spinner
        const { answerCallbackQuery } = await import("@/lib/telegram");
        await answerCallbackQuery(cb.id, result.text);
      }
      return NextResponse.json({ ok: true });
    }

    // Otherwise, handle normal text message
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
