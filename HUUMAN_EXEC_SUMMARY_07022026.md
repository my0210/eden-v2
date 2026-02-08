# Huuman — Executive Summary (Current State)

> **One-liner:** Huuman is an AI-powered longevity coaching app — "Peter Attia in your pocket" — that helps users track and improve five pillars of healthspan through weekly protocols, activity logging, and conversational AI coaching.

---

## 1. Product Vision

Users don't need more health information — they need fewer decisions. Huuman focuses on **five evidence-based health domains** and helps users stay consistent through a weekly rhythm, personalized coaching, and visible progress.

**Tagline:** *Be In Your Prime.*

---

## 2. Two Product Modes (V2 → V3 Pivot)

The app currently has **two modes**, toggled by a feature flag (`V3_FOCUSED = true` is live):

### V3 — "Core Five" (Active / Current Focus)
A radically simplified experience. Users track **five weekly pillars** and try to hit all five each week:

| Pillar | Weekly Target | Unit |
|--------|--------------|------|
| **Cardio** | 150 min | minutes (Zone 2, walking, running, cycling, swimming) |
| **Strength** | 3 sessions | resistance training sessions |
| **Sleep** | 49 hrs | hours slept (≈7h/night × 7) |
| **Clean Eating** | 5 days | days on-plan (protein-forward, whole foods) |
| **Mindfulness** | 60 min | breathwork, meditation, journaling |

**Core V3 UX:**
- **StreakHero banner** — shows 5 ring indicators (one per pillar) filling as targets are met, plus a week streak counter
- **CoreFiveCards** — one card per pillar showing progress bar, current vs. target, and a quick-log button
- **QuickLogModal** — tap to log an activity with optional details (e.g., cardio type, sleep quality)
- **PillarDetailDrawer** — drill into individual logs, edit/delete entries
- **TrendView ("Your Record")** — 12-week heatmap + week-by-week breakdown + streak/best-streak stats
- **V3 Onboarding** — 3-step intro: welcome → weekly targets explained → how to log
- **Week navigation** — swipe or tap arrows to review past weeks (read-only); resets every Monday
- **Ambient orb** — background gradient that brightens/scales as more pillars are met (subtle delight)
- **Local caching** — stale-while-revalidate pattern with localStorage for instant UI

### V2 — Full Protocol Experience (Hidden Behind Feature Flag)
The original, more complex experience that is still fully implemented but currently gated off:

- **AI-generated 12-week Protocols** — GPT-5.2 generates a personalized strategic protocol with narrative (why/approach/expected outcomes), recommended activities from a ~50-item catalogue, and 12 weekly themes
- **Weekly Plan Generation** — AI creates day-by-day plan items across all 5 domains, each with personalization context and a "Why?" reasoning explanation
- **Conversational AI Chat** — chat overlay with the "Huuman" coach persona; answers health questions, adjusts plans, celebrates progress, and suggests follow-up prompts
- **Activity Logging** — structured logging with domain-specific fields (cardio HR zones, strength sets/reps/load, sleep bed/wake times, nutrition macros, etc.)
- **"You" Tab / Metrics Tracking** — comprehensive health metrics dashboard across 3 tiers (Core, Wearable, Lab) with sub-domains, scoring curves, and trend indicators
- **WeeklyDomainView** — shows recommended activities grouped by domain with progress tracking against protocol targets
- **Adaptation Engine** — system for adjusting plans when items are missed, user requests changes, or patterns are detected

---

## 3. The Five Primespan Domains

All coaching and content is organized around these longevity domains:

| Domain | Label | Focus Areas |
|--------|-------|-------------|
| ❤️ Heart | Cardiovascular | VO2max, aerobic capacity, cardiac efficiency, Zone 2 training, HIIT |
| 💪 Frame | Musculoskeletal | Strength, body composition, mobility, grip, stability, bone density |
| 🧠 Mind | Cognitive | Attention, focus, stress management, social connection, digital boundaries |
| 🔥 Metabolism | Metabolic | Glucose regulation, nutrition, protein, time-restricted eating, hydration |
| 😴 Recovery | Restorative | Sleep quality/quantity/consistency, HRV, morning light, active recovery |

---

## 4. AI Architecture

### Models
- **GPT-5.2** ("thinking") — used for protocol generation and weekly plan generation (complex reasoning)
- **GPT-5.2-chat-latest** ("instant") — used for chat responses (fast)
- **GPT-5.2-pro** — available for high-accuracy tasks
- **GPT-4o** — fallback

### AI-Powered Features
1. **Protocol Generation** — takes user profile (goals, constraints, fitness level, equipment, schedule) and generates a 12-week protocol with narrative, 5-7 recommended activities, and week themes
2. **Weekly Plan Generation** — generates daily plan items per domain, each with personalization context and evidence-based reasoning; respects mid-week starts
3. **Chat Coaching** — conversational AI with configurable personality (tone: supportive/neutral/tough; density: minimal/balanced/detailed; formality: casual/professional/clinical); returns structured JSON with response + suggested follow-up prompts
4. **Dynamic Huuman Messages** — rule-based message generation adapting to protocol week, theme, and coaching style

### Activity Catalogue
~50 evidence-based activities across all 5 domains, each with:
- **Cross-domain impact** with tier classification (Tier 0: Foundational → Tier 2: Situational)
- **Evidence rationale** for longevity relevance
- **Logging dimensions** (required + optional fields)
- **Constraint-based variants** (e.g., "no gym" → bodyweight alternatives)
- Examples: Zone 2 cardio, HIIT intervals, deadlift, squat, meditation, sleep hygiene, post-meal walk, protein-forward meal, cold exposure, etc.

---

## 5. User Profile & Personalization

Every user has a rich profile that drives all AI personalization:
- **Goals** — primary goals, what "being in prime" means to them, specific targets per domain
- **Constraints** — work schedule, blocked times, preferred workout times, gym/home/outdoor access, equipment, injuries, medical conditions, max workout days, max daily health minutes
- **Coaching Style** — tone (supportive/neutral/tough), density (minimal/balanced/detailed), formality (casual/professional/clinical)
- **Fitness Level** — sedentary → very_active (5 levels)
- **Unit Preferences** — metric/imperial, glucose units, lipids units

### Onboarding (V2)
6-step flow collecting: goals → current state (activity level, sleep quality, health conditions) → schedule constraints → equipment/environment → capacity → coaching style preferences

---

## 6. Metrics & Scoring Framework

A 3-tier longevity metrics system (V2 feature, currently hidden):

| Tier | What | Examples | Frequency |
|------|------|----------|-----------|
| **Tier 1: Core** | Eden actively improves | VO2max, Resting HR, Sleep Quality, Body Comp, Functional Strength | Weekly-Monthly |
| **Tier 2: Wearable** | Monitors for optimization | HRV, Sleep Stages, Recovery Score, Active Minutes, Steps | Daily-Weekly |
| **Tier 3: Lab** | Tracks and educates | ApoB, HbA1c, hsCRP, Vitamin D, Testosterone, Lipid Panel | Quarterly-Annually |

- **Metric definitions** stored in DB with canonical units, value types, sub-domain mapping
- **Scoring engine** with configurable curves (linear, logistic, step, piecewise) and optimal ranges
- **Trend tracking** with up/down/stable indicators and previous-entry comparison

---

## 7. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14+ (App Router), React, Tailwind CSS |
| **Backend** | Next.js API routes (17+ endpoints) |
| **Database** | Supabase (PostgreSQL), 18 migrations |
| **Auth** | Supabase Auth with email/password |
| **AI** | OpenAI GPT-5.2 family (thinking, instant, pro models) |
| **Hosting** | Vercel |

### Key API Endpoints
- `/api/v3/log` — CRUD for Core Five logs (GET, POST, PATCH, DELETE)
- `/api/v3/log/history` — historical logs for trend/streak calculation
- `/api/protocol/generate` — AI protocol generation
- `/api/plan/generate` — AI weekly plan generation
- `/api/chat/message` — conversational AI
- `/api/activities/log`, `/progress`, `/planned` — V2 activity management
- `/api/metrics/definitions`, `/entries` — metrics tracking
- `/api/user-feedback` — in-app feedback system

### Database Tables (via Supabase)
- `user_profiles` — full user profile with goals, constraints, coaching style
- `protocols` — 12-week protocols with narrative, activities, weeks
- `weekly_plans` + `plan_items` — generated weekly plans
- `activity_logs` — V2 structured activity logs
- `core_five_logs` — V3 simplified pillar logs
- `conversations` + `messages` — chat history
- `metric_definitions` + `user_metric_entries` + `metric_scoring` — metrics system
- `user_feedback` — feedback entries with status tracking

---

## 8. Design Philosophy & UX Principles

- **One Screen, Chat-First** (V2) / **One Screen, Card-First** (V3) — single main view, minimal navigation
- **Weekly Backbone** — week is the atomic unit; daily is flexible
- **No Guilt** — auto-adjusts when days are missed; never punishes imperfect weeks
- **Visible Personalization** — every recommendation shows WHY it's tailored
- **Evidence-Based** — grounded in Primespan longevity research
- **Protocol-First Thinking** — missed day = data, not failure; 12-week arc matters more than today
- **Dark UI with ambient glow** — green gradient orb that responds to user progress
- **Mobile-first** — touch gestures (swipe weeks), safe areas, responsive modals

---

## 9. What's Built vs. What's Live

| Feature | Built | Live (V3_FOCUSED=true) |
|---------|-------|----------------------|
| Core Five tracking (5 pillars) | ✅ | ✅ |
| Quick logging + detail editing | ✅ | ✅ |
| Streak tracking + trend heatmap | ✅ | ✅ |
| V3 onboarding | ✅ | ✅ |
| Week navigation + swipe | ✅ | ✅ |
| Settings (coaching style, units) | ✅ | ✅ |
| User feedback system | ✅ | ✅ |
| AI 12-week protocol generation | ✅ | ❌ (hidden) |
| AI weekly plan generation | ✅ | ❌ (hidden) |
| AI chat coaching | ✅ | ❌ (hidden) |
| Activity catalogue (~50 items) | ✅ | ❌ (hidden) |
| Metrics dashboard ("You" tab) | ✅ | ❌ (hidden) |
| Full onboarding (6 steps) | ✅ | ❌ (hidden) |
| Plan item status management | ✅ | ❌ (hidden) |
| Adaptation engine | ✅ | ❌ (hidden) |
| Admin feedback review | ✅ | ✅ |

---

## 10. Key Files for Reference

| Area | Path |
|------|------|
| Core types | `lib/types.ts` |
| V3 pillar config | `lib/v3/coreFive.ts` |
| V3 main view | `components/v3/CoreFiveView.tsx` |
| AI prompts | `lib/ai/prompts.ts` |
| AI provider | `lib/ai/provider.ts` |
| Protocol generation | `lib/ai/protocolGeneration.ts` |
| Plan generation | `lib/ai/planGeneration.ts` |
| Activity catalogue | `lib/ai/activityCatalogue.ts` |
| Primespan protocols | `lib/protocols/primespan.ts` |
| Feature flags | `lib/featureFlags.ts` |
| Main page (week view) | `app/(main)/week/page.tsx` |
| Metrics framework doc | `docs/LONGEVITY_METRICS_FRAMEWORK.md` |
| DB schema | `supabase/migrations/` |
