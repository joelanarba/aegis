import { google } from "googleapis";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { getConfig } from "./config";
import { getUser, upsertUser } from "./firestore";
import type { UserDoc } from "@/types/firestore";

/**
 * Google OAuth2 authentication and token management.
 * Handles: auth URL generation, token exchange, encryption, refresh.
 */

// Scopes needed for Gmail read/write and Calendar management
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

/**
 * Create an OAuth2 client instance.
 */
export function createOAuth2Client() {
  const config = getConfig();
  return new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate the Google OAuth2 consent URL.
 */
export function getAuthUrl(): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline", // Get a refresh token
    prompt: "consent", // Always show consent to get refresh token
    scope: SCOPES,
  });
}

/**
 * Exchange authorization code for tokens, encrypt, and store.
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  userId: string;
  email: string;
}> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Failed to obtain access and refresh tokens");
  }

  // Set credentials to fetch user info
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data: userInfo } = await oauth2.userinfo.get();

  if (!userInfo.email || !userInfo.id) {
    throw new Error("Failed to retrieve user email from Google");
  }

  const userId = userInfo.id;

  // Encrypt tokens before storing
  const encryptedAccess = encrypt(tokens.access_token);
  const encryptedRefresh = encrypt(tokens.refresh_token);

  const userData: Partial<UserDoc> = {
    email: userInfo.email,
    googleAccessToken: encryptedAccess,
    googleRefreshToken: encryptedRefresh,
    tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(),
    lastHistoryId: null,
    preferences: {
      timezone: "UTC",
      digestFrequency: "daily",
      digestTime: "08:00",
      notifyUrgent: true,
      telegramChatId: null,
      replyTone: "both",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await upsertUser(userId, userData);

  return { userId, email: userInfo.email };
}

/**
 * Get an authenticated OAuth2 client for a specific user.
 * Automatically refreshes the token if expired.
 */
export async function getAuthenticatedClient(userId: string) {
  const user = await getUser(userId);
  if (!user) throw new Error(`User ${userId} not found`);

  const client = createOAuth2Client();

  const accessToken = decrypt(user.googleAccessToken);
  const refreshToken = decrypt(user.googleRefreshToken);

  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Check if token needs refresh
  const expiresAt = user.tokenExpiresAt instanceof Date
    ? user.tokenExpiresAt
    : user.tokenExpiresAt.toDate();

  if (expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
    // Token expires within 5 minutes — refresh it
    const { credentials } = await client.refreshAccessToken();

    if (credentials.access_token) {
      await upsertUser(userId, {
        googleAccessToken: encrypt(credentials.access_token),
        tokenExpiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : new Date(Date.now() + 3600 * 1000),
        updatedAt: new Date(),
      });

      client.setCredentials(credentials);
    }
  }

  return client;
}

// ─── Encryption Helpers ───
// AES-256-CBC encryption for storing OAuth tokens in Firestore

const ALGORITHM = "aes-256-cbc";

function getEncryptionKey(): Buffer {
  const config = getConfig();
  // Use first 32 bytes of APP_SECRET_KEY as the encryption key
  return Buffer.from(config.APP_SECRET_KEY.slice(0, 32).padEnd(32, "0"));
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  // Prepend IV for decryption (IV doesn't need to be secret)
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const [ivHex, encrypted] = encryptedText.split(":");
  if (!ivHex || !encrypted) throw new Error("Invalid encrypted text format");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
