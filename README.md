# Huuman - Be In Your Prime

**Huuman helps you be in your prime** - a weekly protocol for the five behaviors most tied to healthspan, with simple logging to build a record you're proud of.

## Vision

Users don't need more health information. They need fewer decisions. Huuman focuses on the Core Five pillars and helps you stay consistent.

## The 5 Primespan Domains

All users are coached across all 5 domains:

- **Heart** - Cardiovascular fitness, VO2max
- **Muscle** - Strength, body composition  
- **Sleep** - Recovery, circadian rhythm
- **Metabolism** - Energy, body composition
- **Mind** - Cognitive health, stress management

## Tech Stack

- **Frontend**: Next.js 14+, React, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-5.2 (Thinking + Instant models)
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 22+
- Supabase CLI
- Vercel CLI (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/my0210/huuman.git
cd huuman
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

4. Set up the database:
```bash
supabase db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
huuman/
├── app/
│   ├── (auth)/           # Login, signup pages
│   ├── (main)/           # Main app (week view)
│   ├── onboarding/       # Onboarding flow
│   └── api/              # API routes
├── components/           # React components
├── lib/
│   ├── ai/               # AI provider, prompts
│   ├── protocols/        # Primespan protocol data
│   └── supabase/         # Database clients
└── supabase/
    └── migrations/       # Database schema
```

## Key Features

- **Visible Personalization**: Every recommendation shows WHY it's tailored to you
- **Weekly Backbone**: Week plan is the core unit, daily touchpoints are flexible
- **One Screen, Chat-First**: Single view interface with conversational AI
- **No Guilt**: Auto-adjusts when days are missed, no punishment for imperfect weeks
- **Evidence-Based**: Grounded in longevity research (Primespan Framework)

## License

Proprietary - All rights reserved.
