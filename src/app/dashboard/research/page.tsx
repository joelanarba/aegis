"use client";

import { useState } from "react";
import { SearchIcon, GlobeIcon, LinkIcon } from "@/components/icons";

/**
 * Research page — submit queries and get AI-synthesized web search results.
 */

interface ResearchResult {
  query: string;
  synthesis: string;
  sources: { title: string; url: string }[];
}

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const data = await res.json();
        setError(data.error || "Research failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ color: "var(--info)" }}><SearchIcon size={26} /></div>
          <div>
            <h1 className="page-title">Research</h1>
            <p className="page-subtitle">Search the web and get AI-synthesized answers.</p>
          </div>
        </div>
      </header>

      {/* Search form */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <div style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
              <SearchIcon size={16} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to research?"
              style={{ width: "100%", paddingLeft: "2.5rem" }}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !query.trim()}
          >
            {loading ? "Searching..." : "Research"}
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
          <div className="animate-pulse" style={{ color: "var(--accent-secondary)", marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
            <GlobeIcon size={40} />
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Searching the web and synthesizing results...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card" style={{
          borderColor: "rgba(255, 82, 82, 0.3)",
          background: "var(--danger-bg)",
        }}>
          <p style={{ color: "var(--danger)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>⚠️</span> {error}
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="card animate-fade-in">
          <h3 style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}>
            <SearchIcon size={14} /> Results for &quot;{result.query}&quot;
          </h3>

          <div style={{
            fontSize: "0.9rem",
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            marginBottom: "2rem",
          }}>
            {result.synthesis}
          </div>

          {result.sources.length > 0 && (
            <div>
              <h4 style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}>
                <LinkIcon size={14} /> Sources
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {result.sources.map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 1rem",
                      background: "var(--bg-glass)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.85rem",
                      color: "var(--accent-secondary)",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-glass)")}
                  >
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontWeight: 500 }}>{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && !error && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon" style={{ color: "var(--text-muted)" }}>
              <GlobeIcon size={48} />
            </div>
            <div className="empty-title">Ask anything</div>
            <div className="empty-text">
              Enter a research query above. Aegis will search the web and synthesize
              the results into a clear, cited answer.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
