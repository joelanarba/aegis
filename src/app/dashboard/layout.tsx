"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutIcon,
  InboxIcon,
  CalendarIcon,
  EditIcon,
  BellIcon,
  SearchIcon,
  SettingsIcon,
  ZapIcon,
} from "@/components/icons";

/**
 * Shared dashboard layout with sidebar navigation — all SVG icons.
 */

const NAV_ITEMS = [
  { icon: LayoutIcon, label: "Overview", href: "/dashboard" },
  { icon: InboxIcon, label: "Inbox", href: "/dashboard/inbox" },
  { icon: CalendarIcon, label: "Calendar", href: "/dashboard/calendar" },
  { icon: EditIcon, label: "Drafts", href: "/dashboard/drafts" },
  { icon: BellIcon, label: "Reminders", href: "/dashboard/reminders" },
  { icon: SearchIcon, label: "Research", href: "/dashboard/research" },
  { icon: SettingsIcon, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(/aegis_user_email=([^;]+)/);
    if (match) setUserEmail(decodeURIComponent(match[1]));
  }, []);

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 99,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-mark">
            <ZapIcon size={16} />
          </div>
          <span className="sidebar-title">Aegis</span>
        </div>

        <div className="nav-links">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {userEmail ? userEmail[0].toUpperCase() : "?"}
            </div>
            <span className="user-email">{userEmail || "Not signed in"}</span>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="main-content">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {children}
      </main>

      <style>{`
        .sidebar-logo-mark {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--accent-primary) 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .mobile-menu-btn {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 101;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0.5rem;
          color: var(--text-primary);
        }
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
