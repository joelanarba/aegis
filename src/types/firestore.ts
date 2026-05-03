import type { Timestamp } from "firebase-admin/firestore";

// ─── User ───

export interface UserDoc {
  email: string;
  googleAccessToken: string; // encrypted
  googleRefreshToken: string; // encrypted
  tokenExpiresAt: Timestamp | Date;
  lastHistoryId: string | null;
  preferences: UserPreferences;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface UserPreferences {
  timezone: string;
  digestFrequency: "hourly" | "every4hours" | "daily";
  digestTime: string; // e.g. "08:00"
  notifyUrgent: boolean;
  telegramChatId: string | null;
  replyTone: "mirror" | "professional" | "both";
}

// ─── Email ───

export type EmailPriority = "urgent" | "important" | "routine" | "low" | "spam";
export type EmailCategory = "work" | "personal" | "financial" | "subscription" | "social" | "other";
export type EmailStatus = "queued" | "processing" | "processed" | "archived" | "error";

export interface EmailTriage {
  priority: EmailPriority;
  category: EmailCategory;
  requiresReply: boolean;
  hasDeadline: boolean;
  hasEvent: boolean;
  confidence: number; // 0-1
}

export interface ActionItem {
  text: string;
  deadline: string | null;
  type: "task" | "deadline" | "request" | "follow-up";
}

export interface EmailRecord {
  userId: string;
  messageId: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: Timestamp | Date;
  processedAt: Timestamp | Date | null;
  triage: EmailTriage | null;
  summary: string | null;
  actionItems: ActionItem[];
  status: EmailStatus;
}

// ─── Draft ───

export type DraftStatus = "pending" | "approved" | "sent" | "rejected" | "edited";

export interface DraftRecord {
  userId: string;
  emailId: string;
  content: string;
  tone: "mirror" | "professional";
  status: DraftStatus;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// ─── Pending Event ───

export type PendingEventStatus = "pending" | "approved" | "rejected";

export interface PendingEventRecord {
  userId: string;
  sourceEmailId: string | null;
  title: string;
  startTime: Timestamp | Date;
  endTime: Timestamp | Date;
  location: string | null;
  description: string | null;
  status: PendingEventStatus;
  googleEventId: string | null;
  createdAt: Timestamp | Date;
}

// ─── Reminder ───

export type ReminderRecurrence = "daily" | "weekly" | "monthly" | null;
export type ReminderStatus = "active" | "fired" | "cancelled";
export type ReminderSource = "telegram" | "dashboard";

export interface ReminderRecord {
  userId: string;
  text: string;
  triggerAt: Timestamp | Date;
  recurrence: ReminderRecurrence;
  source: ReminderSource;
  status: ReminderStatus;
  googleEventId: string | null;
  createdAt: Timestamp | Date;
}

// ─── Digest ───

export interface DigestRecord {
  userId: string;
  generatedAt: Timestamp | Date;
  summary: string;
  urgentItems: string[];
  actionItems: string[];
  upcomingDeadlines: string[];
  dueReminders: string[];
  sentVia: "telegram" | "dashboard" | "both";
}

// ─── Agent Action Log ───

export interface AgentActionRecord {
  userId: string;
  type: "triage" | "summarize" | "draft" | "extract_event" | "reminder" | "research" | "digest" | "command";
  input: string;
  output: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
  timestamp: Timestamp | Date;
}
