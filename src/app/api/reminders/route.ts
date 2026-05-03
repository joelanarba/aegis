import { NextRequest, NextResponse } from "next/server";
import { getActiveReminders, storeReminder } from "@/lib/firestore";
import { parseReminder } from "@/agents/reminder-parser";
import { getUser } from "@/lib/firestore";

/**
 * GET /api/reminders — List active reminders
 * POST /api/reminders — Create a reminder from natural language
 */
export async function GET(request: NextRequest) {
  const userId = request.cookies.get("aegis_user_id")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const reminders = await getActiveReminders(userId);
  return NextResponse.json({ reminders });
}

export async function POST(request: NextRequest) {
  const userId = request.cookies.get("aegis_user_id")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { text } = await request.json();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const user = await getUser(userId);
  const timezone = user?.preferences?.timezone || "UTC";

  const parsed = await parseReminder(userId, text, timezone);

  if (!parsed.understood) {
    return NextResponse.json({ error: "Could not parse reminder", parsed }, { status: 400 });
  }

  const id = await storeReminder({
    userId,
    text: parsed.text,
    triggerAt: new Date(parsed.triggerAt),
    recurrence: parsed.recurrence === "none" ? null : parsed.recurrence,
    source: "dashboard",
    status: "active",
    googleEventId: null,
    createdAt: new Date(),
  });

  return NextResponse.json({ id, parsed });
}
