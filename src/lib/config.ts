import { z } from "zod";

/**
 * Zod-validated environment configuration.
 * Fails fast at startup if required env vars are missing.
 */
const envSchema = z.object({
  // Firebase Admin
  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
  FIREBASE_CLIENT_EMAIL: z.string().email("FIREBASE_CLIENT_EMAIL must be a valid email"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY is required"),

  // Google OAuth2
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_REDIRECT_URI: z.string().url("GOOGLE_REDIRECT_URI must be a valid URL"),

  // Google Cloud Pub/Sub
  GOOGLE_PUBSUB_TOPIC: z.string().optional().default(""),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),

  // Tavily (optional — only needed for research phase)
  TAVILY_API_KEY: z.string().optional().default(""),

  // Telegram (optional — only needed for notifications phase)
  TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
  TELEGRAM_CHAT_ID: z.string().optional().default(""),

  // App
  APP_SECRET_KEY: z.string().min(32, "APP_SECRET_KEY must be at least 32 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),

  // Cron
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required"),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Lazily parsed and cached environment config.
 * Throws with a descriptive error message if validation fails.
 */
let _config: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (_config) return _config;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `\n❌ Environment validation failed:\n${errors}\n\nCheck your .env.local file against .env.local.example\n`
    );
  }

  _config = result.data;
  return _config;
}
