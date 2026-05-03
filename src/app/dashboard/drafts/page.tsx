"use client";

import { useEffect, useState } from "react";
import { EditIcon, SendIcon, XCircleIcon } from "@/components/icons";

/**
 * Drafts page — review, edit, and approve AI-generated reply drafts.
 */

interface Draft {
  id: string;
  emailId: string;
  content: string;
  tone: string;
  status: string;
  createdAt: string;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Drafts endpoint doesn't exist yet — using empty state for now
    setLoading(false);
    setDrafts([]);
  }, []);

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ color: "var(--success)" }}><EditIcon size={26} /></div>
          <div>
            <h1 className="page-title">Drafts</h1>
            <p className="page-subtitle">AI-generated reply drafts awaiting your review.</p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="card">
          {[1, 2].map((i) => (
            <div key={i} style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)" }}>
              <div className="skeleton" style={{ width: "200px", height: "16px", marginBottom: "8px" }} />
              <div className="skeleton" style={{ width: "100%", height: "60px" }} />
            </div>
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon" style={{ color: "var(--text-muted)" }}>
              <EditIcon size={48} />
            </div>
            <div className="empty-title">No pending drafts</div>
            <div className="empty-text">
              When Aegis processes an email that needs a reply, it will generate
              draft responses here for you to review, edit, and approve before sending.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {drafts.map((draft) => (
            <div key={draft.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span className="badge" style={{
                  background: draft.tone === "professional" ? "var(--info-bg)" : "var(--accent-subtle)",
                  color: draft.tone === "professional" ? "var(--info)" : "var(--accent-secondary)",
                }}>
                  {draft.tone}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  {new Date(draft.createdAt).toLocaleString()}
                </span>
              </div>

              <div style={{
                background: "var(--bg-glass)",
                borderRadius: "var(--radius-sm)",
                padding: "1rem",
                fontSize: "0.85rem",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                marginBottom: "1rem",
              }}>
                {draft.content}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button className="btn btn-secondary btn-sm" style={{ gap: "0.3rem" }}>
                  <EditIcon size={14} /> Edit
                </button>
                <button className="btn btn-danger btn-sm" style={{ gap: "0.3rem" }}>
                  <XCircleIcon size={14} /> Reject
                </button>
                <button className="btn btn-success btn-sm" style={{ gap: "0.3rem" }}>
                  <SendIcon size={14} /> Send
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
