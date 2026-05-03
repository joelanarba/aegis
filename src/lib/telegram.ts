import { getConfig } from "./config";

/**
 * Telegram Bot API client.
 * Handles sending messages, formatted digests, and managing webhooks.
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: "Markdown" | "MarkdownV2" | "HTML" | null = "Markdown",
  replyMarkup?: any
): Promise<boolean> {
  const config = getConfig();
  if (!config.TELEGRAM_BOT_TOKEN) {
    console.warn("Telegram bot token not configured, skipping notification");
    return false;
  }

  const payload: any = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  };

  if (parseMode) payload.parse_mode = parseMode;
  if (replyMarkup) payload.reply_markup = replyMarkup;

  const response = await fetch(`${TELEGRAM_API}${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: TelegramResponse = await response.json();
  if (!data.ok) {
    console.error("Telegram send error:", data.description);
  }
  return data.ok;
}

/**
 * Answer a callback query (from an inline button press)
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<boolean> {
  const config = getConfig();
  if (!config.TELEGRAM_BOT_TOKEN) return false;

  const response = await fetch(`${TELEGRAM_API}${config.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text,
    }),
  });

  const data = await response.json();
  return data.ok;
}

/**
 * Send an urgent email notification via Telegram.
 */
export async function sendUrgentEmailAlert(
  chatId: string,
  email: { from: string; subject: string; summary: string }
): Promise<boolean> {
  const message = `🚨 *Urgent Email*\n\n` +
    `*From:* ${escapeMarkdown(email.from)}\n` +
    `*Subject:* ${escapeMarkdown(email.subject)}\n\n` +
    `${escapeMarkdown(email.summary)}`;

  return sendTelegramMessage(chatId, message);
}

/**
 * Send a reminder notification via Telegram.
 */
export async function sendReminderNotification(
  chatId: string,
  reminderText: string
): Promise<boolean> {
  const message = `⏰ *Reminder*\n\n${escapeMarkdown(reminderText)}`;
  return sendTelegramMessage(chatId, message);
}

/**
 * Send a formatted digest via Telegram.
 */
export async function sendDigestMessage(
  chatId: string,
  digest: {
    summary: string;
    urgentItems: string[];
    actionItems: string[];
    upcomingDeadlines: string[];
    dueReminders: string[];
  }
): Promise<boolean> {
  let message = `📊 *Daily Digest*\n\n`;
  message += `${escapeMarkdown(digest.summary)}\n`;

  if (digest.urgentItems.length > 0) {
    message += `\n🚨 *Urgent:*\n`;
    for (const item of digest.urgentItems) {
      message += `• ${escapeMarkdown(item)}\n`;
    }
  }

  if (digest.actionItems.length > 0) {
    message += `\n📋 *Action Items:*\n`;
    for (const item of digest.actionItems) {
      message += `• ${escapeMarkdown(item)}\n`;
    }
  }

  if (digest.upcomingDeadlines.length > 0) {
    message += `\n⏳ *Deadlines:*\n`;
    for (const item of digest.upcomingDeadlines) {
      message += `• ${escapeMarkdown(item)}\n`;
    }
  }

  if (digest.dueReminders.length > 0) {
    message += `\n⏰ *Reminders:*\n`;
    for (const item of digest.dueReminders) {
      message += `• ${escapeMarkdown(item)}\n`;
    }
  }

  return sendTelegramMessage(chatId, message);
}

/**
 * Set up the Telegram bot command menu.
 */
export async function setTelegramCommands(): Promise<boolean> {
  const config = getConfig();
  if (!config.TELEGRAM_BOT_TOKEN) return false;

  const commands = [
    { command: "inbox", description: "Recent email summaries" },
    { command: "urgent", description: "Items needing attention" },
    { command: "drafts", description: "Pending reply drafts" },
    { command: "events", description: "Upcoming calendar events" },
    { command: "reminders", description: "Active reminders" },
    { command: "research", description: "Search the web" },
    { command: "digest", description: "Generate a digest now" },
    { command: "help", description: "Show all commands" },
  ];

  const response = await fetch(
    `${TELEGRAM_API}${config.TELEGRAM_BOT_TOKEN}/setMyCommands`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands }),
    }
  );

  const data: TelegramResponse = await response.json();
  return data.ok;
}

/**
 * Set up a webhook for the Telegram bot.
 */
export async function setTelegramWebhook(webhookUrl: string): Promise<boolean> {
  const config = getConfig();
  if (!config.TELEGRAM_BOT_TOKEN) return false;

  const response = await fetch(
    `${TELEGRAM_API}${config.TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
      }),
    }
  );

  const data: TelegramResponse = await response.json();
  return data.ok;
}

/**
 * Escape special Markdown characters for Telegram.
 */
function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}
