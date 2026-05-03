import { textCompletion } from "@/lib/openai";
import { getProcessedEmails, getPendingDrafts, getPendingEvents, getActiveReminders } from "@/lib/firestore";
import { parseReminder } from "./reminder-parser";
import { storeReminder } from "@/lib/firestore";
import { conductResearch } from "./researcher";
import { generateDigest } from "./digest-generator";

/**
 * Telegram Command Router
 * Parses incoming Telegram messages and routes them to the appropriate agent.
 */

export interface CommandResult {
  text: string;
  parseMode?: "Markdown" | "MarkdownV2" | "HTML";
}

/**
 * Route a Telegram message to the correct handler.
 */
export async function routeCommand(
  userId: string,
  message: string,
  userTimezone: string = "UTC"
): Promise<CommandResult> {
  const trimmed = message.trim();

  // Explicit commands
  if (trimmed.startsWith("/")) {
    const [command, ...args] = trimmed.split(" ");
    const argText = args.join(" ");

    switch (command.toLowerCase()) {
      case "/start":
        return handleStart();
      case "/help":
        return handleHelp();
      case "/inbox":
        return handleInbox(userId);
      case "/urgent":
        return handleUrgent(userId);
      case "/drafts":
        return handleDrafts(userId);
      case "/events":
        return handleEvents(userId);
      case "/reminders":
        return handleReminders(userId);
      case "/remind":
        return handleRemind(userId, argText, userTimezone);
      case "/research":
        return handleResearch(userId, argText);
      case "/digest":
        return handleDigest(userId);
      default:
        return { text: "❓ Unknown command. Type /help for available commands." };
    }
  }

  // Natural language — use AI to detect intent
  return handleNaturalLanguage(userId, trimmed, userTimezone);
}

// ─── Command Handlers ───

function handleStart(): CommandResult {
  return {
    text:
      `⚡ *Welcome to Aegis*\n\n` +
      `I'm your personal AI agent\\. I monitor your emails, manage your calendar, ` +
      `and keep you organized\\.\n\n` +
      `Type /help to see what I can do\\.`,
  };
}

function handleHelp(): CommandResult {
  return {
    text:
      `⚡ *Aegis Commands*\n\n` +
      `📧 /inbox — Recent email summaries\n` +
      `🚨 /urgent — Items needing attention\n` +
      `✏️ /drafts — Pending reply drafts\n` +
      `📅 /events — Upcoming calendar events\n` +
      `⏰ /reminders — Active reminders\n` +
      `⏰ /remind \\[text\\] — Set a reminder\n` +
      `🔍 /research \\[query\\] — Search the web\n` +
      `📊 /digest — Generate a digest now\n\n` +
      `You can also send natural language messages like:\n` +
      `"remind me to learn at 4pm"\n` +
      `"what emails did I get today?"`,
  };
}

async function handleInbox(userId: string): Promise<CommandResult> {
  const emails = await getProcessedEmails(userId, 5);

  if (emails.length === 0) {
    return { text: "📧 No processed emails yet\\. Once Gmail is connected, your emails will appear here\\." };
  }

  let text = "📧 *Recent Emails*\n\n";
  for (const email of emails) {
    const priorityEmoji = getPriorityEmoji(email.triage?.priority);
    const from = escMd(email.from.split("<")[0].trim());
    const subject = escMd(email.subject);
    const summary = escMd(email.summary || email.snippet);
    text += `${priorityEmoji} *${subject}*\nFrom: ${from}\n${summary}\n\n`;
  }

  return { text };
}

async function handleUrgent(userId: string): Promise<CommandResult> {
  const emails = await getProcessedEmails(userId, 20);
  const urgent = emails.filter(
    (e) => e.triage?.priority === "urgent" || e.triage?.priority === "important"
  );

  if (urgent.length === 0) {
    return { text: "✅ Nothing urgent right now\\. You're all caught up\\!" };
  }

  let text = "🚨 *Items Needing Attention*\n\n";
  for (const email of urgent.slice(0, 5)) {
    const from = escMd(email.from.split("<")[0].trim());
    const subject = escMd(email.subject);
    text += `• *${subject}* from ${from}\n`;
    if (email.summary) text += `  ${escMd(email.summary)}\n`;
    text += "\n";
  }

  return { text };
}

async function handleDrafts(userId: string): Promise<CommandResult> {
  const drafts = await getPendingDrafts(userId);

  if (drafts.length === 0) {
    return { text: "✏️ No pending drafts\\. All replies are handled\\!" };
  }

  let text = `✏️ *Pending Drafts \\(${drafts.length}\\)*\n\n`;
  for (const draft of drafts.slice(0, 5)) {
    const preview = escMd(draft.content.slice(0, 100));
    text += `• \\[${draft.tone}\\] ${preview}\\.\\.\\.\n\n`;
  }
  text += "_Review and approve drafts on the web dashboard\\._";

  return { text };
}

async function handleEvents(userId: string): Promise<CommandResult> {
  const events = await getPendingEvents(userId);

  if (events.length === 0) {
    return { text: "📅 No pending events\\. Your calendar is clear\\!" };
  }

  let text = "📅 *Pending Events*\n\n";
  for (const event of events) {
    const start = event.startTime instanceof Date
      ? event.startTime
      : (event.startTime as { toDate: () => Date }).toDate();
    const timeStr = start.toLocaleString();
    text += `• *${escMd(event.title)}*\n  📍 ${escMd(timeStr)}\n\n`;
  }
  text += "_Approve events on the web dashboard\\._";

  return { text };
}

async function handleReminders(userId: string): Promise<CommandResult> {
  const reminders = await getActiveReminders(userId);

  if (reminders.length === 0) {
    return { text: "⏰ No active reminders\\. Set one with /remind or just tell me\\!" };
  }

  let text = `⏰ *Active Reminders \\(${reminders.length}\\)*\n\n`;
  for (const rem of reminders) {
    const triggerAt = rem.triggerAt instanceof Date
      ? rem.triggerAt
      : (rem.triggerAt as { toDate: () => Date }).toDate();
    const timeStr = triggerAt.toLocaleString();
    const recurrence = rem.recurrence ? ` \\(${rem.recurrence}\\)` : "";
    text += `• ${escMd(rem.text)} — ${escMd(timeStr)}${recurrence}\n`;
  }

  return { text };
}

async function handleRemind(
  userId: string,
  input: string,
  timezone: string
): Promise<CommandResult> {
  if (!input.trim()) {
    return { text: "⏰ What should I remind you about? Example:\n/remind Learn TypeScript at 4pm" };
  }

  const parsed = await parseReminder(userId, input, timezone);

  if (!parsed.understood) {
    return { text: "❓ I couldn't understand that reminder\\. Try something like:\n\"remind me to learn at 4pm\"" };
  }

  await storeReminder({
    userId,
    text: parsed.text,
    triggerAt: new Date(parsed.triggerAt),
    recurrence: parsed.recurrence === "none" ? null : parsed.recurrence,
    source: "telegram",
    status: "active",
    googleEventId: null,
    createdAt: new Date(),
  });

  const triggerDate = new Date(parsed.triggerAt);
  const timeStr = triggerDate.toLocaleString();
  const recurrenceText = parsed.recurrence !== "none" ? ` \\(repeats ${parsed.recurrence}\\)` : "";

  return {
    text: `✅ *Reminder set\\!*\n\n⏰ ${escMd(parsed.text)}\n📅 ${escMd(timeStr)}${recurrenceText}`,
  };
}

async function handleResearch(userId: string, query: string): Promise<CommandResult> {
  if (!query.trim()) {
    return { text: "🔍 What should I research? Example:\n/research best practices for TypeScript error handling" };
  }

  try {
    const result = await conductResearch(userId, query.trim());

    let text = `🔍 *Research: ${escMd(query)}*\n\n`;
    text += escMd(result.synthesis) + "\n";

    if (result.sources.length > 0) {
      text += "\n📎 *Sources:*\n";
      result.sources.forEach((s, i) => {
        text += `${i + 1}\\. ${escMd(s.title)}\n`;
      });
    }

    return { text };
  } catch (error) {
    return { text: `❌ Research failed: ${escMd(String(error))}` };
  }
}

async function handleDigest(userId: string): Promise<CommandResult> {
  try {
    const digest = await generateDigest(userId);

    let text = "📊 *Your Digest*\n\n";
    text += escMd(digest.summary) + "\n";

    if (digest.urgentItems.length > 0) {
      text += "\n🚨 *Urgent:*\n";
      digest.urgentItems.forEach((item) => {
        text += `• ${escMd(item)}\n`;
      });
    }

    if (digest.actionItems.length > 0) {
      text += "\n📋 *Action Items:*\n";
      digest.actionItems.forEach((item) => {
        text += `• ${escMd(item)}\n`;
      });
    }

    if (digest.dueReminders.length > 0) {
      text += "\n⏰ *Reminders:*\n";
      digest.dueReminders.forEach((item) => {
        text += `• ${escMd(item)}\n`;
      });
    }

    return { text };
  } catch (error) {
    return { text: `❌ Digest generation failed: ${escMd(String(error))}` };
  }
}

/**
 * Handle free-form natural language messages using AI intent detection.
 */
async function handleNaturalLanguage(
  userId: string,
  message: string,
  timezone: string
): Promise<CommandResult> {
  // Check if it looks like a reminder
  const reminderKeywords = ["remind", "reminder", "remember", "alert me", "notify me", "wake me"];
  const isReminder = reminderKeywords.some((kw) => message.toLowerCase().includes(kw));

  if (isReminder) {
    return handleRemind(userId, message, timezone);
  }

  // For other intents, use AI to understand
  const response = await textCompletion({
    userId,
    actionType: "command",
    systemPrompt: `You are Aegis, a personal AI assistant. The user sent a message via Telegram. 
Respond helpfully and concisely. If they're asking about emails, say you can show them with /inbox. 
If they want to set a reminder, help them rephrase as a reminder. 
Keep responses short and friendly. Use simple text, no markdown.`,
    userPrompt: message,
    temperature: 0.7,
    maxTokens: 200,
  });

  return { text: escMd(response) };
}

// ─── Helpers ───

function getPriorityEmoji(priority?: string): string {
  switch (priority) {
    case "urgent": return "🔴";
    case "important": return "🟠";
    case "routine": return "🟢";
    case "low": return "⚪";
    case "spam": return "🗑️";
    default: return "📧";
  }
}

function escMd(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}
