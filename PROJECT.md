# EsuX — Project Overview

## What Is EsuX?

EsuX is a modern reimagination of **Esusu** — the traditional West African rotating savings system (also known as Ajo, Adashe, or Susu). The name comes from "Esusu" shortened to "Esu", with "X" representing automation, trust at scale, and a new generation of financial coordination.

EsuX makes it dead simple for groups of people to save money together, hold each other accountable, and automatically disburse funds — with zero trust issues, zero manual tracking, and zero app downloads required.

---

## The Core Problem

Traditional Esusu/Ajo circles run on trust and WhatsApp voice notes. Someone collects cash, someone "forgets" to pay, the organizer is chasing people manually, and when it's time to pay out — there's always drama. There's no record, no accountability, and no enforcement.

EsuX solves all of this.

---

## Journey of an EsuX User (The Lifecycle)

1. **Onboarding**: A user signs up on the dashboard and verifies their Identitiy (BVN).
2. **On-Ramp**: They create a savings circle or join one via an invite code.
3. **WhatsApp Linkage**: The user's phone number acts as their "Financial Passport".
4. **Active Phase (The Rotation)**:
   - Every period (weekly/monthly), the **AI Agent** checks the ledger.
   - For **Round 1**, all members are notified to pay their share.
   - Payments are processed securely via the Interswitch checkout widget.
5. **Real-time Awareness**: The agent announces every payment to the whole circle in real time.
6. **Consensus (The Voice)**: If the group needs to change the contribution amount or circle name, a **Majority Vote** is triggered. Changes only occur once a majority of members approve.
7. **The Payout**: When Round 1 is complete, the total pot is disbursed to the recipient assigned to Round 1.
8. **Succession**: The cycle resets to Round 2, with the next member in the priority list set as the recipient.

---

## Two Interfaces

### 1. WhatsApp Bot
- No app download needed
- Entire savings circle managed through conversation
- Reminders, payments, announcements — all on WhatsApp
- Powered by **Groq (Llama 3.1)** for natural language understanding

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
| AI | Groq (Llama 3.1) API |
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
