# Milestones & Build Order

## Milestone 0 — Foundation
*Everything else depends on this.*

- [ ] Monorepo setup (pnpm, Next.js 15, TypeScript, Tailwind v4)
- [ ] Docker Compose: PostgreSQL, Redis
- [ ] Drizzle ORM schema + migrations (User, Food, MealEntry, DailyLog)
- [ ] Better Auth: email/password + JWT
- [ ] Design system: tokens, typography, base components (Button, Input, Card)
- [ ] App shell: navigation, routing, layout breakpoints

---

## Milestone 1 — Core Log Loop
*Users can track what they eat.*

Depends on: M0

- [ ] Food database seeding (USDA + Open Food Facts top 50k)
- [ ] Food search API + UI (text search, recent, favorites)
- [ ] Manual food entry flow (search → detail → add to meal)
- [ ] Barcode scanner (ZXing → Open Food Facts lookup)
- [ ] Today dashboard: calorie ring, macro bars, meal cards
- [ ] Meal slot management (add / edit / delete entries)
- [ ] Daily log screen (journal view)
- [ ] Hydration tracker

---

## Milestone 2 — Profile & Personalization
*Targets are meaningful.*

Depends on: M1

- [ ] Onboarding flow (6 steps)
- [ ] TDEE / calorie target calculation (Mifflin-St Jeor)
- [ ] UserProfile + DailyTargets storage
- [ ] Weight logging
- [ ] Profile editor (goals, dietary prefs, units)
- [ ] Dashboard wired to personal targets

---

## Milestone 3 — AI Food Recognition
*The "wow" feature.*

Depends on: M1

- [ ] MinIO setup for image upload
- [ ] BullMQ job for async photo analysis
- [ ] Ollama integration (LLaVA model, local)
- [ ] OpenAI Vision fallback (env-configurable)
- [ ] Photo capture UI + recognition results screen
- [ ] Voice input (Web Speech API)
- [ ] Quick-add text parsing

---

## Milestone 4 — Analytics
*Make progress visible.*

Depends on: M1, M2

- [ ] Analytics API (aggregations by date range)
- [ ] Calorie trend chart (Recharts)
- [ ] Macro breakdown chart
- [ ] Weight curve
- [ ] Streak calculation + badge
- [ ] Data export (CSV, JSON)

---

## Milestone 5 — Coach / Content
*Habit-building layer.*

Depends on: M0

- [ ] Lesson DB schema + seed content (20+ articles)
- [ ] Lesson queue system (2-3/day)
- [ ] Lesson detail view (markdown rendered)
- [ ] Progress tracking per category
- [ ] Recipe database + seed (30+ recipes)
- [ ] Recipe browser + filter
- [ ] Recipe detail + log action
- [ ] Custom recipe builder

---

## Milestone 6 — PWA & Polish
*Feels like a native app.*

Depends on: M1–M5

- [ ] Service worker (Workbox) — offline read
- [ ] Background sync — offline log entries sync on reconnect
- [ ] Push notifications (meal reminders)
- [ ] Install prompt (Add to Home Screen)
- [ ] Skeleton loaders everywhere
- [ ] Animations: calorie ring fill, toast, sheet spring
- [ ] Milestone celebrations (streak record, goal reached)
- [ ] Accessibility audit (WCAG AA)

---

## Milestone 7 — Self-Hosting & Docs
*Anyone can run it.*

Depends on: all

- [ ] Docker Compose production config
- [ ] Environment variables documentation
- [ ] Seed command for fresh install
- [ ] One-click deploy templates (Railway, Render)
- [ ] Contributing guide
- [ ] README with screenshots

---

## What's Not In v1

- Native iOS/Android app
- Human nutritionist chat
- Fitness tracker deep integration (Garmin, Fitbit)
- Social features (sharing meals, friends)
- AI-generated meal plans
- Restaurant menu lookup
- Multi-user household
