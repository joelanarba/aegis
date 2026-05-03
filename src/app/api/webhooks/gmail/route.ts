import { NextRequest, NextResponse } from "next/server";
import { fetchNewEmails, fetchRecentEmails } from "@/lib/gmail";
import { storeEmail, getUser, upsertUser, collections } from "@/lib/firestore";

/**
 * POST /api/webhooks/gmail
 *
 * Receives push notifications from Google Cloud Pub/Sub when new emails arrive.
 * The notification contains a historyId — we use it to fetch only new messages.
 *
 * Flow:
 * 1. Validate the Pub/Sub message
 * 2. Decode the notification data (contains emailAddress + historyId)
 * 3. Find the user by email
 * 4. Fetch new emails since last historyId
 * 5. Store each new email in Firestore (status: "queued")
 * 6. Return 200 quickly to acknowledge (Pub/Sub requires fast response)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Pub/Sub sends a message envelope
    const pubsubMessage = body?.message;
    if (!pubsubMessage?.data) {
      return NextResponse.json({ error: "Invalid Pub/Sub message" }, { status: 400 });
    }

    // Decode the base64 data
    const decoded = Buffer.from(pubsubMessage.data, "base64").toString("utf-8");
    const notification = JSON.parse(decoded);

    const emailAddress: string = notification.emailAddress;
    const newHistoryId: string = notification.historyId;

    if (!emailAddress) {
      return NextResponse.json({ error: "No email address in notification" }, { status: 400 });
    }

    console.log(`📧 Gmail notification for ${emailAddress}, historyId: ${newHistoryId}`);

    // Find the user by email address
    const usersSnapshot = await collections
      .users()
      .where("email", "==", emailAddress)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.warn(`No user found for email: ${emailAddress}`);
      return NextResponse.json({ status: "user_not_found" }, { status: 200 });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const user = userDoc.data();

    // Fetch new emails using incremental sync
    let result;
    if (user.lastHistoryId) {
      result = await fetchNewEmails(userId, user.lastHistoryId);
    } else {
      // First time — fetch recent emails
      result = await fetchRecentEmails(userId, 20);
    }

    // Store each new email in Firestore for AI processing
    let storedCount = 0;
    for (const msg of result.messages) {
      // Check for duplicates (by messageId)
      const existing = await collections
        .emails()
        .where("userId", "==", userId)
        .where("messageId", "==", msg.id)
        .limit(1)
        .get();

      if (!existing.empty) continue;

      await storeEmail({
        userId,
        messageId: msg.id,
        threadId: msg.threadId,
        from: msg.from,
        to: msg.to,
        subject: msg.subject,
        snippet: msg.snippet,
        body: msg.body.slice(0, 10000), // Cap body at 10K chars to save Firestore space
        receivedAt: msg.receivedAt,
        processedAt: null,
        triage: null,
        summary: null,
        actionItems: [],
        status: "queued",
      });
      storedCount++;
    }

    // Update the user's lastHistoryId for next incremental sync
    await upsertUser(userId, {
      lastHistoryId: result.newHistoryId,
      updatedAt: new Date(),
    });

    console.log(`✅ Stored ${storedCount} new emails for ${emailAddress}`);

    // Return 200 immediately (Pub/Sub needs fast acknowledgment)
    return NextResponse.json({
      status: "ok",
      emailsStored: storedCount,
    });
  } catch (error) {
    console.error("Gmail webhook error:", error);
    // Still return 200 to prevent Pub/Sub retries for application-level errors
    return NextResponse.json({ status: "error", message: String(error) }, { status: 200 });
  }
}
