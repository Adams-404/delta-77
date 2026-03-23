# EsuX — Project Overview

## What Is EsuX?

EsuX is a modern reimagination of **Esusu** — the traditional West African rotating savings system (also known as Ajo, Adashe, or Susu). The name comes from "Esusu" shortened to "Esu", with "X" representing automation, trust at scale, and a new generation of financial coordination.

EsuX makes it dead simple for groups of people to save money together, hold each other accountable, and automatically disburse funds — with zero trust issues, zero manual tracking, and zero app downloads required.

---

## The Core Problem

Traditional Esusu/Ajo circles run on trust and WhatsApp voice notes. Someone collects cash, someone "forgets" to pay, the organizer is chasing people manually, and when it's time to pay out — there's always drama. There's no record, no accountability, and no enforcement.

EsuX solves all of this.

---

## How It Works

1. An organizer creates a savings circle on the EsuX website or via WhatsApp bot
2. They set the contribution amount, frequency (weekly/monthly), and payout order
3. Members are invited via WhatsApp — they accept or decline with one tap
4. Each member verifies their BVN once (via Interswitch APIs) — no ghost members
5. The bot reminds everyone before deadlines
6. Members pay directly through the bot
7. Every payment is announced to the whole circle in real time
8. When a round completes, the full pot is automatically sent to whoever's turn it is
9. The cycle resets and repeats

---

## Two Interfaces

### 1. WhatsApp Bot
- No app download needed
- Entire savings circle managed through conversation
- Reminders, payments, announcements — all on WhatsApp
- Powered by Gemini AI for natural language understanding

### 2. Web Dashboard (esux.app)
- Landing page explaining the product
- Auth (sign up / log in)
- Create and manage savings circles
- Add/remove members
- View analytics — contributions, balances, round history
- Configure bot behavior
- Chat with the AI assistant directly on the web
- One-click redirect to WhatsApp bot

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Better Auth |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| AI | Google Gemini API |
| WhatsApp | Twilio WhatsApp Business API |
| Payments | Interswitch Bills Payment API |
| Identity | Interswitch BVN Full Details + WhatsApp OTP |
| Transaction Verification | Interswitch Transaction Search API |
| Scheduling | Node-cron (reminders) |
| Deployment | Vercel (frontend) + Railway (bot server) |

---

## Interswitch APIs Used

| API | Purpose |
|---|---|
| BVN Full Details | Verify member identity — no ghost members |
| WhatsApp OTP | Frictionless auth via WhatsApp |
| Bills Payment | Collect contributions + disburse payouts |
| Transaction Search | Confirm payments actually landed |

---

## Business Model (Post-Hackathon)

- **Free:** Up to 1 active circle, 5 members
- **Pro (₦500/month):** Unlimited circles, up to 20 members, analytics
- **Business (₦2,000/month):** Unlimited everything, priority support, custom branding
- **Per-transaction fee:** 0.5% on disbursements above ₦100,000

---

## Target Users

- Office colleagues running monthly Ajo
- Market traders doing weekly contribution pools
- Friends and family saving together for events (weddings, Sallah, Christmas)
- Cooperatives and community groups
- Church/mosque welfare committees

---

## Why EsuX Wins

1. **Zero friction** — works on WhatsApp, which every Nigerian already uses
2. **BVN-anchored trust** — no one can ghost after collecting
3. **Fully automated** — no organizer chasing people
4. **Transparent** — every member sees every payment in real time
5. **Culturally rooted** — Esusu is not a new idea, EsuX just makes it work
