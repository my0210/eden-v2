# Eden — Foundational Product Spec

This document exists to give **maximum context density** to LLMs (Cursor / ChatGPT) and humans building Eden. It is not marketing copy. It is an execution spec.

It answers six questions:

1. The user
2. The problem in their words
3. What good looks like
4. What we’ve tried and why it failed
5. Constraints that shape the solution
6. How we’ll know it worked

---

## 1. The User (Specifically, Not a Persona)

**Who they are**

- Knowledge workers, founders, operators, executives, creatives.
- Typically 30–55.
- High agency, low patience for fluff.
- Already successful in at least one domain of life.
- Uses Apple products, tracks data, but is skeptical of dashboards.

**What they care about**

- Staying sharp, strong, and capable for decades.
- Avoiding slow, invisible decline.
- Making fewer but better decisions about health.
- Delegating thinking, not responsibility.

**What makes them give up**

- Generic advice.
- Fads and trends without evidential success data.
- “Just be consistent” messaging.
- Habit apps that nag without insight.
- Coaches that don’t adapt to reality.

**What makes them pay attention**

- Clear reasoning.
- Research- and evidence-backed expertise
- Tradeoffs explained.
- Plans that respect constraints.
- Evidence that the system is *actually tracking reality*, not just intentions.

---

## 2. The Problem (In Their Words)

Collected from user interviews, early feedback, and comparable products:

> “I know *what* I should do. I don’t know *what matters most right now*.”

> “I track everything and still don’t know if I’m doing well.”

> “Every app assumes unlimited time and motivation.”

> “My life changed but my plan didn’t.”

> “I don’t want more data. I want fewer decisions.”

> “I stop trusting systems that don’t adapt when I fail.”
>
> "Everyone says something different and proposes a new trend. I am overwhelmed with too many opinions and directions."
>
> "I need the ultimate protocol, not just another hype."

Core pain: **Health guidance is noisy, static, generic, and detached from lived reality.**

---

## 3. What Good Looks Like (Show, Don’t Describe)

### Good Coaching

- One clear priority at a time.
- Explicit tradeoffs (“we’re de-prioritizing X because Y”).
- Changes when reality changes.
- Explains *why*, not just *what*.

### Good Output Examples

- “Given your last 3 weeks of sleep + travel, strength volume is capped at 2 sessions. Cardio stays.”
- “Your VO₂max is improving, but HRV is trending down → recovery is the bottleneck.”
- “This protocol is an estimate. Confidence: low. Here’s how we improve it.”

### Reference Benchmarks

- Peter Attia–style thinking, not tone.
- Elite human coaches, not just tracking apps.
- Strategy docs > motivational quotes.

---

## 4. What We’ve Tried (And Why It Failed)

### Habit Trackers

**Why they fail:**

- Optimize streaks, not outcomes.
- No understanding of causality.
- Break when life breaks.

### Static Programs

**Why they fail:**

- Assume stable schedules.
- Ignore adherence reality.
- Require manual re-planning.

### Data Dashboards

**Why they fail:**

- High signal, low meaning.
- No prioritization.
- User becomes the analyst.
- We don't have APIs to all data, yet. Processing and normalization of data is very hard.

### Generic AI Coaches

**Why they fail:**

- Personalize language, not decisions.
- Confidently wrong.
- No memory, no continuity.

---

## 5. Constraints That Shape the Solution

Only constraints that materially change what gets built:

### Reality Constraints

- Health data is incomplete, delayed, and noisy.
- Most users won’t enter data manually.
- Apple Health is asynchronous and messy.

### Trust Constraints

- Overconfidence kills long-term usage.
- Users will test Eden with edge cases.
- Eden must admit uncertainty.

### Product Constraints

- Coaching must work with *partial information*.
- The system must degrade gracefully.
- The app is secondary to the coaching logic.
- AI Conversations are either too robotic or too lose and caught in endless loops of questions 

### Legal / Safety Constraints

- No diagnosis.
- No medication advice.
- Clear boundaries for medical escalation.

---

## 6. How We’ll Know It Worked (Concrete Signals)

### Short-Term (Weeks)

- Users follow advice *without asking for justification*.
- Fewer but longer coaching sessions.
- Users reference Eden’s reasoning unprompted.

### Medium-Term (Months)

- Protocols change automatically as life changes.
- Reduced plan churn.
- Higher adherence despite imperfect weeks.

### Long-Term (Year+)

- Eden becomes the default health decision-maker.
- Users say: “I don’t really think about this anymore.”
- Users trust Eden *even when it tells them to do less*.

---

## North Star

Eden succeeds when the following **outcome-focused truths** is demonstrably true.

**Measurable Primespan Preservation**

> Over a 5–10 year horizon, Eden users measurably slow or reverse decline across the five Prime domains compared to matched peers.

This is the most ambitious and research-grade North Star. Everything ladders up to longitudinal outcomes, not engagement.



