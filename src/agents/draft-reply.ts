import { textCompletion, SMART_MODEL } from "@/lib/openai";

/**
 * Draft Reply Agent
 * Generates context-aware email reply drafts in two tones.
 */

const SYSTEM_PROMPT_PROFESSIONAL = `You are an expert email reply assistant. Generate a professional, clear, and appropriate reply to the email below.

Guidelines:
- Match the formality level of the original email
- Be concise but thorough
- Address all questions or requests in the original
- Use appropriate greetings and sign-offs
- Do NOT include a subject line — only the reply body
- If the email doesn't require a substantive reply (e.g., "thanks", "noted"), generate a brief acknowledgment`;

const SYSTEM_PROMPT_MIRROR = `You are an email reply assistant that mirrors the user's writing style. Generate a reply that sounds natural and authentic, as if the user wrote it themselves.

Guidelines:
- Match the tone, vocabulary, and style patterns of the user's previous messages
- Keep it natural and conversational where appropriate
- Be concise — don't over-explain
- Address the core points of the incoming email
- Do NOT include a subject line — only the reply body
- If provided, use the user's previous emails as style reference`;

export interface DraftReplyOptions {
  userId: string;
  originalEmail: {
    from: string;
    subject: string;
    body: string;
  };
  threadContext?: string; // Previous messages in the thread
  tone: "mirror" | "professional";
  userStyleSamples?: string; // User's previous sent emails for style matching
  additionalInstructions?: string;
}

export async function generateDraftReply(options: DraftReplyOptions): Promise<string> {
  const systemPrompt =
    options.tone === "mirror" ? SYSTEM_PROMPT_MIRROR : SYSTEM_PROMPT_PROFESSIONAL;

  let userPrompt = `Generate a reply to this email:\n\n`;
  userPrompt += `From: ${options.originalEmail.from}\n`;
  userPrompt += `Subject: ${options.originalEmail.subject}\n\n`;
  userPrompt += `Email body:\n${options.originalEmail.body.slice(0, 3000)}\n`;

  if (options.threadContext) {
    userPrompt += `\n--- Previous messages in this thread ---\n${options.threadContext.slice(0, 2000)}\n`;
  }

  if (options.tone === "mirror" && options.userStyleSamples) {
    userPrompt += `\n--- User's writing style reference ---\n${options.userStyleSamples.slice(0, 1500)}\n`;
  }

  if (options.additionalInstructions) {
    userPrompt += `\nAdditional instructions: ${options.additionalInstructions}\n`;
  }

  return textCompletion({
    userId: options.userId,
    actionType: "draft",
    systemPrompt,
    userPrompt,
    model: SMART_MODEL, // Use the smarter model for draft quality
    temperature: 0.7,
    maxTokens: 1000,
  });
}
