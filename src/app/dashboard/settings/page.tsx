"use client";

import { useState } from "react";
import {
  SettingsIcon,
  MessageSquareIcon,
  LayoutIcon,
  AlertCircleIcon,
  RefreshIcon
} from "@/components/icons";

/**
 * Settings page — configure Telegram, timezone, preferences.
 */

export default function SettingsPage() {
  const [chatId, setChatId] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [digestFreq, setDigestFreq] = useState("daily");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Save preferences to API
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ color: "var(--text-secondary)" }}><SettingsIcon size={26} /></div>
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Configure your Aegis agent preferences.</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "600px" }}>
        {/* Telegram */}
        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "var(--info)" }}><MessageSquareIcon size={18} /></span> Telegram Bot
          </h3>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.375rem", fontWeight: 500 }}>
              Telegram Chat ID
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Your Telegram chat ID (get from @userinfobot)"
              style={{ width: "100%" }}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Message <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer">@userinfobot</a> on Telegram to get your Chat ID.
            </p>
          </div>
        </div>

        {/* Preferences */}
        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "var(--accent-secondary)" }}><LayoutIcon size={18} /></span> Preferences
          </h3>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.375rem", fontWeight: 500 }}>
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Berlin">Berlin (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Africa/Accra">Accra (GMT)</option>
              <option value="Africa/Lagos">Lagos (WAT)</option>
            </select>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.375rem", fontWeight: 500 }}>
              Digest Frequency
            </label>
            <select
              value={digestFreq}
              onChange={(e) => setDigestFreq(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="hourly">Every hour</option>
              <option value="every4hours">Every 4 hours</option>
              <option value="daily">Daily (morning)</option>
            </select>
          </div>
        </div>

        {/* Danger zone */}
        <div className="card" style={{ borderColor: "rgba(255, 82, 82, 0.2)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircleIcon size={18} /> Connections
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
            Re-authenticate to refresh your Google OAuth tokens or fix connection issues.
          </p>
          <a href="/api/auth/google" className="btn btn-secondary btn-sm" style={{ gap: "0.5rem", display: "inline-flex" }}>
            <RefreshIcon size={14} /> Re-connect Google Account
          </a>
        </div>

        {/* Save */}
        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}>
          {saved ? "✓ Saved successfully" : "Save Settings"}
        </button>
      </form>
    </>
  );
}
