"use client";

import { useEffect, useState } from "react";
import { BellIcon, ClockIcon, RepeatIcon } from "@/components/icons";

/**
 * Reminders page — view active reminders and create new ones via natural language.
 */

interface Reminder {
  id: string;
  text: string;
  triggerAt: string;
  recurrence: string | null;
  status: string;
  source: string;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadReminders() {
    try {
      const res = await fetch("/api/reminders");
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch { /* empty state */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReminders(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setCreating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: "success", text: `Reminder set: "${data.parsed.text}"` });
        setInput("");
        loadReminders();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to create reminder" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ color: "var(--warning)" }}><BellIcon size={26} /></div>
          <div>
            <h1 className="page-title">Reminders</h1>
            <p className="page-subtitle">Set reminders using natural language.</p>
          </div>
        </div>
      </header>

      {/* Create */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.75rem" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Try: "Remind me to learn TypeScript at 4pm" or "Call mom every Sunday at 10am"'
            style={{ flex: 1 }}
            disabled={creating}
          />
          <button type="submit" className="btn btn-primary" disabled={creating || !input.trim()}>
            {creating ? "Setting..." : "Set Reminder"}
          </button>
        </form>
        {message && (
          <div style={{
            marginTop: "0.75rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.8rem",
            background: message.type === "success" ? "var(--success-bg)" : "var(--danger-bg)",
            color: message.type === "success" ? "var(--success)" : "var(--danger)",
          }}>
            {message.text}
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="card">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
              <div className="skeleton" style={{ width: "250px", height: "16px", marginBottom: "6px" }} />
              <div className="skeleton" style={{ width: "150px", height: "12px" }} />
            </div>
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon" style={{ color: "var(--text-muted)" }}>
              <BellIcon size={48} />
            </div>
            <div className="empty-title">No active reminders</div>
            <div className="empty-text">
              Create a reminder above using natural language, or message your
              Telegram bot with something like &quot;remind me to learn at 4pm&quot;.
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {reminders.map((rem) => {
            const triggerDate = new Date(rem.triggerAt);
            const isPast = triggerDate < new Date();
            return (
              <div key={rem.id} style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--border)",
                opacity: isPast ? 0.5 : 1,
              }}>
                <span style={{ color: rem.recurrence ? "var(--accent-secondary)" : "var(--warning)", flexShrink: 0 }}>
                  {rem.recurrence ? <RepeatIcon size={20} /> : <ClockIcon size={20} />}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{rem.text}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "2px" }}>
                    {triggerDate.toLocaleString()}
                    {rem.recurrence && (
                      <span style={{ marginLeft: "0.5rem", color: "var(--accent-secondary)" }}>
                        • Repeats {rem.recurrence}
                      </span>
                    )}
                  </div>
                </div>
                <span className="badge" style={{
                  background: rem.source === "telegram" ? "var(--info-bg)" : "var(--accent-subtle)",
                  color: rem.source === "telegram" ? "var(--info)" : "var(--accent-secondary)",
                }}>
                  {rem.source}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
