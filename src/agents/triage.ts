import { z } from "zod";
import { structuredCompletion } from "@/lib/openai";

/**
 * Email Triage Agent
 * Classifies incoming emails by priority, category, and required actions.
 */

const TriageResultSchema = z.object({
  priority: z.enum(["urgent", "important", "routine", "low", "spam"]),
  category: z.enum(["work", "personal", "financial", "subscription", "social", "other"]),
  requiresReply: z.boolean(),
  hasDeadline: z.boolean(),
  hasEvent: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type TriageResult = z.infer<typeof TriageResultSchema>;

const SYSTEM_PROMPT = `You are an expert email triage assistant. Your job is to classify incoming emails accurately and quickly.

Classification guide:
- **urgent**: Requires immediate attention. Examples: emergency, time-sensitive request with <24h deadline, critical issue
- **important**: Should be addressed soon but not immediately. Examples: meeting request, project update needing response, deadline this week
- **routine**: Normal correspondence. Examples: FYI emails, regular updates, non-urgent requests
- **low**: Can be deferred. Examples: newsletters, promotional content from known sources, social media notifications
- **spam**: Unsolicited, promotional, or irrelevant. Examples: marketing emails, phishing, unknown senders with suspicious content

Category guide:
- **work**: Professional, business, or career-related
- **personal**: Friends, family, personal matters
- **financial**: Banks, payments, invoices, subscriptions billing
- **subscription**: Newsletters, service updates, product announcements
- **social**: Social media notifications, community updates
- **other**: Doesn't fit above categories

Be conservative with "urgent" — most emails are "routine" or "important".`;

export async function triageEmail(
  userId: string,
  email: { from: string; subject: string; snippet: string; body: string }
): Promise<TriageResult> {
  const userPrompt = `Classify this email:

From: ${email.from}
Subject: ${email.subject}
Preview: ${email.snippet}

Body (first 2000 chars):
${email.body.slice(0, 2000)}`;

  return structuredCompletion({
    userId,
    actionType: "triage",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    schema: TriageResultSchema,
    schemaName: "email_triage",
    temperature: 0.1, // Low temp for consistent classification
    maxTokens: 300,
  });
}
