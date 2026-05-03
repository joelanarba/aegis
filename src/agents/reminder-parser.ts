import { z } from "zod";
import { structuredCompletion } from "@/lib/openai";

/**
 * Reminder Parser Agent
 * Converts natural language reminder requests into structured data.
 */

const ReminderParseSchema = z.object({
  understood: z.boolean().describe("Whether the input was understood as a reminder request"),
  text: z.string().describe("Clean, concise reminder text (e.g., 'Learn TypeScript')"),
  triggerAt: z.string().describe("ISO 8601 datetime string for when the reminder should fire"),
  recurrence: z.enum(["daily", "weekly", "monthly", "none"]).describe("Repeat pattern if mentioned"),
  createCalendarEvent: z.boolean().describe("Whether this should also be a calendar event"),
  reasoning: z.string().describe("Brief explanation of how you interpreted the request"),
});

export type ParsedReminder = z.infer<typeof ReminderParseSchema>;

const SYSTEM_PROMPT = `You are a natural language reminder parser. Convert user requests into structured reminder data.

Rules:
1. Extract the reminder text (what to be reminded about)
2. Determine the exact datetime to trigger the reminder
3. Detect any recurrence pattern (daily, weekly, monthly)
4. Decide if this should also be a calendar event (events have specific time blocks; reminders are just notifications)

Examples:
- "remind me to learn at 4pm" → text: "Learn", triggerAt: today at 4pm, recurrence: none
- "remind me to call mom every Sunday at 10am" → text: "Call mom", triggerAt: next Sunday 10am, recurrence: weekly
- "remind me to submit report by Friday" → text: "Submit report", triggerAt: Friday 9am, recurrence: none
- "meeting with John tomorrow at 2pm" → text: "Meeting with John", triggerAt: tomorrow 2pm, createCalendarEvent: true
- "remind me to drink water every 2 hours" → text: "Drink water", triggerAt: 2 hours from now, recurrence: daily (approximate)

If the request is ambiguous about time, use reasonable defaults:
- "tomorrow" → tomorrow at 9:00 AM
- "this evening" → today at 6:00 PM
- "this weekend" → Saturday at 10:00 AM
- No time specified → 9:00 AM on the mentioned date`;

export async function parseReminder(
  userId: string,
  input: string,
  userTimezone: string = "UTC"
): Promise<ParsedReminder> {
  const now = new Date();

  const userPrompt = `Parse this reminder request:

"${input}"

Current date/time: ${now.toISOString()}
User's timezone: ${userTimezone}`;

  return structuredCompletion({
    userId,
    actionType: "reminder",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    schema: ReminderParseSchema,
    schemaName: "parsed_reminder",
    temperature: 0.1,
    maxTokens: 300,
  });
}
