# Screen Inventory

## Navigation Structure

```
App Shell
├── Bottom Navigation (mobile) / Left Sidebar (tablet/desktop)
│    ├── Today (dashboard icon)
│    ├── Journal (book icon)
│    ├── Coach (graduation cap icon)
│    ├── Progress (chart icon)
│    └── Profile (person icon)
│
└── Global FAB: "+" (log food)
```

---

## Screen Catalog

### AUTH SCREENS

#### S-AUTH-1: Landing / Welcome
- App logo + tagline
- "Get Started" (→ Onboarding)
- "Sign In" (→ Login)
- "Continue as Guest"

#### S-AUTH-2: Onboarding Steps (1–6)
- Progress indicator (step N of 6)
- Question + input (varies per step)
- Back / Continue
- Skip option where appropriate

#### S-AUTH-3: Summary + Account Creation
- Generated targets overview
- Manual override toggles
- Email + Password fields OR "Skip for now (guest)"

#### S-AUTH-4: Login
- Email + password
- "Forgot password"
- OAuth buttons (Google, optional)

---

### CORE SCREENS

#### S-DASH-1: Today (Dashboard)
**Sections:**
- Date header with streak badge (e.g. "Day 12 🔥")
- **Calorie Ring**: large donut chart, center shows "850 / 1850 kcal"
- **Macro bars**: 4 horizontal bars (protein, carbs, fat, fiber) with g consumed / g target
- **Meal cards**: one card per meal slot (breakfast, lunch, dinner, snacks)
  - Each card: slot name, total kcal, items summary, "+" button
- **Hydration tile**: water glass icon, "1,250 / 2,000 ml" + quick-add buttons (250ml, 500ml)
- **Weight tile**: last weight entry, quick log button
- **Activity tile**: kcal burned today, quick-add button
- Swipe left/right: navigate days

#### S-DASH-2: Meal Slot Expanded
- All entries in a meal slot
- Macros per entry (kcal, protein, carbs, fat)
- Edit / delete swipe actions
- Add food button

---

#### S-LOG-1: Log Food — Entry Point (Modal/Bottom Sheet)
- Four options with icons:
  1. Camera (Photo recognition)
  2. Barcode (Scanner)
  3. Search (Manual)
  4. Mic (Voice)
- Recent entries (last 5, tap to re-log)
- Favorite foods

#### S-LOG-2: Camera / Photo Recognition
- Full-screen camera viewfinder
- Capture button
- Gallery picker
- After capture: loading state → results list

#### S-LOG-3: Recognition Results
- Food image (thumbnail)
- Recognized items list, each with:
  - Name (editable)
  - Weight estimate (editable spinner)
  - Kcal preview (updates live)
  - Remove button
- "Add item manually" button
- Meal slot selector
- Confirm button

#### S-LOG-4: Barcode Scanner
- Camera viewfinder with barcode guide overlay
- "Enter barcode manually" fallback

#### S-LOG-5: Product Detail (after barcode)
- Product name + brand
- Nutrition facts table (per 100g and per serving)
- Serving size picker
- Quantity input
- Meal slot selector
- Add button

#### S-LOG-6: Food Search
- Search bar (autofocus)
- Filter chips: All / My Foods / Branded / Generic
- Results list: name, brand, kcal/100g
- Tabs: search results / recent / favorites

#### S-LOG-7: Food Detail (from search)
- Food name + category
- Nutrition table per 100g
- Serving size dropdown
- Quantity input (g or unit)
- Live calorie/macro preview
- Meal slot selector
- Add button

#### S-LOG-8: Voice Input
- Animated waveform
- Transcribed text shown live
- Recognized items chips (editable)
- Confirm

#### S-LOG-9: Custom Food Creation
- Form: name, brand (optional), serving size label + weight, nutrition per 100g
- Save to "My Foods"

---

#### S-JOURNAL-1: Journal / Food Log
- Calendar strip (weekly view, tap day)
- Day totals: kcal, protein, carbs, fat
- Meals accordion: breakfast / lunch / dinner / snacks
  - Entries within each with full nutrition line
- Edit/delete per entry
- Copy day to today

---

#### S-COACH-1: Coach Home
- Today's lessons queue (2-3 cards)
- Sections:
  - Continue learning (in-progress series)
  - Browse by category (Nutrition, Sleep, Habits, Fitness, Stress)
  - Recipes (preview, → full recipe tab)

#### S-COACH-2: Lesson Detail
- Article title + estimated read time
- Cover illustration
- Body content (markdown rendered)
- Mark complete button
- Related lessons

#### S-COACH-3: Recipes
- Grid/list toggle
- Filter bar: diet type, prep time, calorie range
- Recipe cards: image, title, kcal, time, difficulty badge

#### S-COACH-4: Recipe Detail
- Hero image
- Macros per serving at top (kcal, protein, carbs, fat)
- Prep + cook time, difficulty, servings selector
- Ingredients list (scaled to servings)
- Step-by-step instructions
- "Log this meal" button (→ meal slot picker)
- Favorite toggle

---

#### S-PROGRESS-1: Analytics Overview
- Time range picker: 7d / 30d / 3m / 1y
- Cards:
  - Calorie intake chart (bar + target line)
  - Macro trend (stacked area)
  - Weight curve (scatter + trend)
  - Nutrient coverage (horizontal bar chart vs RDA)
  - Water intake trend
- Export button

#### S-PROGRESS-2: Nutrient Deep Dive
- Select nutrient (macro or micro)
- Daily breakdown
- Top food sources for this nutrient

---

#### S-PROFILE-1: Profile Overview
- Avatar + name
- Summary stats: days logged, streak record, total entries
- Sections:
  - My Goals
  - Body Metrics
  - Dietary Preferences
  - Notifications
  - Units & Language
  - Data & Privacy
  - About / OSS info

#### S-PROFILE-2: Goals Editor
- Current goal card
- Edit goal, target weight, pace
- Recalculate targets button
- Manual macro override

#### S-PROFILE-3: Data & Privacy
- Export data (JSON, CSV)
- Delete all data
- Account deletion
- Link to privacy policy

---

## Responsive Breakpoints

| Viewport | Layout |
|---|---|
| < 640px (mobile) | Bottom nav, full-screen flows, bottom sheets |
| 640–1024px (tablet) | Side panel layout, drawer nav |
| > 1024px (desktop) | Left sidebar nav, 2-column dashboard |

## Global UI Patterns

- **Bottom sheet** for log entry modal on mobile
- **Side panel** for entry detail on tablet/desktop
- **Toast** notifications for successful entries ("Lunch logged — 520 kcal")
- **Skeleton loaders** for all async screens
- **Pull to refresh** on dashboard and journal
- **Offline indicator** banner when no connection (data still logged locally, syncs when back online)
