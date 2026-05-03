"use client";

import { useEffect, useState } from "react";
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PinIcon,
  ClockIcon,
} from "@/components/icons";

/**
 * Calendar page — view upcoming events and approve pending events.
 */

interface PendingEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
  description: string | null;
  status: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
}

export default function CalendarPage() {
  const [pending, setPending] = useState<PendingEvent[]>([]);
  const [confirmed, setConfirmed] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((data) => {
        setPending(data.pendingEvents || []);
        setConfirmed(data.calendarEvents || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function approveEvent(eventId: string) {
    setApproving(eventId);
    try {
      const res = await fetch("/api/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) setPending((prev) => prev.filter((e) => e.id !== eventId));
    } catch { /* silently fail */ } finally {
      setApproving(null);
    }
  }

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ color: "var(--warning)" }}><CalendarIcon size={26} /></div>
          <div>
            <h1 className="page-title">Calendar</h1>
            <p className="page-subtitle">Upcoming events and AI-detected meetings to approve.</p>
          </div>
        </div>
      </header>

      {/* Pending events */}
      {pending.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
            Pending Approval ({pending.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pending.map((event) => (
              <div key={event.id} className="card" style={{
                borderColor: "var(--border-accent)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                    {event.title}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <ClockIcon size={13} /> {new Date(event.startTime).toLocaleString()}
                    {event.location && <><PinIcon size={13} /> {event.location}</>}
                  </div>
                  {event.description && (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                      {event.description}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, marginLeft: "1rem" }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => approveEvent(event.id)}
                    disabled={approving === event.id}
                    style={{ gap: "0.3rem" }}
                  >
                    <CheckCircleIcon size={14} />
                    {approving === event.id ? "..." : "Approve"}
                  </button>
                  <button className="btn btn-danger btn-sm" style={{ gap: "0.3rem" }}>
                    <XCircleIcon size={14} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed events */}
      <h2 style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
        Upcoming Events
      </h2>

      {loading ? (
        <div className="card">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
              <div className="skeleton" style={{ width: "200px", height: "16px", marginBottom: "6px" }} />
              <div className="skeleton" style={{ width: "150px", height: "12px" }} />
            </div>
          ))}
        </div>
      ) : confirmed.length === 0 && pending.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon" style={{ color: "var(--text-muted)" }}>
              <CalendarIcon size={48} />
            </div>
            <div className="empty-title">No upcoming events</div>
            <div className="empty-text">
              Events extracted from your emails will appear here for approval.
              Confirmed events from Google Calendar will also show up.
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {confirmed.map((event) => (
            <div key={event.id} style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--border)",
            }}>
              <span style={{ color: "var(--success)", flexShrink: 0 }}><CalendarIcon size={20} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{event.title}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <ClockIcon size={12} /> {new Date(event.start).toLocaleString()}
                  {event.location && <><span style={{ margin: "0 0.25rem" }}>•</span><PinIcon size={12} /> {event.location}</>}
                </div>
              </div>
              <span className="badge badge-routine">confirmed</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
