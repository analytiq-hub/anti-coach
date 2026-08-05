# Anti-Coach Onboarding — Plan

Pre-account personalization funnel for **anti-coach**, reverse-engineered from
reference screenshots under `docs/Screenshot 2026-08-04 at 10.*.png` (batches
~10:45–10:48 and ~10:52–10:57). Ignore banking screenshots (`2026-07-31`,
`2026-08-02`). Product plan: [`anti_coach_plan.md`](./anti_coach_plan.md).

---

## 1. Reference funnel (from screenshots)

The reference product does **not** open with signup. It runs a long, paced quiz
with interstitials, reactive micro-copy, a fake “crafting plan” wait, a payoff
screen, and **only then** asks for email.

Four top-level phases on the progress bar:

**PROFILE → PERSONALITY → PERSONALIZE → (payoff / account)**

---

## 2. Full reconstructed flow

Capture order is imperfect (user can go Back); this is the **logical** order
from section labels + progress chrome.

```
═══════════════════════════════════════════════════════════════
 ENTRY (no progress bar)
═══════════════════════════════════════════════════════════════
[E1] Hero                     “Become a better you”
                              Book-cover shelf social proof
                              “Start by selecting your gender”
                              Male | Female | Other  → auto-advance

═══════════════════════════════════════════════════════════════
 PHASE 1 — PROFILE
═══════════════════════════════════════════════════════════════
[P1] Bridge                   Mascot: “Glad you are here!”
                              “We'll help you with self-growth…”
                              Continue

[P2] Age                      “What’s your age group?”
                              Photo cards: 18–24 | 25–34 | 35–44 | 45+
                              → auto-advance

[P3] Topics                   “Choose the topics you’d like to elevate”
                              Disclaimer: “The choice won’t limit your experience”
                              3×4 emoji grid (multi-select) → Continue
                              Mental Health, Motivation, Nutrition, Habits,
                              Personal Development, Mindset, Self-Care,
                              Exercise, Social skills, Love & Relationships,
                              Personal Finance, Creativity

═══════════════════════════════════════════════════════════════
 PHASE 2 — PERSONALITY
═══════════════════════════════════════════════════════════════
[Y1] Pain point               “What frustrates you most about learning today?”
                              Single-select emoji rows (6 options)
                              e.g. Information overload, Notifications,
                              No time, Forgetting, Unclear what to learn,
                              Books feel too long

[Y2] Bridge (echo)            Mascot + books: “We're here to break those chains!”
                              Body copy mirrors chosen pain
                              (“Overwhelmed by information? …”)
                              Continue

[Y3] Likert × N               1–5 “Don’t agree … Agree”
                              Statements such as:
                              • Left out of conversations / others know more
                              • Start learning then lose motivation
                              • Always know what you want exactly
                              • Doubt myself after a mistake
                              • Hard to make decisions quickly
                              On select: tinted feedback card appears
                              (“Sometimes we all need a spark…”)
                              Continue

[Y4] Learning styles          “What learning styles work best for you?”
                              Multi-select cards + checkboxes
                              Quick text / Audio / Visual / Interactive /
                              Bite-sized / Story-based

[Y5] Bridge (echo)            “We’ll match your style!”
                              Copy names the styles the user picked
                              Continue

[Y6] Binary personality       “Are you a big-picture or detail-oriented person?”
                              Two large pills + icons
                              Immediate feedback card on select
                              Continue

[Y7] Social energy            “What do you consider yourself?”
                              Extrovert | Introvert | Both
                              Feedback card (“Ambiverts get the best…”)
                              Continue

[Y8] Info sources             “Where do you usually go looking for information?”
                              List: Google, Books, AI chatbots, Friends,
                              Social media, News, Online courses

[Y9] Bridge (echo)            “We’ll be your personal curator!”
                              Copy mirrors sources (“Why limit yourself to
                              online courses? …”)
                              Continue

[Y10] Energy window           “When do you have the most mental energy…?”
                              Morning / Commute / Lunch / Before bed
                              Feedback card (“Lunch and learn!”)
                              Continue

═══════════════════════════════════════════════════════════════
 PHASE 3 — PERSONALIZE
═══════════════════════════════════════════════════════════════
[Z1] Bridge                   “Let's find your perfect content mix”
                              Explains upcoming content votes
                              Continue

[Z2] Thought leaders          “Which thought leaders inspire you?”
                              3×3 circular B&W portraits (multi-select)
                              Selected = accent ring + accent name
                              Continue

[Z3] Bridge (echo)            Cape mascot: “Sharp intellectual taste!”
                              Names selected leaders in copy
                              Continue

[Z4] Content votes            “Does this book seem interesting to you?”
                              Cover + one-line hook
                              Big No (red X) | Yes (green ✓)
                              Repeats for many titles (7 Habits, How Not to Die,
                              Body Keeps the Score, You Are a Badass,
                              Atomic Habits, Deep Work, …)

[Z5] Social proof             World-map ripple: “Join over 10M+ people”
                              Doomscrolling escape framing
                              Continue

[Z6] Life reason              “Do you have a specific reason for self-growth?”
                              Multi-select + checkboxes
                              Promotion, Entrepreneur, Relationship,
                              Parenthood, Life transition, Financial,
                              Retirement, Grief and loss

[Z7] Daily goal               “Set your daily learning goal”
                              Easy 5 min | Common 10 min | Serious 15 min
                              → auto-advance or Continue

═══════════════════════════════════════════════════════════════
 CRAFTING THEATER (pseudo-loading)
═══════════════════════════════════════════════════════════════
[C1] Loading shell            “We are crafting your growth plan…”
                              Checklist: Goals ✓ → Topics ✓ → Picking content %
                              Footer: “Enjoyed by 10M+ people” + rotating
                              star testimonials

[C2] Mid-load interrupts      Modal: “To move forward, specify…”
                              • “Do you self-reflect?” No | Yes
                              • “Do you like to learn while listening?” No | Yes
                              (more possible)

═══════════════════════════════════════════════════════════════
 PAYOFF + ACCOUNT GATE
═══════════════════════════════════════════════════════════════
[R1] Plan ready               “Your personal growth plan is ready”
                              Chart: Now → +30 days (“15 books per month”)
                              Identity line (“One Month In: You’re …”)
                              Cross-platform note
                              Continue

[R2] Account                  “Enter your email to create your personal
                              account and track your progress”
                              Lock + anti-spam trust
                              Continue with Email
                              Terms footer
```

---

## 3. Pattern checklist (adopt these)

| Pattern | Reference example | Why it works |
| ------- | ----------------- | ------------ |
| Outcome-first hero | “Become a better you” + book shelf | Aspiration before features |
| One-tap start | Gender / age cards | Instant commitment, no typing |
| 4-phase progress | PROFILE / PERSONALITY / PERSONALIZE / plan | Orientation + sunk cost |
| Bridge interstitials | Mascot + Continue every few answers | Pacing; quiz fatigue relief |
| **Answer-echo bridges** | “Break those chains”, “Match your style”, “Sharp taste” | Proof the quiz is “listening” |
| Multi-select grids | Topics, styles, leaders, life reasons | Preference without forms |
| “Won’t limit you” disclaimer | Topics subtitle | Lowers FOMO / choice anxiety |
| **Likert + reactive coaching card** | Select 3 → tip card appears | Feels like coaching, not a survey |
| Binary content votes | Book Yes/No | Fast taste signal |
| Thought-leader faces | Portrait multi-select | Identity + taste |
| Daily commitment | Easy / Common / Serious minutes | Habit intention |
| **Crafting theater** | Fake progress + checklist | Makes personalization feel real |
| **Mid-load micro-questions** | Self-reflect / listen while learning | Extra data without more “steps” |
| Social proof during wait | 10M+ + testimonials | Trust while “loading” |
| Plan-ready payoff | Chart + identity label | Conversion moment before email |
| Account last | Email to “track progress” | Capture after investment |
| Legal footer | Terms / address on many steps | Compliance |

### 3.1 Interaction primitives (UI kit)

The reference funnel reuses a small set of controls — anti-coach should too:

1. **Single-select list** — emoji + label rows (pain, energy, sources).
2. **Multi-select grid / list** — chips or cards + checkbox (topics, styles, goals).
3. **Photo / portrait cards** — age bands, thought leaders.
4. **Likert 1–5** — with optional reactive feedback panel above the scale.
5. **Binary pills** — two options with icons + feedback panel.
6. **Yes/No content card** — hero media + red X / green ✓.
7. **Bridge screen** — illustration + headline + body + Continue.
8. **Commitment tier** — 3 rows (Easy / Common / Serious).
9. **Crafting loader** — checklist + % + testimonial carousel + modal Yes/No.

---

## 4. What we will **not** copy

- Book / audio feed product (anti-coach is chat).
- Reference mascot / brand art (own visual language).
- Literal “books per month” metric.
- Gender collection unless we have a clear product use (prefer skip or optional).
- Emoji-heavy copy if it fights anti-coach tone (use sparingly).
- Full length of the reference quiz (~25+ screens) — **compress** for chat.

---

## 5. Goals for anti-coach

1. Pre-auth funnel: quiz → bridges → “crafting” → plan ready → account → `/chat`.
2. Persist answers; merge into user on signup; drive system prompt + first thread.
3. Reuse reference **mechanics**, not content vertical.
4. Keep mobile-first, one job per screen.
5. Stack: Next.js, NextAuth, FastAPI, MongoDB (see [`anti_coach_plan.md`](./anti_coach_plan.md)).

### Non-goals (v1)

- Native apps.
- Real ML recommender (rules + prompt injection).
- Exact visual clone of the reference screenshots.
- Collecting every reference question 1:1.

---

## 6. Anti-coach funnel (compressed)

Aim for **~12–15 screens** (reference funnel is longer). Keep the rhythm:
question → maybe feedback → bridge → next phase → crafting → plan → account.

```
[/] or [/start]     Hero: brand + promise + one-tap start
        │
        ▼
[/onboarding]       Wizard (pre-auth). Progress: 4 phases.
        │
        ├─ PROFILE
        │     Bridge: “Glad you’re here — we push back, not cheerlead.”
        │     Q: What are you trying to fix? (multi-select chips)
        │     Q: Age band (optional photo cards) OR skip
        │
        ├─ PERSONALITY
        │     Q: What frustrates you about advice / change? (single-select)
        │     Bridge (echo pain)
        │     Q: 2–3 Likert statements + reactive tip cards
        │     Q: How blunt should anti-coach be? (3 levels)
        │     Q: Big-picture vs detail (binary + tip)
        │     Bridge (echo style)
        │
        ├─ PERSONALIZE
        │     Bridge: “Let’s calibrate your pushback”
        │     3–5 Yes/No situation cards (not books)
        │     Q: Daily commitment (Easy / Common / Serious minutes of chat)
        │     Optional: “role models for hard truth” portrait grid (short)
        │
        └─ CRAFT + PLAN
              Crafting theater (checklist + 1 mid-load Yes/No)
              “Your anti-plan is ready” chart + identity line
              Continue → account
        │
        ▼
[/onboarding/account]   Email / OAuth — “track your progress”
        │
        ▼
[/chat]                 Seeded thread from plan + tone prefs
```

### 6.1 Situation Yes/No examples (anti-coach)

Replace book covers with scenarios:

| Card | Hook line |
| ---- | --------- |
| Quit impulse | “Talk me out of quitting my job on Monday” |
| Pep talk | “I need someone to tell me I’m doing great” (expect **No** for product fit) |
| Decision | “I’ve been stuck between two options for months” |
| Rationalizing | “Help me spot when I’m lying to myself” |
| Soft advice | “Just give me gentle suggestions” |

### 6.2 Reactive feedback (coach voice)

When the user picks a Likert / binary answer, show a short tip card that:

1. Validates or reframes (anti-coach: may *challenge* instead of only praise).
2. States how the product will respond (“We’ll interrupt pep-talk requests…”).

Do **not** only use flattering copy (“Your resilience is impressive!”). Mix in
contrarian reframes so the funnel teaches the brand.

### 6.3 Crafting theater

```
We are crafting your anti-plan…
  ✓ Goals
  ✓ Pushback style
  ○ Calibrating scenarios   47%
```

- 2–4s artificial delay (or until mid-questions answered).
- 1–2 modal Yes/No interrupts.
- Optional testimonial strip (honest quotes later; no inflated user-count claims).

### 6.4 Data model

```json
{
  "version": 2,
  "goals": ["career", "habits"],
  "age_group": "25-34",
  "frustration": "unclear_advice",
  "likert": { "lose_motivation": 3, "self_doubt": 2 },
  "bluntness": 2,
  "thinking_style": "detail",
  "interest_votes": [
    { "id": "quit_job", "liked": true },
    { "id": "pep_talk", "liked": false }
  ],
  "daily_minutes": 10,
  "self_reflect": true,
  "plan_label": "Fewer rationalizations",
  "completed_at": "ISO-8601"
}
```

Pre-auth: `onboarding_session_id` in cookie / localStorage.  
On signup: merge into `users.onboarding`.  
Chat: fold into system prompt builder + first message.

---

## 7. Account gate

Copy pattern from the reference funnel:

- Benefit: create account **to track progress**.
- Trust: lock + never spam / share.
- Primary: Continue with Email (+ OAuth if enabled).
- Footer: Terms / Privacy.

Returning users with `onboarding.completed_at` → `/chat`.  
Incomplete + signed in → resume wizard once.

---

## 8. Implementation phases

### Phase 0 — Spec freeze

- Final compressed question list (max ~12 interactive).
- Tip-card copy for each Likert / binary (anti-coach voice).
- Plan-ready identity labels mapped from answers.
- Decide: collect age? gender? (recommend age optional; skip gender).

### Phase 1 — Frontend wizard

- `/onboarding` routes + progress chrome (4 phases).
- Primitives: list, multi-select, Likert+tip, Yes/No, bridge, tiers, loader.
- Client-only session state.

### Phase 2 — Persist + account merge

- Attach payload on register / OAuth.
- Mongo `users.onboarding`; skip funnel when complete.

### Phase 3 — Chat personalization

- System prompt + first thread seeded from answers.
- Empty-state prompts reflect Yes/No interests.

### Phase 4 — Polish

- 2–3 motion accents between steps.
- Analytics per step (`start`, `answer`, `crafting`, `plan_ready`, `account`).
- A/B: short vs medium quiz length.

---

## 9. Success criteria

1. New visitor completes funnel → account → seeded `/chat`.
2. Answers stored and influence first assistant turn.
3. Returning users skip onboarding.
4. Mobile: one primary action; Likert tip appears without layout jump chaos.
5. No DocRouter org/workspace UX in the path.

---

## 10. Screenshot index

### Entry + PROFILE + early bridges

| File | Screen |
| ---- | ------ |
| `…10.45.51 PM.png` | Hero + gender |
| `…10.46.37 PM.png` | Age group |
| `…10.46.51 PM.png` / `…10.52.58 PM.png` | “Glad you are here” bridge |
| `…10.52.51 PM.png` | Topics multi-select grid |

### PERSONALITY

| File | Screen |
| ---- | ------ |
| `…10.52.12 PM.png` | Frustration single-select |
| `…10.52.18 PM.png` | “Break those chains” bridge |
| `…10.52.25 PM.png` | Likert: left out of conversations |
| `…10.52.30 PM.png` / `…10.53.36 PM.png` | Likert: lose motivation (+ tip) |
| `…10.53.46 PM.png` | Learning styles multi-select |
| `…10.53.52 PM.png` | “Match your style” bridge |
| `…10.53.59 PM.png` | Big-picture vs detail (+ tip) |
| `…10.54.07 PM.png` | Likert: know what you want (+ tip) |
| `…10.54.15 PM.png` | Likert: self-doubt (+ tip) |
| `…10.54.23 PM.png` | Likert: decision paralysis (+ tip) |
| `…10.54.30 PM.png` | Extrovert / Introvert / Both (+ tip) |
| `…10.54.45 PM.png` | Info sources list |
| `…10.54.51 PM.png` / `…10.47.12 PM.png` | “Personal curator” bridge |
| `…10.55.00 PM.png` | Mental energy window (+ tip) |

### PERSONALIZE + social + goals

| File | Screen |
| ---- | ------ |
| `…10.55.06 PM.png` | “Perfect content mix” bridge |
| `…10.55.18 PM.png` | Thought leaders grid |
| `…10.55.24 PM.png` | “Sharp intellectual taste” bridge |
| `…10.47.27 PM.png` | Book Yes/No (7 Habits) |
| `…10.55.31–10.55.55 PM.png` | More book Yes/No cards |
| `…10.56.01 PM.png` | Social proof map |
| `…10.56.09 PM.png` | Life reason multi-select |
| `…10.56.30 PM.png` | Daily learning goal tiers |

### Crafting + payoff + account

| File | Screen |
| ---- | ------ |
| `…10.56.37 PM.png` | Crafting + “Do you self-reflect?” modal |
| `…10.56.43 PM.png` | Crafting checklist progress |
| `…10.56.54 PM.png` | Crafting + “learn while listening?” modal |
| `…10.47.43 PM.png` | Plan ready chart |
| `…10.48.06 PM.png` / `…10.57.06 PM.png` | Email account gate |

---

## 11. Summary

The reference funnel is a **long, staged quiz** that constantly proves it is
listening (echo bridges + reactive tip cards), then runs a **fake plan-crafting
loader** with social proof and last-mile Yes/No questions, shows a **plan-ready
payoff**, and only then asks for email.

Anti-coach should copy that **rhythm and UI primitives**, compress length, swap
books for contrarian scenarios, and wire answers into the existing chat agent +
NextAuth account model.
