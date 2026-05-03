# AGENTS.md — Aegis Project Conventions

## Project Overview
Aegis is a personal AI agent built on Next.js + Firebase + Vercel. It monitors emails, manages calendar, handles reminders, and provides a Telegram bot interface.

## Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Firebase Firestore
- **Auth**: Google OAuth2 (tokens encrypted with AES-256)
- **AI**: OpenAI GPT-4.1-nano (cost-optimized) / GPT-4.1-mini (quality tasks)
- **Notifications**: Telegram Bot API
- **Hosting**: Vercel (serverless)

## Architecture Patterns
- All AI agents live in `src/agents/` and use structured outputs via Zod schemas
- All external API clients live in `src/lib/`
- API routes use the Next.js App Router pattern (`route.ts`)
- Cron endpoints are protected with `CRON_SECRET` bearer token
- User auth is handled via httpOnly cookies (`aegis_user_id`)
- Firestore types are defined in `src/types/firestore.ts`

## Coding Conventions
- Use `async/await` everywhere (no `.then()` chains)
- Validate all inputs with Zod
- Log agent actions via `logAgentAction()` for cost tracking
- Keep serverless functions under 10s execution time
- Cap email body storage at 10,000 characters
- Use `structuredCompletion()` for AI calls that need JSON output
- Use `textCompletion()` for free-form text generation (drafts, research)

## Environment Variables
All env vars are validated at startup via `src/lib/config.ts`. See `.env.local.example` for the full list.
