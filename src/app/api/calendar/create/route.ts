import { NextRequest, NextResponse } from "next/server";
import { updatePendingEvent, collections } from "@/lib/firestore";
import { createCalendarEvent } from "@/lib/gcalendar";

/**
 * POST /api/calendar/create
 *
 * Approves a pending event and creates it in Google Calendar.
 * Human-in-the-loop: user explicitly approves before creation.
 *
 * Body: { eventId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("aegis_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { eventId } = await request.json();
    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    // Fetch the pending event
    const eventDoc = await collections.pendingEvents().doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventData = eventDoc.data();
    if (!eventData || eventData.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (eventData.status !== "pending") {
      return NextResponse.json({ error: "Event already processed" }, { status: 409 });
    }

    // Create the event in Google Calendar
    const result = await createCalendarEvent(userId, {
      title: eventData.title,
      startTime: eventData.startTime.toDate ? eventData.startTime.toDate() : new Date(eventData.startTime),
      endTime: eventData.endTime.toDate ? eventData.endTime.toDate() : new Date(eventData.endTime),
      location: eventData.location,
      description: eventData.description,
    });

    // Update the pending event status
    await updatePendingEvent(eventId, {
      status: "approved",
      googleEventId: result.eventId,
    });

    return NextResponse.json({
      status: "created",
      googleEventId: result.eventId,
      calendarLink: result.htmlLink,
    });
  } catch (error) {
    console.error("Calendar create error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
