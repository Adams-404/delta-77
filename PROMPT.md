# EsuX — Full Build Prompt for AI Assistant

## What is EsuX?
EsuX is a modern reimagining of the traditional Esusu/Ajo/Adashe rotating 
savings system. It is a full-stack web platform + WhatsApp AI bot that lets 
groups of people save money together, track contributions, and automatically 
disburse payouts — all without friction.

Users can manage everything from the website dashboard OR talk directly to 
the AI bot on WhatsApp. Both interfaces talk to the same backend.

---

## Tech Stack (Non-Negotiable)
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript throughout
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Auth:** Better Auth
- **AI:** Google Gemini API (gemini-1.5-flash)
- **WhatsApp:** Twilio WhatsApp Business API
- **Styling:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel (frontend + API routes)
- **Background Jobs:** Vercel Cron Jobs
- **File Storage:** Supabase Storage (for receipts/avatars)

---

## Environment Variables Needed
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Google Gemini
GEMINI_API_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Interswitch
ISW_CLIENT_ID=
ISW_CLIENT_SECRET=
ISW_BASE_URL=https://sandbox.interswitchng.com

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_WHATSAPP_BOT_NUMBER=+14155238886
```

---

## Database Schema (Drizzle)

Build the following tables in Drizzle ORM:

### users
- id (uuid, primary key)
- email (text, unique)
- name (text)
- phone_number (text, unique, nullable)
- bvn_verified (boolean, default false)
- bvn_hash (text, nullable — store hashed, never plain)
- avatar_url (text, nullable)
- created_at (timestamp)

### circles
- id (uuid, primary key)
- name (text)
- description (text, nullable)
- organizer_id (uuid, foreign key → users)
- contribution_amount (numeric)
- frequency (enum: weekly | monthly | custom)
- max_members (integer)
- status (enum: pending | active | paused | completed)
- current_round (integer, default 1)
- start_date (timestamp)
- created_at (timestamp)

### circle_members
- id (uuid, primary key)
- circle_id (uuid, foreign key → circles)
- user_id (uuid, foreign key → users, nullable — 
  can be invited before they have an account)
- phone_number (text — used for WhatsApp invite)
- payout_position (integer — determines payout order)
- status (enum: invited | accepted | declined | removed)
- joined_at (timestamp, nullable)

### rounds
- id (uuid, primary key)
- circle_id (uuid, foreign key → circles)
- round_number (integer)
- recipient_id (uuid, foreign key → users)
- total_expected (numeric)
- total_collected (numeric, default 0)
- status (enum: ongoing | completed | failed)
- payout_sent_at (timestamp, nullable)
- starts_at (timestamp)
- ends_at (timestamp)

### contributions
- id (uuid, primary key)
- round_id (uuid, foreign key → rounds)
- member_id (uuid, foreign key → users)
- amount_expected (numeric)
- amount_paid (numeric)
- transaction_ref (text, nullable)
- payment_verified (boolean, default false)
- covers_rounds (integer array — if overpaid)
- paid_at (timestamp, nullable)
- created_at (timestamp)

### messages (for AI chat history)
- id (uuid, primary key)
- user_id (uuid, foreign key → users, nullable)
- phone_number (text, nullable — for WhatsApp users)
- role (enum: user | assistant)
- content (text)
- channel (enum: web | whatsapp)
- created_at (timestamp)

### notifications
- id (uuid, primary key)
- user_id (uuid, foreign key → users)
- circle_id (uuid, foreign key → circles, nullable)
- type (enum: reminder | payment_received | 
  payout_sent | member_joined | member_declined)
- message (text)
- read (boolean, default false)
- created_at (timestamp)

---

## Phase 1 — Landing Page (Start Here)

Build a stunning, modern landing page at `/` (public, no auth required).

### Sections to build:

**1. Navbar**
- Logo: "EsuX" in bold with a subtle gradient
- Nav links: Features, How It Works, FAQ, Login, Get Started (CTA button)
- Mobile responsive hamburger menu

**2. Hero Section**
- Headline: "Your Community Savings Circle, Automated."
- Subheadline: "EsuX brings the trusted Esusu tradition into the 
  digital age — manage your Ajo circle from WhatsApp or the web, 
  with verified identities and automatic payouts."
- Two CTA buttons:
  - "Start a Circle" → /register
  - "Chat on WhatsApp" → opens WhatsApp link to bot number
    (href="https://wa.me/BOTNUMBER?text=Hello")
- Hero visual: A clean illustration or mockup showing the 
  WhatsApp bot conversation flow
- Subtle animated background (gradient or floating orbs)

**3. How It Works Section**
Three steps with icons:
1. "Create your circle" — Set amount, frequency, and invite members
2. "Everyone contributes" — Bot reminds, collects, and confirms payments
3. "Automatic payout" — When the round ends, the pot goes to the 
   next person automatically

**4. Features Section**
Grid of feature cards:
- 🔐 BVN-Verified Members — No ghost contributors
- 💬 WhatsApp Native — Works without an app
- 📊 Live Dashboard — Track every contribution in real time
- 🔔 Smart Reminders — Never miss a contribution deadline
- 💸 Automatic Payouts — Zero manual work for organizers
- 🌍 Built for Nigeria — Supports all Nigerian banks

**5. WhatsApp CTA Section**
Big centered section:
- "Already on WhatsApp? Start there."
- Show a phone mockup with a sample bot conversation
- Large WhatsApp button that redirects to bot

**6. FAQ Section**
Accordion component with these questions:
- What is EsuX?
- Is my BVN safe?
- What if someone doesn't pay?
- Which banks are supported?
- Is there a fee?
- Can I use EsuX without WhatsApp?

**7. Footer**
- Logo + tagline
- Links: Privacy Policy, Terms, Contact
- Social links

### Design Tokens:
- Primary color: #6C3AFA (deep purple)
- Accent: #00D4AA (teal green)
- Background: #0A0A0F (near black)
- Text: #FFFFFF / #A0A0B0
- Font: Inter
- Feel: Premium, modern, trustworthy, African

---

## Phase 2 — Authentication

Use Better Auth for all authentication.

### Pages to build:
- `/register` — Email + password signup + phone number field
- `/login` — Email + password login
- `/verify-email` — Email verification step
- Add Google OAuth as an option

### After login, redirect to `/dashboard`

### Auth configuration:
- Session-based with JWT
- Protect all `/dashboard/*` routes
- Middleware to redirect unauthenticated users to `/login`

---

## Phase 3 — Dashboard (Authenticated)

The dashboard is the web control panel for EsuX.

### Layout:
- Sidebar navigation (desktop) / Bottom nav (mobile)
- Sidebar items:
  - Overview (home icon)
  - My Circles
  - Contributions
  - Analytics
  - Settings
  - Help / Chat with AI

### Page: `/dashboard` (Overview)
- Welcome message: "Good morning, [Name]"
- Stats cards:
  - Active Circles
  - Total Saved
  - Next Payout Date
  - Pending Contributions
- Recent activity feed
- Quick action buttons: "Create Circle" | "Join Circle"

### Page: `/dashboard/circles`
- List of all circles user belongs to (as organizer or member)
- Each circle card shows:
  - Circle name
  - Member count / max members
  - Current round progress bar
  - Next contribution deadline
  - Status badge
  - "View" button
- "Create New Circle" button (opens modal)

### Page: `/dashboard/circles/[id]`
- Circle name + status + organizer name
- Tabs: Overview | Members | Contributions | Settings

**Overview tab:**
- Current round progress (how much collected vs expected)
- Payout recipient this round (with avatar)
- Countdown timer to deadline
- Recent contributions list

**Members tab:**
- Table of all members:
  - Avatar + Name + Phone
  - Payout position
  - Status badge (verified | pending | declined)
  - Contribution status this round
- "Invite Member" button
- Organizer can remove members / change payout order

**Contributions tab:**
- Full history of all contributions across all rounds
- Filter by round / member / status
- Each row: member name, amount, date, verified badge, 
  transaction ref

**Settings tab (organizer only):**
- Edit circle name
- Change contribution amount (only before first round)
- Change frequency
- Pause / End circle
- Export contribution history as CSV

### Page: `/dashboard/contributions`
- All contributions the logged-in user has made across all circles
- Filter by circle / date range
- Summary: total contributed, total received

### Page: `/dashboard/analytics`
- Charts (use Recharts):
  - Monthly savings trend (line chart)
  - Contribution completion rate per circle (bar chart)
  - Payout history (when you received, how much)
- Summary stats: total saved lifetime, circles completed, 
  on-time payment rate

### Page: `/dashboard/settings`
- Profile: update name, avatar, phone number
- Security: change password, enable 2FA
- WhatsApp: connect/verify WhatsApp number
- BVN Verification: verify BVN (calls Interswitch BVN API)
- Notifications: toggle email/WhatsApp notification preferences
- Danger zone: delete account

### Page: `/dashboard/chat` (AI Assistant on Web)
- A chat interface (like ChatGPT UI) embedded in the dashboard
- User can ask the AI anything about their circles:
  - "How much have I saved this year?"
  - "Who hasn't paid in Circle A?"
  - "Create a new circle with Tunde and Amina"
  - "When is my next payout?"
- The AI has full context of the user's data
- Messages stored in the messages table
- Streaming responses using Gemini API
- Same AI brain as the WhatsApp bot

---

## Phase 4 — Core API Routes

Build these Next.js API routes:

### Auth (handled by Better Auth)
- POST /api/auth/[...all]

### Circles
- GET /api/circles — get user's circles
- POST /api/circles — create a new circle
- GET /api/circles/[id] — get circle details
- PATCH /api/circles/[id] — update circle settings
- DELETE /api/circles/[id] — end/delete circle

### Members
- POST /api/circles/[id]/invite — invite a member by phone
- PATCH /api/circles/[id]/members/[memberId] — 
  update member (position, status)
- DELETE /api/circles/[id]/members/[memberId] — remove member

### Contributions
- GET /api/circles/[id]/contributions — get all contributions
- POST /api/contributions/verify — verify a payment 
  via Transaction Search API

### Payouts
- POST /api/circles/[id]/payout — trigger payout 
  (called by cron or manually)

### Identity (Interswitch)
- POST /api/verify/bvn — verify user's BVN
- POST /api/verify/otp — send/verify WhatsApp OTP

### AI Chat
- POST /api/chat — send message to Gemini, 
  get streaming response

### WhatsApp Webhook
- POST /api/webhooks/twilio — receives all 
  WhatsApp messages from Twilio

### Cron Jobs
- GET /api/cron/reminders — send payment reminders 
  (runs daily via Vercel Cron)
- GET /api/cron/rounds — check for completed rounds, 
  trigger payouts (runs daily)

---

## Phase 5 — Interswitch Integration

### Token Management
Build a singleton service that:
- Fetches OAuth token using Client ID + Client Secret
- Caches it (expires in ~12 hours)
- Auto-refreshes before expiry
```typescript
// Base URL: https://sandbox.interswitchng.com
// Token endpoint: /passport/oauth/token
// Auth: Basic base64(clientId:clientSecret)
// Body: grant_type=client_credentials
```

### BVN Verification Flow
1. User submits BVN on settings page
2. Call BVN Full Details API
3. Return name + masked details (never store raw BVN)
4. Store hashed BVN + set bvn_verified = true

### WhatsApp OTP Flow
1. User wants to verify phone number
2. Call Interswitch WhatsApp OTP API with phone number
3. User receives OTP on WhatsApp
4. User submits OTP → verified

### Transaction Verification
1. After user claims they paid, they submit transaction reference
2. Call Transaction Search API with the reference
3. If found + amount matches → mark contribution as verified
4. Broadcast update to circle

---

## Phase 6 — WhatsApp Bot

The bot receives messages via Twilio webhook at 
`/api/webhooks/twilio`

### Conversation State
Track each user's state in Supabase (not Redis, 
keep it simple for Next.js):

States:
- IDLE
- ONBOARDING_NAME
- ONBOARDING_BVN
- ONBOARDING_OTP
- CREATING_CIRCLE_NAME
- CREATING_CIRCLE_AMOUNT
- CREATING_CIRCLE_FREQUENCY
- CREATING_CIRCLE_MEMBERS
- CREATING_CIRCLE_ORDER
- AWAITING_PAYMENT
- CONFIRMING_PAYMENT

### Bot Commands (keywords bot understands)
- "hi" / "hello" / "start" → welcome + menu
- "create" / "new circle" → start circle creation flow
- "my circles" → list user's active circles
- "pay" → show payment instructions for active round
- "done" → trigger payment verification
- "status" → show current round status
- "help" → show all commands
- "balance" → show circle balance

### AI Layer
For any message that doesn't match a command keyword,
pass it to Gemini with full user context:
- Their circles, rounds, contribution history
- Current conversation history
- System prompt from BOT_GUIDE.md

The AI responds naturally and can also trigger 
actions (create circle, check status, etc.) 
by returning structured JSON alongside the response.

### Message Templates
Build consistent message formatting:

**Welcome:**
```
👋 Welcome to EsuX!
The smarter way to run your savings circle.

What would you like to do?
1️⃣ Create a new circle
2️⃣ View my circles
3️⃣ Make a payment
4️⃣ Check my balance

Or just tell me what you need 😊
```

**Payment reminder:**
```
⏰ *EsuX Reminder*
Circle: [Circle Name]
Round: [N] of [Total]

You have [X] days to contribute:
💰 Amount: ₦[amount]
📅 Deadline: [date]

Reply PAY when ready.
```

**Payment confirmed broadcast:**
```
✅ *EsuX Update — [Circle Name]*

[Member Name] just contributed ₦[amount] 🎉

Round [N] Progress:
[list of members with ✅ or ⏳]

Total: ₦[collected] / ₦[expected]
```

**Payout:**
```
🎊 *Round [N] Complete!*

₦[amount] has been sent to [Recipient Name]!

Round [N+1] starts [date].
Next recipient: [Name] 🎯

Keep saving together 💪
```

---

## Phase 7 — Notifications & Reminders

### Vercel Cron Job (daily at 8am WAT):
Check all active rounds:
- If deadline is in 3 days → send WhatsApp reminder 
  to unpaid members
- If deadline is today → send urgent reminder
- If deadline has passed → mark as overdue, 
  notify organizer

### Vercel Cron Job (daily at 10am WAT):
Check all rounds:
- If all members have paid → trigger payout automatically
- Call Bills Payment API
- Verify with Transaction Search
- Update round status to completed
- Broadcast payout confirmation to circle
- Start next round

---

## Phase 8 — Polish & Deploy

### Performance:
- Loading skeletons on all data-heavy pages
- Optimistic UI updates on contribution actions
- Error boundaries on all pages

### Security:
- Never log or expose BVN
- Rate limit all API routes (especially /api/verify/*)
- Validate all inputs with Zod
- CSRF protection via Better Auth

### SEO (Landing Page):
- Meta tags
- OG image
- robots.txt
- sitemap.xml

### Deploy:
- Push to GitHub
- Connect to Vercel
- Add all environment variables
- Set up Vercel Cron Jobs
- Point Twilio webhook to production URL

---

## Build Order (Strict — Follow This)
1. Landing page (Phase 1)
2. Auth setup (Phase 2)
3. Dashboard layout + empty pages (Phase 3 shell)
4. Database schema with Drizzle (all tables)
5. Interswitch token service
6. BVN verification API route + settings page
7. Circle creation (API + dashboard page)
8. Member invitation flow
9. Contribution tracking
10. WhatsApp bot webhook + conversation state
11. AI chat (web + bot)
12. Reminders + cron jobs
13. Analytics page
14. Polish + deploy