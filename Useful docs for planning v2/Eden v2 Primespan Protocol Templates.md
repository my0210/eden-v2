# Eden Protocol Templates (2026)
*Scientific foundation for Eden’s weekly adaptive coaching across five Prime domains: Heart, Frame, Metabolism, Recovery, Mind.*

## How to use this document (for the LLM)
- **Do not major in the minors.** Always select highest-impact protocols first.
- Generate **weekly + daily plans** across **all domains**, but not equal time allocation.
- Cap plan complexity:
  - **Max 2 new protocols/week**
  - **Max 6 active protocols total** (unless user is clearly time-rich and thriving)
- **Dose down before swapping** protocols when adherence drops.
- Prefer **multi-domain protocols** (sleep, strength, zone 2, nutrition fundamentals, daily movement).

### Protocol tiering
- **Tier 0 (Non-negotiables):** Biggest drivers. If weak, everything underperforms.
- **Tier 1 (High ROI):** Large gains with manageable friction.
- **Tier 2 (Multipliers):** Add only when Tier 0–1 are stable.
- **Tier 3 (Enhancers):** Situational or narrower benefits.
- **Tier 4 (Optimizers):** Marginal gains; only after foundations are stable.

### Weekly adaptation loop (LLM policy)
Each week:
1) Evaluate: **adherence**, **outcomes**, **friction**, **context** (travel/stress/injury)
2) Decide: **maintain** vs **dose down** vs **swap** vs **add**
3) Output:
- **1 must-do daily action**
- **1 nice-to-do daily action**
- **1 fallback action (2–5 min)** for bad days

### Branching logic format
Each protocol includes:
- **Select if**: conditions that trigger recommendation
- **Contraindications**: safety constraints
- **Scaling levers**: how to scale up/down; equipment/time variants

---

# HEART (Engine)

```yaml
id: heart
domain_goal: Maximize cardiovascular fitness and reduce cardiovascular risk through aerobic base, VO2max work, and blood pressure optimization.
key_metrics:
  - VO2max
  - Blood pressure
  - Resting heart rate
  - Heart rate recovery
  - HRV (cross-domain)
outputs:
  - weekly_plan
  - daily_actions
constraints:
  - time_min_per_week
  - injury_risk
  - recovery_status
```

## Impact order (global priority within Heart)
1) **Zone 2 base** (Tier 0)
2) **VO2max intervals** (Tier 1)
3) **Daily movement / steps** (Tier 1)
4) **Blood pressure levers** (Tier 1)
5) **Modality variety & progression** (Tier 2)
6) **Heat / sauna** (Tier 3)
7) **Niche breath/hypoxic tools** (Tier 4)

## Tier 0 — Non-negotiables
### H0: Aerobic Base (Zone 2)
- **What:** 150–180 min/week Zone 2 (talk-test: can speak in full sentences).
- **Minimum effective dose:** 2×20 min/week.
- **Target dose:** 3×45–60 min/week.
- **Primary metrics:** VO2max trend, resting HR, HRV trend.
- **Select if:** VO2max low/moderate; sedentary; metabolic risk; low energy.
- **Contraindications:** acute illness; unstable cardiac symptoms.

**Scaling levers**
- **Time:** 2×20 → 3×30 → 4×40 → 5×45.
- **Modality:** walk incline, bike, row, swim, elliptical.
- **Joint pain:** shift to low-impact modalities.

### H1: Baseline activity (steps + sitting breaks)
- **What:** daily steps + movement snacks.
- **Minimum:** add +1,500 steps/day from baseline.
- **Target:** 8,000–10,000 steps/day (or baseline +3,000).
- **Select if:** desk-bound; poor metabolic markers; low recovery.

## Tier 1 — High ROI
### H2: VO2max Intervals (1×/week to start)
- **What:** intervals at hard effort with full recovery.
- **Options:**
  - 4×4 min hard / 3 min easy
  - 6–10×1 min hard / 1–2 min easy
  - Hill repeats 8–10×30–45 sec
- **Minimum:** 1×/week.
- **Target:** 1–2×/week (never both if recovery is poor).
- **Primary metrics:** VO2max, HRR, perceived exertion.
- **Select if:** VO2max plateau; performance goal; time-limited user.
- **Contraindications:** uncontrolled hypertension; acute injury; poor sleep week.

**Scaling levers**
- **Beginner:** start 6×30 sec brisk uphill walk.
- **Advanced:** add interval volume or intensity cautiously.
- **Recovery-sensitive:** keep to 1×/week or every 10 days.

### H3: Blood pressure protocol (lifestyle-first)
- **What:** daily BP measurement (short-term), sodium discipline, weight/waist reduction if needed, aerobic base.
- **Minimum:** measure BP 3×/week for 2 weeks; implement sodium cap; add walking.
- **Select if:** BP elevated; family history.
- **Contraindications:** none (but refer out for severe/persistent hypertension).

## Tier 2 — Multipliers
### H4: Long session OR threshold
- **What:** 60–90 min steady session OR 20 min tempo.
- **Select if:** endurance goal; strong recovery.

### H5: Cross-training variety
- **What:** rotate modalities to reduce injury and boost adherence.

## Tier 3–4 — Enhancers / Optimizers
### H6: Sauna / heat exposure
- **What:** 2–3×/week 15–20 min.
- **Select if:** accessible and enjoyable; not replacing training.
- **Contraindications:** hypotension, dehydration risk.

### H7: Supplements (Heart)
- **Omega-3 (EPA/DHA):** if low fish intake or high TG.
- **Beetroot nitrates:** before key sessions/events.
- **Magnesium:** if sleep tension/cramps/low intake.

---

# FRAME (Structure)

```yaml
id: frame
domain_goal: Preserve and build strength, lean mass, mobility, balance, and bone density to extend functional lifespan.
key_metrics:
  - Relative strength
  - Grip strength
  - Lean:fat ratio, waist:height
  - Structural integrity (injury, mobility)
  - Bone density (if available)
outputs:
  - strength_plan
  - mobility_plan
constraints:
  - equipment
  - pain_points
  - time_min_per_week
```

## Impact order (global priority within Frame)
1) **Progressive strength training** (Tier 0)
2) **Protein + body composition basics** (Tier 0)
3) **Mobility as warmups + targeted weak links** (Tier 1)
4) **Grip + carries** (Tier 1)
5) **Balance + stability** (Tier 1)
6) **Periodization, power, accessories** (Tier 2)
7) **Supplements/optimizers** (Tier 3–4)

## Tier 0 — Non-negotiables
### F0: Strength training (full-body 2–3×/week)
- **What:** compound-based program: squat/lunge, hinge, push, pull, carry, core.
- **Minimum:** 2×/week 30–40 min full-body.
- **Target:** 3×/week 45–60 min.
- **Primary metrics:** strength progression, grip, injury-free weeks.
- **Select if:** everyone (default).
- **Contraindications:** acute injury (modify, don’t stop).

**Scaling levers**
- **Time:** 2×30 full-body (MED) → 3×45 → upper/lower split.
- **Equipment variants:**
  - **Barbell/gym:** Wendler-style progression; main lift + assistance.
  - **Dumbbells/kettlebells:** double progression (reps then load).
  - **Home/no equipment:** leverage progressions (push-up variations, split squats, rows via table/rings, backpack load).

### F1: Protein + recovery support
- **What:** 1.2–1.6 g/kg/day protein; distribute across meals.
- **Select if:** low lean mass; training.

## Tier 1 — High ROI
### F2: Mobility embedded in training
- **What:** 8–12 min warmup + 5 min cooldown.
- **Select if:** limited ROM, pain, stiffness.

### F3: Grip & carries
- **What:** farmer’s carries, hangs, heavy holds.
- **Minimum:** 2 sets/week.
- **Target:** 2–3×/week.

### F4: Balance + stability
- **What:** single-leg work, side planks, anti-rotation.
- **Select if:** older age, fall risk, poor balance.

## Tier 2 — Multipliers
### F5: Periodization
- **What:** 8–12 week blocks (hypertrophy → strength → deload).

### F6: Power / plyometrics (if safe)
- **What:** low-volume jumps/throws.
- **Select if:** athletic goals; low injury risk.

## Supplements (Frame)
- **Creatine monohydrate:** 3–5 g/day.
- **Vitamin D (if low):** per labs.
- **Collagen + vitamin C:** tendon/joint support (optional).

**Contraindication guardrail:** no high-impact plyos with active joint pain.

---

# METABOLISM (Fuel)

```yaml
id: metabolism
domain_goal: Improve insulin sensitivity, lipids, inflammation, and body composition through diet + movement fundamentals.
key_metrics:
  - ApoB / particle burden
  - HbA1c
  - hs-CRP
  - body composition, waist:height
outputs:
  - nutrition_protocol
  - movement_addons
constraints:
  - diet_preferences
  - time_for_cooking
  - appetite/behavior
```

## Impact order (global priority within Metabolism)
1) **Calorie/waist control + protein** (Tier 0)
2) **Whole foods + fiber + ultra-processed reduction** (Tier 0)
3) **Post-meal walks** (Tier 1)
4) **Time-restricted eating (gentle)** (Tier 2)
5) **Targeted carb strategy (CGM-driven if available)** (Tier 2)
6) **Supplements (selective)** (Tier 3)

## Tier 0 — Non-negotiables
### M0: Nutrition fundamentals
- **What:** protein target + whole foods + fiber.
- **Rules:**
  - Each meal: protein + fiber-rich plants.
  - Minimize liquid calories and ultra-processed snacks.
- **Minimum:** 2 high-protein meals/day.
- **Target:** protein each meal + 25–35g fiber/day.

### M1: Waist-first body composition
- **What:** if waist:height elevated, create modest deficit.
- **Rate:** 0.25–0.75% bodyweight loss/week if needed.

## Tier 1 — High ROI
### M2: Post-meal walking
- **What:** 10–15 min after largest meal (or after lunch and dinner).
- **Select if:** elevated HbA1c, CGM spikes, sedentary.

## Tier 2 — Multipliers
### M3: Time-restricted eating (12–14h fast)
- **What:** finish dinner earlier; avoid late snacking.
- **Select if:** late-night snacking; appetite dysregulation.
- **Contraindications:** history of eating disorder; poor sleep worsened by fasting.

### M4: Carb quality & timing
- **What:** prioritize low-GI carbs; place carbs around training.
- **Select if:** HbA1c high or glucose variability.

## Tier 3 — Supplements (selective)
- **Omega-3:** low fish intake / high TG.
- **Magnesium:** sleep/stress/cramps.
- **Berberine:** selective trial if glucose elevated and lifestyle already solid.
- **Psyllium fiber:** if fiber intake low.

**Guardrails**
- Do not recommend supplements as substitutes for Tier 0.
- Avoid aggressive fasting if it harms sleep or triggers binge/restrict behavior.

---

# RECOVERY (Restoration)

```yaml
id: recovery
domain_goal: Improve sleep quantity/quality/consistency and autonomic recovery to enable adaptation and performance.
key_metrics:
  - HRV
  - sleep efficiency & duration
  - resting HR (cross-domain)
outputs:
  - sleep_protocol
  - recovery_adjustments
constraints:
  - schedule
  - travel
  - stress_load
```

## Impact order (global priority within Recovery)
1) **Sleep schedule + environment** (Tier 0)
2) **Caffeine/alcohol timing** (Tier 1)
3) **Wind-down routine** (Tier 1)
4) **HRV-guided deloading** (Tier 2)
5) **Naps / heat / gadgets** (Tier 3)
6) **Supplements** (Tier 3–4)

## Tier 0 — Non-negotiables
### R0: Sleep opportunity + consistency
- **What:** protect 8 hours in bed; stable wake time.
- **Minimum:** consistent wake time + 7h in bed.
- **Target:** 8h in bed + ±30 min schedule.

### R1: Sleep environment
- **What:** dark, cool, quiet; phone out of bedroom.

## Tier 1 — High ROI
### R2: Caffeine cutoff + alcohol discipline
- **What:** caffeine cutoff 6–8h before bed; alcohol minimized and not late.

### R3: Wind-down routine
- **What:** 20–45 min pre-sleep: dim lights, no work, calming activity.

## Tier 2 — Multipliers
### R4: HRV / readiness guided training
- **What:** if HRV down and resting HR up, dose down intensity.

## Tier 3–4 — Enhancers
### R5: Active recovery
- **What:** low intensity movement, mobility, sauna (optional).

### R6: Supplements (sleep)
- **Magnesium glycinate:** 200–400 mg evening.
- **Glycine:** 3 g pre-bed (optional).
- **Melatonin:** low dose for travel/shift (not as chronic crutch).
- **Ashwagandha:** selective stress support.

**Guardrails**
- If sleep is failing, do not add new high-intensity protocols.
- If insomnia persists or red flags appear, recommend professional evaluation.

---

# MIND (Clarity)

```yaml
id: mind
domain_goal: Improve attention, stress resilience, emotional health, and cognitive performance through focus systems and stress reduction.
key_metrics:
  - cognitive processing speed & focus
  - perceived stress (self-report)
outputs:
  - focus_protocol
  - stress_protocol
constraints:
  - job_demands
  - digital_overload
  - motivation_profile
```

## Impact order (global priority within Mind)
1) **Sleep + exercise foundations** (cross-domain Tier 0)
2) **Deep work structure + digital hygiene** (Tier 0)
3) **Daily downshift (mindfulness/breathing)** (Tier 1)
4) **Learning + social cadence** (Tier 2)
5) **Nootropics / niche cognitive drills** (Tier 4)

## Tier 0 — Non-negotiables
### N0: Deep work block + distraction controls
- **What:** 1 protected focus block/day.
- **Minimum:** 25 min.
- **Target:** 60–90 min.
- **Mechanics:** notifications off, phone away, single-tasking.

### N1: Digital hygiene
- **What:** disable non-essential notifications; set check-in windows.

## Tier 1 — High ROI
### N2: Daily downshift
- **What:** 5–10 min breathwork, mindfulness, or journaling.
- **Select if:** stress high; sleep latency high.

## Tier 2 — Multipliers
### N3: Learning routine
- **What:** 15–30 min/day skill learning.

### N4: Social cadence
- **What:** 2–3 meaningful interactions/week.

## Tier 4 — Optimizers (only if Tier 0–2 stable)
### N5: Selective supplements
- **Omega-3:** brain + mood support.
- **L-theanine with caffeine:** calm focus.
- **Creatine:** cognitive support (already in Frame).

**Guardrails**
- If anxiety/depression red flags arise, recommend professional evaluation.
- Do not add stimulants that worsen sleep.

---

# Global selection rules (LLM “pick and dose”)

## If user can only do 3 things
1) Sleep Core (R0/R1)
2) Strength 2×/week (F0)
3) Zone 2 2×/week OR nutrition fundamentals (H0 or M0)

## If user can do 5 things
Add:
4) Zone 2 base (H0)
5) Post-meal walk or steps target (M2 or H1)

## If user is advanced
Add (only if adherence ≥70% and recovery stable):
- VO2max intervals 1×/week (H2)
- Periodization block (F5)
- TRE 12–14h (M3)

## Safety + trust boundaries
- When medical red flags appear (cardiac symptoms, severe hypertension, severe mental health symptoms, eating disorder risk), advise professional evaluation.
- Always distinguish **measured vs estimated** and adjust confidence.

