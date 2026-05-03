import { NextRequest, NextResponse } from "next/server";
import { getDueReminders, updateReminder, storeReminder, getUser } from "@/lib/firestore";
import { sendReminderNotification } from "@/lib/telegram";
import { createCalendarEvent } from "@/lib/gcalendar";

/**
 * POST /api/cron/check-reminders
 *
 * Checks for due reminders and fires notifications.
 * Should be called every 1-5 minutes via an external cron service.
 *
 * Protected by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const dueReminders = await getDueReminders(now);

    if (dueReminders.length === 0) {
      return NextResponse.json({ status: "ok", fired: 0 });
    }

    let fired = 0;

    for (const reminder of dueReminders) {
      try {
        // Get user's Telegram chat ID
        const user = await getUser(reminder.userId);
        if (!user) continue;

        const chatId = user.preferences?.telegramChatId;

        // Send Telegram notification
        if (chatId) {
          await sendReminderNotification(chatId, reminder.text);
        }

        // Handle recurrence
        if (reminder.recurrence) {
          // Create next occurrence
          const nextTrigger = calculateNextTrigger(
            reminder.triggerAt instanceof Date
              ? reminder.triggerAt
              : (reminder.triggerAt as { toDate: () => Date }).toDate(),
            reminder.recurrence
          );

          // Store new reminder for next occurrence
          await storeReminder({
            userId: reminder.userId,
            text: reminder.text,
            triggerAt: nextTrigger,
            recurrence: reminder.recurrence,
            source: reminder.source,
            status: "active",
            googleEventId: null,
            createdAt: new Date(),
          });
        }

        // Mark current reminder as fired
        await updateReminder(reminder.id, { status: "fired" });
        fired++;
      } catch (err) {
        console.error(`Failed to fire reminder ${reminder.id}:`, err);
      }
    }

    return NextResponse.json({ status: "ok", fired, total: dueReminders.length });
  } catch (error) {
    console.error("Check reminders error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * Calculate the next trigger time for a recurring reminder.
 */
function calculateNextTrigger(
  currentTrigger: Date,
  recurrence: "daily" | "weekly" | "monthly"
): Date {
  const next = new Date(currentTrigger);

  switch (recurrence) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next;
}

export async function GET(request: NextRequest) {
  return POST(request);
}
