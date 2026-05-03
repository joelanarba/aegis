import { google, type gmail_v1 } from "googleapis";
import { getAuthenticatedClient } from "./auth";

/**
 * Gmail API client wrapper.
 * Provides typed methods for email operations.
 */

function getGmailClient(authClient: Awaited<ReturnType<typeof getAuthenticatedClient>>): gmail_v1.Gmail {
  return google.gmail({ version: "v1", auth: authClient });
}

// ─── Email Fetching ───

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: Date;
}

/**
 * Fetch new emails since the given historyId using incremental sync.
 * Returns only genuinely new messages added to the inbox.
 */
export async function fetchNewEmails(
  userId: string,
  historyId: string
): Promise<{ messages: GmailMessage[]; newHistoryId: string }> {
  const auth = await getAuthenticatedClient(userId);
  const gmail = getGmailClient(auth);

  try {
    const historyResponse = await gmail.users.history.list({
      userId: "me",
      startHistoryId: historyId,
      historyTypes: ["messageAdded"],
      labelId: "INBOX",
    });

    const newHistoryId = historyResponse.data.historyId || historyId;
    const historyRecords = historyResponse.data.history || [];

    // Collect unique message IDs from history
    const messageIds = new Set<string>();
    for (const record of historyRecords) {
      if (record.messagesAdded) {
        for (const added of record.messagesAdded) {
          if (added.message?.id) {
            messageIds.add(added.message.id);
          }
        }
      }
    }

    // Fetch full message details for each new message
    const messages: GmailMessage[] = [];
    for (const msgId of messageIds) {
      const msg = await getEmailById(userId, msgId);
      if (msg) messages.push(msg);
    }

    return { messages, newHistoryId };
  } catch (error: unknown) {
    // If historyId is too old, fall back to listing recent messages
    if (isGmailError(error) && error.code === 404) {
      console.warn("History ID expired, falling back to recent messages");
      return fetchRecentEmails(userId, 10);
    }
    throw error;
  }
}

/**
 * Fetch the N most recent inbox emails (fallback when history sync fails).
 */
export async function fetchRecentEmails(
  userId: string,
  maxResults = 10
): Promise<{ messages: GmailMessage[]; newHistoryId: string }> {
  const auth = await getAuthenticatedClient(userId);
  const gmail = getGmailClient(auth);

  const listResponse = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults,
  });

  const messageList = listResponse.data.messages || [];
  const messages: GmailMessage[] = [];

  for (const msg of messageList) {
    if (msg.id) {
      const fullMsg = await getEmailById(userId, msg.id);
      if (fullMsg) messages.push(fullMsg);
    }
  }

  // Get the current historyId for future incremental sync
  const profile = await gmail.users.getProfile({ userId: "me" });
  const newHistoryId = profile.data.historyId || "0";

  return { messages, newHistoryId };
}

/**
 * Fetch a single email by message ID with full body content.
 */
export async function getEmailById(
  userId: string,
  messageId: string
): Promise<GmailMessage | null> {
  const auth = await getAuthenticatedClient(userId);
  const gmail = getGmailClient(auth);

  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const message = response.data;
  if (!message || !message.id || !message.threadId) return null;

  const headers = message.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

  const body = extractBody(message.payload);
  const internalDate = message.internalDate
    ? new Date(parseInt(message.internalDate))
    : new Date();

  return {
    id: message.id,
    threadId: message.threadId,
    from: getHeader("From"),
    to: getHeader("To"),
    subject: getHeader("Subject"),
    snippet: message.snippet || "",
    body,
    receivedAt: internalDate,
  };
}

/**
 * Get a full email thread.
 */
export async function getEmailThread(
  userId: string,
  threadId: string
): Promise<GmailMessage[]> {
  const auth = await getAuthenticatedClient(userId);
  const gmail = getGmailClient(auth);

  const response = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });

  const messages: GmailMessage[] = [];
  for (const msg of response.data.messages || []) {
    if (!msg.id || !msg.threadId) continue;

    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

    messages.push({
      id: msg.id,
      threadId: msg.threadId,
      from: getHeader("From"),
      to: getHeader("To"),
      subject: getHeader("Subject"),
      snippet: msg.snippet || "",
      body: extractBody(msg.payload),
      receivedAt: msg.internalDate ? new Date(parseInt(msg.internalDate)) : new Date(),
    });
  }

  return messages;
}

// ─── Gmail Watch (Pub/Sub Push Notifications) ───

/**
 * Set up Gmail push notifications via Google Cloud Pub/Sub.
 * Must be renewed every 7 days.
 */
export async function setupGmailWatch(
  userId: string,
  topicName: string
): Promise<{ historyId: string; expiration: string }> {
  const auth = await getAuthenticatedClient(userId);
  const gmail = getGmailClient(auth);

  const response = await gmail.users.watch({
    userId: "me",
    requestBody: {
      labelIds: ["INBOX"],
      topicName,
    },
  });

  return {
    historyId: response.data.historyId || "0",
    expiration: response.data.expiration || "",
  };
}

/**
 * Stop watching for Gmail push notifications.
 */
export async function stopGmailWatch(userId: string): Promise<void> {
  const auth = await getAuthenticatedClient(userId);
  const gmail = getGmailClient(auth);
  await gmail.users.stop({ userId: "me" });
}

// ─── Email Sending ───

/**
 * Send an email via Gmail API.
 */
export async function sendEmail(
  userId: string,
  to: string,
  subject: string,
  body: string,
  inReplyTo?: string,
  threadId?: string
): Promise<string> {
  const auth = await getAuthenticatedClient(userId);
  const gmail = getGmailClient(auth);

  // Build RFC 2822 formatted email
  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
  ];

  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
    headers.push(`References: ${inReplyTo}`);
  }

  const rawMessage = headers.join("\r\n") + "\r\n\r\n" + body;
  const encodedMessage = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
      threadId: threadId || undefined,
    },
  });

  return response.data.id || "";
}

// ─── Helpers ───

/**
 * Extract plain text body from Gmail message payload.
 * Handles both simple and multipart messages.
 */
function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";

  // Simple message with body data directly
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart message — look for text/plain first, then text/html
  if (payload.parts) {
    // First pass: look for text/plain
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }

    // Second pass: look for text/html and strip tags
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        const html = decodeBase64Url(part.body.data);
        return stripHtml(html);
      }
    }

    // Recursive: check nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }

  return "";
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGmailError(error: unknown): error is { code: number; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as Record<string, unknown>).code === "number"
  );
}
