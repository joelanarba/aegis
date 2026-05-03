import { google, type calendar_v3 } from "googleapis";
import { getAuthenticatedClient } from "./auth";

/**
 * Google Calendar API client wrapper.
 */

function getCalendarClient(
  authClient: Awaited<ReturnType<typeof getAuthenticatedClient>>
): calendar_v3.Calendar {
  return google.calendar({ version: "v3", auth: authClient });
}

// ─── Event Operations ───

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location: string | null;
  description: string | null;
  htmlLink: string;
}

/**
 * List upcoming events from the user's primary calendar.
 */
export async function listUpcomingEvents(
  userId: string,
  maxResults = 10,
  timeMin?: Date
): Promise<CalendarEvent[]> {
  const auth = await getAuthenticatedClient(userId);
  const calendar = getCalendarClient(auth);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: (timeMin || new Date()).toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items || []).map((event) => ({
    id: event.id || "",
    title: event.summary || "(No title)",
    start: new Date(event.start?.dateTime || event.start?.date || ""),
    end: new Date(event.end?.dateTime || event.end?.date || ""),
    location: event.location || null,
    description: event.description || null,
    htmlLink: event.htmlLink || "",
  }));
}

/**
 * Create a new calendar event.
 */
export async function createCalendarEvent(
  userId: string,
  event: {
    title: string;
    startTime: Date;
    endTime: Date;
    location?: string | null;
    description?: string | null;
    reminders?: { minutes: number }[];
  }
): Promise<{ eventId: string; htmlLink: string }> {
  const auth = await getAuthenticatedClient(userId);
  const calendar = getCalendarClient(auth);

  const eventBody: calendar_v3.Schema$Event = {
    summary: event.title,
    start: { dateTime: event.startTime.toISOString() },
    end: { dateTime: event.endTime.toISOString() },
    location: event.location || undefined,
    description: event.description || undefined,
    reminders: {
      useDefault: false,
      overrides: (event.reminders || [{ minutes: 30 }, { minutes: 10 }]).map((r) => ({
        method: "popup",
        minutes: r.minutes,
      })),
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: eventBody,
  });

  return {
    eventId: response.data.id || "",
    htmlLink: response.data.htmlLink || "",
  };
}

/**
 * Check availability (free/busy) for a time range.
 */
export async function checkAvailability(
  userId: string,
  timeMin: Date,
  timeMax: Date
): Promise<{ busy: boolean; busySlots: { start: Date; end: Date }[] }> {
  const auth = await getAuthenticatedClient(userId);
  const calendar = getCalendarClient(auth);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: "primary" }],
    },
  });

  const busySlots = (response.data.calendars?.primary?.busy || []).map((slot) => ({
    start: new Date(slot.start || ""),
    end: new Date(slot.end || ""),
  }));

  return { busy: busySlots.length > 0, busySlots };
}
