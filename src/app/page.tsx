"use client";

import { useEffect, useState } from "react";

/**
 * Landing page — premium design with navbar, hero, features, how it works, and footer.
 */

// ─── SVG Icon Components ───

function ShieldIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function MailIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function CalendarIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BellIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SearchIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function MessageIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BarChartIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function ZapIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function BrainIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A5.5 5.5 0 0 0 5 6a5 5 0 0 0-1 3 5.5 5.5 0 0 0 2.5 4.6A5.5 5.5 0 0 0 9 18.5V22h2V2z" />
      <path d="M14.5 2A5.5 5.5 0 0 1 19 6a5 5 0 0 1 1 3 5.5 5.5 0 0 1-2.5 4.6A5.5 5.5 0 0 1 15 18.5V22h-2V2z" />
    </svg>
  );
}

function LockIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ArrowRightIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ─── Data ───

const FEATURES = [
  {
    icon: MailIcon,
    title: "Email Intelligence",
    description: "AI reads, classifies, and summarizes your emails. Extracts action items, deadlines, and generates reply drafts automatically.",
    color: "#6c5ce7",
  },
  {
    icon: CalendarIcon,
    title: "Calendar Management",
    description: "Detects meetings and events from your emails, then adds them to Google Calendar — with your approval.",
    color: "#00d2a0",
  },
  {
    icon: BellIcon,
    title: "Smart Reminders",
    description: "Set reminders with natural language. \"Remind me to learn at 4pm\" just works. Supports daily, weekly, and monthly recurrence.",
    color: "#ffa726",
  },
  {
    icon: SearchIcon,
    title: "Web Research",
    description: "Ask any question. Aegis searches the web, synthesizes results from multiple sources, and delivers a cited answer.",
    color: "#29b6f6",
  },
  {
    icon: MessageIcon,
    title: "Telegram Interface",
    description: "Talk to your agent on the go. Check emails, set reminders, trigger research — all from your Telegram chat.",
    color: "#a29bfe",
  },
  {
    icon: BarChartIcon,
    title: "Daily Digests",
    description: "Get a morning briefing with urgent emails, pending action items, upcoming deadlines, and today's schedule.",
    color: "#fd79a8",
  },
];

const STEPS = [
  { number: "01", title: "Connect", description: "Link your Google account. Aegis gets read access to Gmail and Calendar." },
  { number: "02", title: "Process", description: "Every new email is triaged, summarized, and checked for events and deadlines." },
  { number: "03", title: "Act", description: "Review AI drafts, approve calendar events, and get notified via Telegram." },
];

// ─── Component ───

export default function HomePage() {
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      const messages: Record<string, string> = {
        auth_denied: "Authentication was denied. Please try again.",
        no_code: "No authorization code received.",
        token_exchange_failed: "Failed to complete authentication.",
      };
      setError(messages[err] || "An unknown error occurred.");
    }

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing">
      {/* ─── Navbar ─── */}
      <nav className={`landing-nav ${scrolled ? "landing-nav--scrolled" : ""}`}>
        <div className="landing-nav__inner">
          <a href="/" className="landing-nav__brand">
            <div className="landing-nav__logo">
              <ZapIcon size={18} />
            </div>
            <span className="landing-nav__name">Aegis</span>
          </a>
          <div className="landing-nav__links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
          </div>
          <a href="/api/auth/google" className="btn btn-primary btn-sm">
            Get Started
          </a>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />

        <div className="hero__content">
          <div className="hero__badge">
            <BrainIcon size={14} />
            <span>Powered by GPT-4.1</span>
          </div>

          <h1 className="hero__title">
            Your Intelligent<br />
            <span className="hero__title--accent">Digital Extension</span>
          </h1>

          <p className="hero__subtitle">
            Aegis monitors your emails, manages your calendar, drafts replies,
            sets reminders, and keeps you informed — so you can focus on what
            truly matters.
          </p>

          {error && <div className="hero__error">{error}</div>}

          <div className="hero__actions">
            <a href="/api/auth/google" className="btn btn-primary hero__cta">
              <GoogleIcon />
              <span>Connect with Google</span>
              <ArrowRightIcon size={16} />
            </a>
            <a href="#features" className="btn btn-secondary hero__cta-secondary">
              Learn More
            </a>
          </div>

          <div className="hero__trust">
            <LockIcon size={14} />
            <span>AES-256 encrypted &middot; Your data never leaves your cloud</span>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Capabilities</span>
            <h2 className="section-title">Everything You Need,<br />Automated</h2>
            <p className="section-subtitle">
              Six AI-powered systems working together to handle your digital life.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="feature-card">
                  <div
                    className="feature-card__icon"
                    style={{ background: `${feature.color}15`, color: feature.color }}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 className="feature-card__title">{feature.title}</h3>
                  <p className="feature-card__desc">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="how-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Process</span>
            <h2 className="section-title">Three Steps to Peace of Mind</h2>
          </div>

          <div className="steps-grid">
            {STEPS.map((step, i) => (
              <div key={step.number} className="step-card">
                <div className="step-card__number">{step.number}</div>
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__desc">{step.description}</p>
                {i < STEPS.length - 1 && (
                  <div className="step-card__connector">
                    <ArrowRightIcon size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-card">
            <div className="cta-card__glow" />
            <h2 className="cta-card__title">Ready to Reclaim Your Time?</h2>
            <p className="cta-card__desc">
              Connect your Google account and let Aegis handle the noise.
            </p>
            <a href="/api/auth/google" className="btn btn-primary hero__cta">
              <GoogleIcon />
              <span>Get Started Free</span>
              <ArrowRightIcon size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__brand">
            <div className="landing-nav__logo" style={{ width: 28, height: 28, fontSize: "0.7rem" }}>
              <ZapIcon size={14} />
            </div>
            <span className="landing-nav__name" style={{ fontSize: "1rem" }}>Aegis</span>
          </div>
          <p className="landing-footer__tagline">
            Your personal AI agent — monitoring, summarizing, and acting on your behalf.
          </p>
          <div className="landing-footer__links">
            <a href="/dashboard">Dashboard</a>
            <span className="landing-footer__dot">&middot;</span>
            <a href="#features">Features</a>
            <span className="landing-footer__dot">&middot;</span>
            <a href="#how-it-works">How It Works</a>
          </div>
          <div className="landing-footer__copy">
            &copy; {new Date().getFullYear()} Aegis. Built with Next.js, Firebase &amp; OpenAI.
          </div>
        </div>
      </footer>
    </div>
  );
}
