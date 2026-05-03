import OpenAI from "openai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { getConfig } from "./config";
import { logAgentAction } from "./firestore";

/**
 * OpenAI client wrapper with structured output helpers.
 * Uses GPT-4.1-nano by default for cost efficiency.
 */

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (_client) return _client;
  const config = getConfig();
  _client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  return _client;
}

// Default model — cheapest with good tool-calling support
export const DEFAULT_MODEL = "gpt-4.1-nano";
// Higher-capability model for complex tasks (draft replies, research)
export const SMART_MODEL = "gpt-4.1-mini";

/**
 * Call OpenAI with structured output (JSON mode with Zod schema).
 * Automatically logs the action for cost tracking.
 */
export async function structuredCompletion<T extends z.ZodType>(options: {
  userId: string;
  actionType: string;
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  schemaName: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<z.infer<T>> {
  const client = getOpenAIClient();
  const model = options.model || DEFAULT_MODEL;
  const startTime = Date.now();

  const jsonSchema = zodToJsonSchema(options.schema, options.schemaName);

  const response = await client.chat.completions.create({
    model,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 1000,
    messages: [
      { role: "system", content: options.systemPrompt + "\n\nYou MUST respond with valid JSON matching the required schema." },
      { role: "user", content: options.userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: options.schemaName,
        strict: true,
        schema: jsonSchema.definitions?.[options.schemaName] || jsonSchema,
      },
    },
  });

  const latencyMs = Date.now() - startTime;
  const rawContent = response.choices[0]?.message?.content || "{}";

  // Parse and validate with Zod
  const parsed = options.schema.parse(JSON.parse(rawContent));

  // Log for cost tracking
  const tokensUsed =
    (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0);

  await logAgentAction({
    userId: options.userId,
    type: options.actionType as "triage" | "summarize" | "draft" | "extract_event" | "reminder" | "research" | "digest" | "command",
    input: options.userPrompt.slice(0, 500),
    output: rawContent.slice(0, 500),
    model,
    tokensUsed,
    latencyMs,
    timestamp: new Date(),
  }).catch((err) => console.error("Failed to log agent action:", err));

  return parsed;
}

/**
 * Simple text completion (no structured output).
 * Used for draft replies and free-form text generation.
 */
export async function textCompletion(options: {
  userId: string;
  actionType: string;
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const client = getOpenAIClient();
  const model = options.model || SMART_MODEL;
  const startTime = Date.now();

  const response = await client.chat.completions.create({
    model,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1500,
    messages: [
      { role: "system", content: options.systemPrompt },
      { role: "user", content: options.userPrompt },
    ],
  });

  const latencyMs = Date.now() - startTime;
  const content = response.choices[0]?.message?.content || "";
  const tokensUsed =
    (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0);

  await logAgentAction({
    userId: options.userId,
    type: options.actionType as "triage" | "summarize" | "draft" | "extract_event" | "reminder" | "research" | "digest" | "command",
    input: options.userPrompt.slice(0, 500),
    output: content.slice(0, 500),
    model,
    tokensUsed,
    latencyMs,
    timestamp: new Date(),
  }).catch((err) => console.error("Failed to log agent action:", err));

  return content;
}
