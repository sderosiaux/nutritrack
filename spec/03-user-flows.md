# User Flows

## Flow 1 — Onboarding (New User)

```
Landing page
  → "Get Started"
     → [1/6] Goal selection
          Lose weight | Build muscle | Maintain weight | Eat healthier
       → [2/6] Demographics
            Name (optional), Age, Sex, Height, Current weight
         → [3/6] Activity level
              Sedentary / Light / Moderate / Active / Very Active
              (brief descriptions of each)
            → [4/6] Dietary restrictions (multi-select)
                 None / Vegetarian / Vegan / Gluten-free / Lactose-free / ...
               → [5/6] Target & pace (if lose/gain goal)
                    Target weight: numeric input (kg or lbs) — no slider (imprecise)
                    Pace: Gentle (-0.25kg/wk) | Moderate (-0.5) | Aggressive (-1)
                  → [6/6] Summary screen
                        Your daily target: 1,850 kcal
                        Protein: 139g | Carbs: 185g | Fat: 62g
                        Water: 2,000ml
                        [Edit targets manually]
                       → Account creation (email + password) OR continue as guest
                         → Dashboard (Today)
```

**Guest mode**: full functionality, data in IndexedDB (Dexie.js). Persistent but non-intrusive "Back up your data →" banner. No forced signup prompts.

---

## Flow 2 — Log Food (Photo)

```
Dashboard → "+" button → "Take a Photo"
  → Camera opens (or file picker on desktop)
    → User takes/selects photo
      → Loading: "Analyzing your meal..."
        → Recognition results:
             [✓] Pasta ~150g — 220 kcal
             [✓] Tomato sauce ~80g — 45 kcal
             [?] Unclear item — "What is this?"
          → User edits quantities / removes items / adds missing items
            → Select meal slot: Breakfast | Lunch | Dinner | Snack
              → "Save" → Dashboard updated
```

Fallback: if recognition fails or confidence < threshold → "Couldn't identify, try again or search manually"

---

## Flow 3 — Log Food (Barcode)

```
Dashboard → "+" → "Scan Barcode"
  → Camera opens with barcode overlay
    → Scan detected
      → Lookup: Open Food Facts API
        → Product found:
             "Nutella 400g" — Ferrero
             Per 100g: 539 kcal | 6.3g prot | 57.5g carbs | 31g fat
             Serving size: 15g (1 tbsp)
             Quantity: [  2  ] tbsp ← editable
           → "Add to [Breakfast ▾]" → saved
        → Product NOT found:
             "Barcode not in database"
             → Manual entry with product name pre-filled
```

---

## Flow 4 — Log Food (Manual Search)

```
Dashboard → "+" → "Search"
  → Search field (autofocus)
    → User types "chicken breast"
      → Results list (fuzzy ranked):
           Chicken breast, grilled — 165 kcal/100g
           Chicken breast, raw — 120 kcal/100g
           Chicken breast, breaded — 220 kcal/100g
           ...
        → User taps item
          → Detail screen:
               Serving size: [100g ▾] ← dropdown of predefined + custom
               Quantity: [  150  ] g
               Preview: 248 kcal | 46g protein | 0g carbs | 3.6g fat
             → Add to [Lunch ▾] → saved
```

---

## Flow 5 — Daily Dashboard Loop

```
Open app
  → Today view
    → See calorie ring (e.g. 850/1850 kcal)
    → Tap "+" to log next meal
    → Check hydration — tap "+250ml"
    → View meal cards — tap to edit/delete
    → Swipe to yesterday/tomorrow
    → Check streak badge
```

---

## Flow 6 — Weekly Check-In (Recurring)

```
Weekly notification: "Time for your check-in!"
  → Weigh-in prompt:
       Current weight: [___] kg
       Delta from last week: −0.4 kg 🎉
     → Optional: update goal pace if not on track
       → Lesson recommendation based on progress:
            "You're on track! Here's how to maintain momentum..."
```

---

## Flow 7 — Browse & Log Recipe

```
Coach tab → Recipes
  → Filter: [All ▾] [< 30min ▾] [High Protein ▾]
    → Recipe card: "Greek Chicken Bowl"
         510 kcal | 42g protein | 35min | ★★
       → Recipe detail:
            Cover image
            Ingredients list with macros
            Step-by-step instructions
            Total nutrition per serving
          → "Log this meal" → select slot + portions → saved
          → "Save to favorites"
```

---

## Flow 8 — Lesson / Learn

```
Coach tab → Today's Lessons (2 cards)
  → Tap lesson: "Why fiber matters"
    → Full article (3-minute read)
      → Mark complete → progress bar fills
        → Unlock next lesson in series
```

---

## Flow 9 — Analytics

```
Profile tab → "My Progress"
  → Default: last 7 days
    → Calorie chart: bar per day, target line
    → Macro trend: toggle protein / carbs / fat
    → Weight: scatter + LOESS trend
    → Switch to 30d / 3m / 1y
      → Export: [Download CSV]
```

---

## Flow 10 — Edit Profile / Goals

```
Profile tab → Edit Goals
  → Change goal: lose weight → maintain
    → Recalculate? [Yes] → new targets applied from today
  → Edit macros manually:
       Protein: 160g (was 139g)
       [Recalculate remaining from calories ✓]
```

---

## Error States

| Situation | Behavior |
|---|---|
| No internet, barcode scan | Show cached result or "Check connection" |
| Food not in DB (manual) | "Add custom food" form |
| Photo recognition fails | Fallback to manual search with dish name pre-filled |
| Daily target not set | Prompt to complete onboarding |
| No data in analytics | Empty state: "Start logging to see trends" |
