import { textCompletion, SMART_MODEL } from "@/lib/openai";
import {
  getProcessedEmails,
  getPendingDrafts,
  getPendingEvents,
  getActiveReminders,
} from "@/lib/firestore";
import { listUpcomingEvents } from "@/lib/gcalendar";

/**
 * Digest Generator Agent
 * Aggregates information from all sources into a daily briefing.
 */

export interface DigestData {
  summary: string;
  urgentItems: string[];
  actionItems: string[];
  upcomingDeadlines: string[];
  dueReminders: string[];
}

const DIGEST_PROMPT = `You are a personal executive assistant generating a daily digest. 
Given the raw data about the user's emails, calendar, reminders, and pending items, 
produce a concise, actionable daily briefing.

Format guidelines:
- Start with a 2-3 sentence overview of the day
- Group information by urgency
- Be specific about deadlines and times
- Highlight anything that needs immediate action
- Keep the total digest under 300 words
- Use a warm but professional tone`;

/**
 * Generate a comprehensive digest of the user's current state.
 */
export async function generateDigest(userId: string): Promise<DigestData> {
  // Gather data from all sources
  const [emails, drafts, pendingEvents, reminders] = await Promise.all([
    getProcessedEmails(userId, 20),
    getPendingDrafts(userId),
    getPendingEvents(userId),
    getActiveReminders(userId),
  ]);

  // Try to get calendar events, but don't fail if not authorized
  let calendarEvents: { title: string; start: Date }[] = [];
  try {
    calendarEvents = await listUpcomingEvents(userId, 5);
  } catch {
    // Calendar not connected yet — that's fine
  }

  // Filter for urgent/important emails
  const urgentEmails = emails.filter(
    (e) => e.triage?.priority === "urgent" || e.triage?.priority === "important"
  );

  // Collect action items from all emails
  const allActionItems = emails
    .flatMap((e) => e.actionItems || [])
    .filter((item) => item.text);

  // Build raw context for AI
  let rawData = `Current time: ${new Date().toISOString()}\n\n`;

  rawData += `--- EMAILS (${emails.length} processed) ---\n`;
  if (urgentEmails.length > 0) {
    rawData += `Urgent/Important (${urgentEmails.length}):\n`;
    urgentEmails.forEach((e) => {
      rawData += `• [${e.triage?.priority}] "${e.subject}" from ${e.from.split("<")[0].trim()} — ${e.summary || e.snippet}\n`;
    });
  } else {
    rawData += "No urgent emails.\n";
  }

  rawData += `\n--- PENDING DRAFTS (${drafts.length}) ---\n`;
  drafts.slice(0, 5).forEach((d) => {
    rawData += `• [${d.tone}] ${d.content.slice(0, 80)}...\n`;
  });

  rawData += `\n--- ACTION ITEMS (${allActionItems.length}) ---\n`;
  allActionItems.slice(0, 10).forEach((item) => {
    rawData += `• ${item.text}${item.deadline ? ` (due: ${item.deadline})` : ""}\n`;
  });

  rawData += `\n--- UPCOMING EVENTS (${pendingEvents.length} pending, ${calendarEvents.length} confirmed) ---\n`;
  pendingEvents.forEach((e) => {
    const start = e.startTime instanceof Date ? e.startTime : (e.startTime as { toDate: () => Date }).toDate();
    rawData += `• [PENDING APPROVAL] ${e.title} at ${start.toISOString()}\n`;
  });
  calendarEvents.forEach((e) => {
    rawData += `• [CONFIRMED] ${e.title} at ${e.start.toISOString()}\n`;
  });

  rawData += `\n--- REMINDERS (${reminders.length} active) ---\n`;
  reminders.forEach((r) => {
    const trigger = r.triggerAt instanceof Date ? r.triggerAt : (r.triggerAt as { toDate: () => Date }).toDate();
    rawData += `• ${r.text} — ${trigger.toISOString()}${r.recurrence ? ` (${r.recurrence})` : ""}\n`;
  });

  // Generate digest with AI
  const summary = await textCompletion({
    userId,
    actionType: "digest",
    systemPrompt: DIGEST_PROMPT,
    userPrompt: rawData,
    model: SMART_MODEL,
    temperature: 0.5,
    maxTokens: 800,
  });

  // Build structured digest data
  return {
    summary,
    urgentItems: urgentEmails.map((e) => `${e.subject} — ${e.summary || e.snippet}`),
    actionItems: allActionItems.slice(0, 10).map((item) =>
      `${item.text}${item.deadline ? ` (due: ${item.deadline})` : ""}`
    ),
    upcomingDeadlines: allActionItems
      .filter((item) => item.deadline)
      .map((item) => `${item.text} — ${item.deadline}`),
    dueReminders: reminders.map((r) => {
      const trigger = r.triggerAt instanceof Date ? r.triggerAt : (r.triggerAt as { toDate: () => Date }).toDate();
      return `${r.text} — ${trigger.toLocaleString()}`;
    }),
  };
}
