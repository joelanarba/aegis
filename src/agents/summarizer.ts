import { z } from "zod";
import { structuredCompletion } from "@/lib/openai";

/**
 * Email Summarizer Agent
 * Produces concise summaries and extracts action items from emails.
 */

const SummaryResultSchema = z.object({
  summary: z.string().describe("2-3 sentence summary of the email's key content"),
  actionItems: z.array(
    z.object({
      text: z.string().describe("What needs to be done"),
      deadline: z.string().nullable().describe("Deadline if mentioned, in ISO format or natural language"),
      type: z.enum(["task", "deadline", "request", "follow-up"]),
    })
  ),
  keyPoints: z.array(z.string()).describe("3-5 bullet point key takeaways"),
});

export type SummaryResult = z.infer<typeof SummaryResultSchema>;

const SYSTEM_PROMPT = `You are a concise email summarizer. Your job is to:

1. **Summarize** the email in 2-3 clear sentences. Focus on WHAT the email is about and WHAT the sender wants.
2. **Extract action items** — things the recipient needs to do. Include deadlines if mentioned.
3. **List key points** — 3-5 bullet points capturing the most important information.

Rules:
- Be concise. No fluff.
- If the email is purely informational with no action needed, return an empty actionItems array.
- For deadlines, preserve the exact wording (e.g., "by Friday", "before March 15th").
- Classify action items as: task (something to do), deadline (a due date), request (someone asking for something), follow-up (needs a response later).`;

export async function summarizeEmail(
  userId: string,
  email: { from: string; subject: string; body: string }
): Promise<SummaryResult> {
  const userPrompt = `Summarize this email:

From: ${email.from}
Subject: ${email.subject}

Body:
${email.body.slice(0, 4000)}`;

  return structuredCompletion({
    userId,
    actionType: "summarize",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    schema: SummaryResultSchema,
    schemaName: "email_summary",
    temperature: 0.2,
    maxTokens: 600,
  });
}
