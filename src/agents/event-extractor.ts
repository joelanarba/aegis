import { z } from "zod";
import { structuredCompletion } from "@/lib/openai";

/**
 * Calendar Event Extractor Agent
 * Detects dates, times, and meeting details from email content.
 */

const EventExtractionSchema = z.object({
  eventsFound: z.boolean(),
  events: z.array(
    z.object({
      title: z.string().describe("Descriptive event title (not just 'Meeting')"),
      startTime: z.string().describe("ISO 8601 datetime string"),
      endTime: z.string().describe("ISO 8601 datetime string. If duration unknown, assume 1 hour"),
      location: z.string().nullable().describe("Physical or virtual location (Zoom link, address, etc.)"),
      description: z.string().describe("Brief description including context from the email"),
      confidence: z.number().min(0).max(1).describe("How confident you are this is a real event"),
    })
  ),
});

export type EventExtractionResult = z.infer<typeof EventExtractionSchema>;

const SYSTEM_PROMPT = `You are an expert at detecting calendar events, meetings, deadlines, and scheduled activities from email content.

Your job:
1. Identify any dates, times, or scheduled events mentioned in the email
2. Convert them into structured calendar events
3. Generate descriptive titles (e.g., "Team Standup with Marketing" not just "Meeting")
4. If only a date is mentioned without time, use 09:00 as default start time
5. If no end time is given, assume 1 hour duration
6. Include relevant context in the description

Rules:
- Be conservative — only extract events you're confident about (>0.6 confidence)
- Relative dates like "tomorrow", "next Monday" should be converted to actual dates
- Include timezone info if mentioned, otherwise leave in the format provided
- If NO events are found, set eventsFound to false and return empty events array

Current date for reference: ${new Date().toISOString().split("T")[0]}`;

export async function extractEventsFromEmail(
  userId: string,
  email: { from: string; subject: string; body: string },
  userTimezone: string = "UTC"
): Promise<EventExtractionResult> {
  const userPrompt = `Extract calendar events from this email.
User's timezone: ${userTimezone}
Today's date: ${new Date().toISOString().split("T")[0]}

From: ${email.from}
Subject: ${email.subject}

Body:
${email.body.slice(0, 3000)}`;

  return structuredCompletion({
    userId,
    actionType: "extract_event",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    schema: EventExtractionSchema,
    schemaName: "event_extraction",
    temperature: 0.1,
    maxTokens: 600,
  });
}
