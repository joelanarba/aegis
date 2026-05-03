import { NextRequest, NextResponse } from "next/server";
import { listUpcomingEvents } from "@/lib/gcalendar";
import { getPendingEvents } from "@/lib/firestore";

/**
 * GET /api/calendar
 * Returns upcoming Google Calendar events + pending events from email extraction.
 */
export async function GET(request: NextRequest) {
  const userId = request.cookies.get("aegis_user_id")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const [calendarEvents, pendingEvents] = await Promise.all([
      listUpcomingEvents(userId, 10).catch(() => []),
      getPendingEvents(userId),
    ]);

    return NextResponse.json({ calendarEvents, pendingEvents });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
