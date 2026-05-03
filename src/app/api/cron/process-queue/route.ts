import { NextRequest, NextResponse } from "next/server";
import { getQueuedEmails, updateEmail, storePendingEvent, storeDraft, getUser } from "@/lib/firestore";
import { triageEmail } from "@/agents/triage";
import { summarizeEmail } from "@/agents/summarizer";
import { extractEventsFromEmail } from "@/agents/event-extractor";
import { generateDraftReply } from "@/agents/draft-reply";

/**
 * POST /api/cron/process-queue
 *
 * Processes queued emails through the full AI pipeline:
 * 1. Triage (classify priority + category)
 * 2. Summarize (extract key info + action items)
 * 3. Event extraction (detect meetings, deadlines)
 * 4. Draft reply (if email requires a response)
 *
 * Protected by CRON_SECRET to prevent unauthorized access.
 * Called by external cron service or Vercel cron.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { collections } = await import("@/lib/firestore");
    const userIdParam = request.nextUrl.searchParams.get("userId");
    
    let usersToProcess = [];
    if (userIdParam) {
      usersToProcess.push(userIdParam);
    } else {
      const usersSnap = await collections.users().get();
      usersSnap.forEach(doc => usersToProcess.push(doc.id));
    }

    if (usersToProcess.length === 0) {
      return NextResponse.json({ status: "ok", processed: 0 });
    }

    let totalProcessed = 0;

    for (const userId of usersToProcess) {
      const user = await getUser(userId);
      if (!user) continue;

      const timezone = user.preferences?.timezone || "UTC";

      // Fetch queued emails
      const queuedEmails = await getQueuedEmails(userId, 5); // Process 5 at a time to stay within timeout
      if (queuedEmails.length === 0) continue;

    let processed = 0;

    for (const email of queuedEmails) {
      try {
        // Mark as processing
        await updateEmail(email.id, { status: "processing" });

        const emailData = {
          from: email.from,
          subject: email.subject,
          snippet: email.snippet,
          body: email.body,
        };

        // Step 1: Triage
        const triage = await triageEmail(userId, emailData);

        // Step 2: Summarize
        const summary = await summarizeEmail(userId, emailData);

        // Step 3: Extract events (only if triage detected potential events)
        if (triage.hasEvent || triage.hasDeadline) {
          const events = await extractEventsFromEmail(userId, emailData, timezone);

          if (events.eventsFound) {
            for (const event of events.events) {
              if (event.confidence >= 0.6) {
                await storePendingEvent({
                  userId,
                  sourceEmailId: email.id,
                  title: event.title,
                  startTime: new Date(event.startTime),
                  endTime: new Date(event.endTime),
                  location: event.location,
                  description: event.description,
                  status: "pending",
                  googleEventId: null,
                  createdAt: new Date(),
                });
              }
            }
          }
        }

        // Step 4: Generate draft reply (if email requires one)
        if (triage.requiresReply && triage.priority !== "spam" && triage.priority !== "low") {
          const replyTone = user.preferences?.replyTone || "professional";

          // Generate professional draft
          const professionalDraft = await generateDraftReply({
            userId,
            originalEmail: emailData,
            tone: "professional",
          });

          await storeDraft({
            userId,
            emailId: email.id,
            content: professionalDraft,
            tone: "professional",
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // If user wants both tones, also generate mirror style
          if (replyTone === "both" || replyTone === "mirror") {
            const mirrorDraft = await generateDraftReply({
              userId,
              originalEmail: emailData,
              tone: "mirror",
            });

            await storeDraft({
              userId,
              emailId: email.id,
              content: mirrorDraft,
              tone: "mirror",
              status: "pending",
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        // Update email with all results
        await updateEmail(email.id, {
          triage: {
            priority: triage.priority,
            category: triage.category,
            requiresReply: triage.requiresReply,
            hasDeadline: triage.hasDeadline,
            hasEvent: triage.hasEvent,
            confidence: triage.confidence,
          },
          summary: summary.summary,
          actionItems: summary.actionItems,
          processedAt: new Date(),
          status: "processed",
        });

        // Instant Notification for Urgent Emails
        if ((triage.priority === "urgent" || triage.priority === "important") && user.preferences?.notifyUrgent !== false) {
          const chatId = user.preferences?.telegramChatId;
          if (chatId) {
            const { sendUrgentEmailAlert } = await import("@/lib/telegram");
            await sendUrgentEmailAlert(chatId, {
              from: email.from,
              subject: email.subject,
              summary: summary.summary
            });
          }
        }

        processed++;
      } catch (emailError) {
        console.error(`Failed to process email ${email.id}:`, emailError);
        await updateEmail(email.id, { status: "error" });
      }

      totalProcessed += processed;
    }

    return NextResponse.json({ status: "ok", processed: totalProcessed });
  } catch (error) {
    console.error("Process queue error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
