# Feature Specification

## Feature Map

```
App
├── Onboarding
│   ├── Goal selection
│   ├── Profile setup (age, gender, weight, height)
│   ├── Dietary preferences
│   ├── Lifestyle questionnaire
│   └── Calorie/macro target generation
│
├── Food Logging (Journal)
│   ├── Photo recognition
│   ├── Barcode scanner
│   ├── Manual search (food database)
│   ├── Voice input
│   ├── Quick-add (free text, multiple items)
│   ├── Recent meals / favorites
│   └── Meal slots (breakfast, lunch, dinner, snacks)
│
├── Dashboard (Today)
│   ├── Calorie ring / progress bar
│   ├── Macro breakdown (protein, carbs, fat, fiber)
│   ├── Hydration tracker
│   ├── Weight log
│   ├── Activity summary
│   └── Daily streak (rule: ≥1 food entry logged = streak day; no calorie-target pressure)
│
├── Analytics
│   ├── Calorie trend chart (7d / 30d / 90d)
│   ├── Macro distribution over time
│   ├── Weight curve
│   ├── Nutrient deep-dive (vitamins, minerals)
│   └── Meal timing heatmap
│
├── Coach / Learn
│   ├── Daily lessons (bite-sized, 2-3/day)
│   ├── Lesson categories (nutrition, sleep, stress, habits)
│   └── Progress tracker per topic
│
├── Recipes
│   ├── Recipe browser (filter by goal, time, diet)
│   ├── Recipe detail (ingredients, steps, macros)
│   ├── Log a recipe directly
│   └── Custom recipe builder
│
├── Activity
│   ├── Exercise database
│   ├── Log workout (type, duration, intensity)
│   ├── Calorie burn calculation
│   └── (Optional) Fitness tracker sync
│
└── Profile / Settings
    ├── Goals editor
    ├── Notification settings
    ├── Units (metric/imperial)
    ├── Language
    ├── Data export (CSV / JSON)
    └── Account management
```

---

## Feature Details

### F1 — Onboarding

**Goal**: Collect enough context to generate personalized daily targets.

Steps:
1. **Goal selection** — Lose weight / Maintain / Build muscle / Eat healthier
2. **Demographics** — Age, biological sex, current weight, height
3. **Activity level** — Sedentary / Light / Moderate / Active / Very active
4. **Dietary restrictions** — Vegetarian, vegan, gluten-free, lactose-free, halal, kosher, none
5. **Health context** — Optional: allergies, medical conditions
6. **Target weight** (if goal is lose/gain) + pace selection (mild / moderate / aggressive)
7. **Summary screen** — Generated calorie target + macro split, editable

Output: `UserProfile` with `DailyTargets` (calories, protein g, carbs g, fat g, fiber g, water ml)

---

### F2 — Food Logging

#### F2.1 — Photo Recognition
- User takes or uploads a photo
- System identifies food items and estimates portions
- User sees a list of recognized items with quantities (editable)
- User confirms or adjusts → entry saved
- Accuracy disclaimer shown for complex/mixed dishes

#### F2.2 — Barcode Scanner
- Camera opens, scans barcode
- Lookup via Open Food Facts API → product details
- Show product macros per serving, user selects quantity
- Fallback: manual entry if barcode not found

#### F2.3 — Manual Search
- Text search against local food DB + USDA FoodData Central
- Fuzzy search, ranking priority: (1) user's recent/frequent items → (2) exact name match → (3) verified generic foods → (4) branded products
- Select serving size from predefined options or custom weight (g/oz)
- Support search in multiple languages

#### F2.4 — Voice Input
- Press mic button, speak naturally: "two eggs and a banana"
- NLP parses items → populates search suggestions
- User confirms each item

#### F2.5 — Quick Add
- Free-text field: type everything eaten in one sentence
- Parse with NLP → bulk add multiple items

#### F2.6 — Meal Slots
- Breakfast / Morning snack / Lunch / Afternoon snack / Dinner / Evening snack
- Custom slot names allowed
- Copy meal from previous day

---

### F3 — Dashboard

**Today view** shows:
- Calorie ring: consumed / target, with net calories
- Macro bars: protein / carbs / fat / fiber (g and % of target)
- Hydration: cups/glasses logged, quick +250ml button
- Weight: today's entry, delta from last log
- Activity: cal burned today
- Meals logged today: cards per meal slot

Interactions:
- Tap calorie ring → full nutrition breakdown
- Tap any macro bar → macro detail + sources
- Long press meal card → edit / delete

---

### F4 — Analytics

Charts (all time ranges: 7d, 30d, 3m, 1y):
- **Calorie intake** line chart with target line
- **Macro split** stacked area
- **Weight** scatter + trend line
- **Nutrient coverage** horizontal bar chart (vitamins, minerals vs RDA — radar charts are too hard to read)
- **Meal timing** — when in the day user eats

Export: all data as CSV or JSON

---

### F5 — Educational Content (Coach)

- Content stored as structured Markdown articles in DB
- Tagged by category: nutrition / sleep / stress / habits / fitness
- 2-3 new lessons unlocked per day (queue)
- Lesson cards: title + estimated read time + illustration
- Mark complete → progress tracked
- Seed data: 20+ open-licensed articles (v1), extensible

---

### F6 — Recipes

Fields per recipe: title, description, cover image, prep time, cook time, difficulty, servings, ingredients (with amounts), steps, tags, source URL, nutrition per serving (auto-calculated from ingredients).

Features:
- Browse with filters: diet type, max prep time, calorie range, goal alignment
- Log recipe → creates entries for all ingredients in selected meal slot
- Custom recipe builder: add any food DB items as ingredients, system calculates macros
- Favorite recipes

---

### F7 — Activity

- Search exercise library (200+ activities, METs-based calorie calculation)
- Log: activity + duration + optional intensity modifier
- Results: estimated kcal burned added to dashboard
- Fitness tracker sync: optional, via standard APIs (Google Fit / Apple Health via PWA where supported)

---

### F8 — Profile & Settings

- Edit all onboarding data at any time
- Recalculate targets when body metrics or goals change
- Units: metric (kg, cm, ml) / imperial (lbs, ft, oz)
- Notification schedule: daily reminders per meal slot
- Privacy: full local data export, account deletion
- Open-source: link to repo, self-hosting docs
