# Eden v2 - Executive Summary

**Last Updated:** January 15, 2026  
**Version:** 0.1.0  
**Status:** MVP in Development

---

## What is Eden?

Eden is an AI-powered longevity coach that creates personalized weekly health protocols across five Primespan domains. Think "Peter Attia in your pocket" — evidence-based, adaptive, and deeply personalized.

**Live URL:** https://eden-v2.vercel.app

---

## The Primespan Framework

### 5 Domains (3 Components + 2 Processes)

| Domain | System | Type | Color | Description |
|--------|--------|------|-------|-------------|
| **Heart** | Cardiovascular | Component | Red | VO2max, aerobic capacity, cardiac efficiency |
| **Frame** | Musculoskeletal | Component | Orange | Strength, body composition, mobility, structural health |
| **Mind** | Cognitive | Component | Blue | Attention, focus, mental practices, emotional health |
| **Metabolism** | Metabolic | Process | Green | Glucose regulation, energy, nutrition, hormonal health |
| **Recovery** | Restorative | Process | Purple | Sleep, HRV, autonomic recovery, stress recovery |

**Internal Model:**
- Components = what you optimize (Heart, Frame, Mind)
- Processes = what powers them (Metabolism, Recovery)
- Users see "5 domains" — the coach understands the 3+2 relationship

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16.1 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS 4 |
| **Database** | Supabase (PostgreSQL + Auth + RLS) |
| **AI** | OpenAI GPT-5.2 (thinking model for plans, instant for chat) |
| **Deployment** | Vercel |
| **Components** | Vaul (drawer), date-fns |

---

## Features Built

### Core Flow
- [x] **Landing page** — Minimal, elegant entry point
- [x] **Auth** — Email/password signup & login via Supabase
- [x] **Onboarding** — 6-step flow collecting:
  - Goals & what "primespan" means to them
  - Current fitness level & health conditions
  - Schedule & preferred workout times
  - Equipment (gym vs home, what they have)
  - Capacity (max days, max daily minutes)
  - Coaching style (tone, density, formality)

### Plan Generation
- [x] **AI weekly plan generation** — Claude generates personalized protocols
- [x] **Visible personalization** — Every item shows why it's tailored to them
- [x] **Domain intros** — Per-domain explanations of weekly focus
- [x] **Week intro** — Personalized summary of what the week is about
- [x] **Smart start** — Plans start from today, not Monday (if mid-week)

### Week View
- [x] **Day strip** — Navigate Mon-Sun with completion indicators
- [x] **Domain progress bar** — Visual progress per domain (colored bars)
- [x] **Plan item cards** — Title, duration, personalization context
- [x] **Status actions** — Mark done, skip, or undo
- [x] **Expandable reasoning** — Tap to see "Why?" for each item
- [x] **Ask Eden button** — Quick chat about specific items

### Chat
- [x] **Chat overlay** — Slide-up drawer for conversations
- [x] **Context-aware** — Knows current plan and items
- [x] **Suggested prompts** — AI generates follow-up questions
- [x] **Coaching style** — Respects user's tone/density/formality preferences

### Admin & Feedback
- [x] **User feedback** — Rating + message submission
- [x] **Admin view** — Review feedback (admin-only)

---

## Database Schema

```
user_profiles
├── id (FK → auth.users)
├── email
├── goals (JSONB)
├── constraints (JSONB)
├── coaching_style (JSONB)
├── current_fitness_level
├── onboarding_completed
├── is_admin
└── timestamps

weekly_plans
├── id
├── user_id (FK)
├── week_start_date
├── eden_intro
├── domain_intros (JSONB)
├── generation_context (JSONB)
└── timestamps

plan_items
├── id
├── weekly_plan_id (FK)
├── domain (heart|frame|mind|metabolism|recovery)
├── day_of_week (0-6)
├── title
├── duration_minutes
├── personalization_context
├── reasoning
├── status (pending|done|skipped)
├── completed_at
└── sort_order

conversations
├── id
├── user_id (FK)
├── messages (JSONB)
├── context (JSONB)
└── timestamps

adaptations
├── id
├── user_id (FK)
├── weekly_plan_id (FK)
├── trigger_type
├── description
├── changes_made (JSONB)
└── timestamps

user_feedback
├── id
├── user_id (FK)
├── rating (1-5)
├── message
├── status (new|reviewed|resolved)
└── timestamps
```

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/plan/generate` | POST | Generate weekly plan |
| `/api/plan/item/[id]/status` | POST | Update item status |
| `/api/chat/message` | POST | Send message to Eden |
| `/api/user-feedback` | POST | Submit feedback |
| `/api/admin/user-feedback` | GET | Get all feedback (admin) |
| `/api/dev/reset` | POST | Reset user data (dev) |
| `/api/dev/delete` | POST | Delete user (dev) |

---

## What's NOT Built Yet

### High Priority (Next Up)
- [ ] **Metrics tracking** — Domain → Sub-domain → Metric → Measurement Source
- [ ] **Progress visualization** — Charts, trends, streaks
- [ ] **Apple HealthKit integration** — Auto-import HR, HRV, sleep, workouts
- [ ] **Screen Time API** — Auto-import Mind/digital behavior metrics

### Medium Priority
- [ ] **Plan adaptation** — Auto-adjust based on missed items, patterns
- [ ] **Notifications** — Reminders for upcoming items
- [ ] **Settings page** — Edit profile, constraints, coaching style
- [ ] **Week history** — View past weeks and adherence

### Lower Priority
- [ ] **CGM integration** — Glucose data from Levels/Libre
- [ ] **Photo/Video AI** — Body composition, posture, mobility assessment
- [ ] **Lab upload** — Parse bloodwork PDFs
- [ ] **Social features** — Accountability partners

---

## Key Files

```
lib/
├── types.ts              # All TypeScript types
├── ai/
│   ├── provider.ts       # OpenAI wrapper (GPT-5.2)
│   ├── prompts.ts        # System & generation prompts
│   └── planGeneration.ts # Plan generation logic
├── protocols/
│   └── primespan.ts      # Protocol templates per domain
└── supabase/
    ├── client.ts         # Browser client
    ├── server.ts         # Server client
    └── middleware.ts     # Auth middleware

components/
├── WeekHeader.tsx        # Domain progress + intros
├── WeekStrip.tsx         # Day navigation
├── DayView.tsx           # Day's plan items
├── PlanItemCard.tsx      # Individual item card
├── ChatOverlay.tsx       # Chat drawer
└── DomainIndicator.tsx   # Domain progress bars

app/
├── page.tsx              # Landing
├── onboarding/           # 6-step onboarding
├── (main)/
│   └── week/             # Main week view
└── api/                  # API routes
```

---

## Reference Documents

Located in `/Useful docs for planning v2/`:
- `PRIMESPAN_METRICS_MASTER.md` — Complete Domain → Sub-domain → Metric mapping
- `eden_product_spec_foundational_context.md` — Product vision & principles
- `eden_protocol_impact_map.md` — Protocol → Impact relationships
- `Eden's Primespan Framework Protocol Templates.pdf` — Detailed protocol templates

---

## Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Add: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

# Run dev server
npm run dev

# Run Supabase migrations
supabase db push
```

---

*Eden v2 — Your longevity, personalized.*
