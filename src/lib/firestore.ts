import { getFirebaseAdmin } from "./firebase";
import type {
  UserDoc,
  EmailRecord,
  DraftRecord,
  PendingEventRecord,
  ReminderRecord,
  DigestRecord,
  AgentActionRecord,
} from "@/types/firestore";

/**
 * Firestore collection references with typed helpers.
 * Centralizes all database access patterns.
 */

function getDb() {
  return getFirebaseAdmin().db;
}

// ─── Collection References ───

export const collections = {
  users: () => getDb().collection("users"),
  emails: () => getDb().collection("emails"),
  drafts: () => getDb().collection("drafts"),
  pendingEvents: () => getDb().collection("pendingEvents"),
  reminders: () => getDb().collection("reminders"),
  digests: () => getDb().collection("digests"),
  agentActions: () => getDb().collection("agentActions"),
};

// ─── User Helpers ───

export async function getUser(userId: string): Promise<UserDoc | null> {
  const doc = await collections.users().doc(userId).get();
  return doc.exists ? (doc.data() as UserDoc) : null;
}

export async function upsertUser(userId: string, data: Partial<UserDoc>): Promise<void> {
  await collections.users().doc(userId).set(data, { merge: true });
}

// ─── Email Helpers ───

export async function storeEmail(data: EmailRecord): Promise<string> {
  const ref = await collections.emails().add({
    ...data,
    processedAt: null,
    status: "queued",
  });
  return ref.id;
}

export async function getQueuedEmails(userId: string, limit = 10) {
  const snapshot = await collections
    .emails()
    .where("userId", "==", userId)
    .where("status", "==", "queued")
    .orderBy("receivedAt", "asc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as EmailRecord & { id: string }));
}

export async function getProcessedEmails(userId: string, limit = 20) {
  const snapshot = await collections
    .emails()
    .where("userId", "==", userId)
    .where("status", "==", "processed")
    .orderBy("receivedAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as EmailRecord & { id: string }));
}

export async function updateEmail(emailId: string, data: Partial<EmailRecord>): Promise<void> {
  await collections.emails().doc(emailId).update(data);
}

// ─── Draft Helpers ───

export async function storeDraft(data: DraftRecord): Promise<string> {
  const ref = await collections.drafts().add(data);
  return ref.id;
}

export async function getPendingDrafts(userId: string) {
  const snapshot = await collections
    .drafts()
    .where("userId", "==", userId)
    .where("status", "==", "pending")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DraftRecord & { id: string }));
}

export async function updateDraft(draftId: string, data: Partial<DraftRecord>): Promise<void> {
  await collections.drafts().doc(draftId).update(data);
}

// ─── Pending Event Helpers ───

export async function storePendingEvent(data: PendingEventRecord): Promise<string> {
  const ref = await collections.pendingEvents().add(data);
  return ref.id;
}

export async function getPendingEvents(userId: string) {
  const snapshot = await collections
    .pendingEvents()
    .where("userId", "==", userId)
    .where("status", "==", "pending")
    .orderBy("startTime", "asc")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PendingEventRecord & { id: string }));
}

export async function updatePendingEvent(eventId: string, data: Partial<PendingEventRecord>): Promise<void> {
  await collections.pendingEvents().doc(eventId).update(data);
}

// ─── Reminder Helpers ───

export async function storeReminder(data: ReminderRecord): Promise<string> {
  const ref = await collections.reminders().add(data);
  return ref.id;
}

export async function getActiveReminders(userId: string) {
  const snapshot = await collections
    .reminders()
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .orderBy("triggerAt", "asc")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ReminderRecord & { id: string }));
}

export async function getDueReminders(now: Date) {
  const snapshot = await collections
    .reminders()
    .where("status", "==", "active")
    .where("triggerAt", "<=", now)
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ReminderRecord & { id: string }));
}

export async function updateReminder(reminderId: string, data: Partial<ReminderRecord>): Promise<void> {
  await collections.reminders().doc(reminderId).update(data);
}

// ─── Digest Helpers ───

export async function storeDigest(data: DigestRecord): Promise<string> {
  const ref = await collections.digests().add(data);
  return ref.id;
}

// ─── Agent Action Log ───

export async function logAgentAction(data: AgentActionRecord): Promise<void> {
  await collections.agentActions().add(data);
}
