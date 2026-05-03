"use client";

import { useEffect, useState } from "react";
import {
  InboxIcon,
  AlertCircleIcon,
  PinIcon,
  ClockIcon,
} from "@/components/icons";

/**
 * Inbox page — processed emails with priority, summary, and action items.
 */

interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  summary: string | null;
  receivedAt: string;
  triage: {
    priority: string;
    category: string;
    requiresReply: boolean;
  } | null;
  actionItems: { text: string; deadline: string | null; type: string }[];
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  useEffect(() => {
    fetch("/api/emails?limit=30")
      .then((r) => r.json())
      .then((data) => setEmails(data.emails || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ color: "var(--accent-secondary)" }}><InboxIcon size={26} /></div>
          <div>
            <h1 className="page-title">Inbox</h1>
            <p className="page-subtitle">AI-processed emails with summaries and action items.</p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="card">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <div className="skeleton" style={{ width: "200px", height: "16px", marginBottom: "8px" }} />
              <div className="skeleton" style={{ width: "300px", height: "14px", marginBottom: "6px" }} />
              <div className="skeleton" style={{ width: "100%", height: "12px" }} />
            </div>
          ))}
        </div>
      ) : emails.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon" style={{ color: "var(--text-muted)" }}>
              <InboxIcon size={48} />
            </div>
            <div className="empty-title">No emails yet</div>
            <div className="empty-text">
              Once Gmail push notifications are configured, your emails will appear here
              with AI-generated summaries and priority classification.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "1rem" }}>
          {/* Email list */}
          <div className="card" style={{ flex: 1, padding: 0, overflow: "hidden" }}>
            {emails.map((email) => (
              <div
                key={email.id}
                className="email-item"
                onClick={() => setSelectedEmail(email)}
                style={{
                  background: selectedEmail?.id === email.id ? "var(--bg-card-hover)" : undefined,
                }}
              >
                <div className={`email-priority ${email.triage?.priority || "routine"}`} />
                <div className="email-content">
                  <div className="email-header">
                    <span className="email-from">{email.from.split("<")[0].trim()}</span>
                    <span className="email-time">
                      {new Date(email.receivedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="email-subject">{email.subject}</div>
                  <div className="email-summary">
                    {email.summary || email.snippet}
                  </div>
                  <div className="email-tags">
                    {email.triage && (
                      <span className={`badge badge-${email.triage.priority}`}>
                        {email.triage.priority}
                      </span>
                    )}
                    {email.triage?.category && (
                      <span className="badge" style={{
                        background: "var(--bg-glass-strong)",
                        color: "var(--text-secondary)",
                      }}>
                        {email.triage.category}
                      </span>
                    )}
                    {email.triage?.requiresReply && (
                      <span className="badge" style={{
                        background: "var(--info-bg)",
                        color: "var(--info)",
                      }}>
                        needs reply
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selectedEmail && (
            <div className="card animate-slide-in" style={{ width: "380px", flexShrink: 0, alignSelf: "flex-start" }}>
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                  {selectedEmail.subject}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  From: {selectedEmail.from}
                </p>
              </div>

              {selectedEmail.summary && (
                <div style={{ marginBottom: "1rem" }}>
                  <h4 style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                    Summary
                  </h4>
                  <p style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                    {selectedEmail.summary}
                  </p>
                </div>
              )}

              {selectedEmail.actionItems.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                    Action Items
                  </h4>
                  {selectedEmail.actionItems.map((item, i) => (
                    <div key={i} style={{
                      display: "flex",
                      gap: "0.5rem",
                      padding: "0.5rem",
                      background: "var(--bg-glass)",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "0.5rem",
                      fontSize: "0.8rem",
                    }}>
                      <span style={{ color: "var(--accent-secondary)", flexShrink: 0, marginTop: "1px" }}>
                        <PinIcon size={14} />
                      </span>
                      <div>
                        <div>{item.text}</div>
                        {item.deadline && (
                          <div style={{ color: "var(--warning)", fontSize: "0.7rem", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <ClockIcon size={11} /> {item.deadline}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: "1rem", width: "100%" }}
                onClick={() => setSelectedEmail(null)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
