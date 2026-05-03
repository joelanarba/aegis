"use client";

import { useEffect, useState } from "react";
import {
  MailIcon,
  EditIcon,
  CalendarIcon,
  BellIcon,
  RocketIcon,
  CheckCircleIcon,
  SquareIcon,
} from "@/components/icons";

/**
 * Dashboard Overview — stat cards + setup status.
 */

interface DashboardStats {
  emails: number;
  drafts: number;
  events: number;
  reminders: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ emails: 0, drafts: 0, events: 0, reminders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [emailsRes, remindersRes, calendarRes] = await Promise.all([
          fetch("/api/emails?limit=50").then((r) => r.json()).catch(() => ({ emails: [] })),
          fetch("/api/reminders").then((r) => r.json()).catch(() => ({ reminders: [] })),
          fetch("/api/calendar").then((r) => r.json()).catch(() => ({ pendingEvents: [] })),
        ]);
        setStats({
          emails: emailsRes.emails?.length || 0,
          drafts: 0,
          events: calendarRes.pendingEvents?.length || 0,
          reminders: remindersRes.reminders?.length || 0,
        });
      } catch {
        // Dashboard works even without backend
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { label: "Processed Emails", value: stats.emails, icon: MailIcon, color: "#6c5ce7" },
    { label: "Pending Drafts", value: stats.drafts, icon: EditIcon, color: "#00d2a0" },
    { label: "Pending Events", value: stats.events, icon: CalendarIcon, color: "#ffa726" },
    { label: "Active Reminders", value: stats.reminders, icon: BellIcon, color: "#29b6f6" },
  ];

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Good {getTimeOfDay()}</h1>
        <p className="page-subtitle">Here&apos;s what needs your attention today.</p>
      </header>

      {/* Stat cards */}
      <div className="stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div className="stat-icon" style={{ color: card.color }}>
                <Icon size={24} />
              </div>
              <div className="stat-value">
                {loading ? (
                  <div className="skeleton" style={{ width: "40px", height: "32px" }} />
                ) : (
                  card.value
                )}
              </div>
              <div className="stat-label">{card.label}</div>
              <div
                className="stat-accent"
                style={{
                  background: `linear-gradient(135deg, ${card.color}40 0%, transparent 100%)`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Status panel */}
      <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
        <div style={{ color: "var(--accent-primary)", marginBottom: "1rem" }}>
          <RocketIcon size={40} />
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          System Connected
        </h2>
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "0.9rem",
          lineHeight: 1.7,
          maxWidth: "500px",
          margin: "0 auto 1.5rem",
        }}>
          Aegis is running. Once Gmail Pub/Sub is configured, your emails will be
          processed automatically. Use the Telegram bot to interact with your agent on
          the go.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
          {[
            { done: true, text: "Google Account Connected" },
            { done: false, text: "Gmail Push Notifications" },
            { done: false, text: "Telegram Bot Linked" },
          ].map((step) => (
            <div
              key={step.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.85rem",
                color: step.done ? "var(--success)" : "var(--text-secondary)",
              }}
            >
              {step.done ? <CheckCircleIcon size={16} /> : <SquareIcon size={16} />}
              <span>{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
