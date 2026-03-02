# API Specification

## Conventions

- Base path: `/api/v1`
- Auth: Bearer token (JWT) in `Authorization` header
- Dates: ISO 8601 (`2025-03-02`)
- Weights: always grams (decimal)
- Calories: always kcal (decimal)
- Errors: `{ error: string, code: string, details?: object }`

---

## Auth

```
POST   /api/auth/register        Body: {email, password, name?}
POST   /api/auth/login           Body: {email, password}
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password Body: {email}
POST   /api/auth/reset-password  Body: {token, password}
```

---

## User Profile

```
GET    /api/v1/profile           → UserProfile + DailyTargets
PUT    /api/v1/profile           Body: Partial<UserProfile>
POST   /api/v1/profile/recalculate-targets  → new DailyTargets
```

---

## Food Database

```
GET    /api/v1/foods/search      ?q=chicken&limit=20&offset=0
GET    /api/v1/foods/:id
GET    /api/v1/foods/barcode/:barcode
POST   /api/v1/foods             Body: CreateFoodDto   (user custom food)
PUT    /api/v1/foods/:id         (own foods only)
DELETE /api/v1/foods/:id         (own foods only)

GET    /api/v1/foods/recent      → last 20 logged foods for user
GET    /api/v1/foods/favorites   → user favorites
POST   /api/v1/foods/:id/favorite
DELETE /api/v1/foods/:id/favorite
```

### Search Response

```typescript
{
  items: FoodSearchItem[]
  total: number
  source: "local" | "usda" | "openfoodfacts"
}

FoodSearchItem {
  id: string
  name: string
  brandName: string | null
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  servingSizes: ServingSize[]
  source: string
}
```

---

## Meal Logging

```
GET    /api/v1/logs/:date               → DailyLog (all entries for date)
POST   /api/v1/logs/:date/meals         Body: CreateMealEntryDto
PUT    /api/v1/logs/meals/:entryId      Body: UpdateMealEntryDto
DELETE /api/v1/logs/meals/:entryId

POST   /api/v1/logs/:date/water         Body: {amountMl: number}
DELETE /api/v1/logs/water/:entryId

POST   /api/v1/logs/:date/weight        Body: {weightKg: number, note?: string}
PUT    /api/v1/logs/weight/:entryId
DELETE /api/v1/logs/weight/:entryId

POST   /api/v1/logs/:date/activities    Body: CreateActivityEntryDto
PUT    /api/v1/logs/activities/:entryId
DELETE /api/v1/logs/activities/:entryId
```

### Daily Log Response

```typescript
DailyLog {
  date: string
  summary: {
    caloriesConsumed: number
    caloriesTarget: number
    caloriesBurned: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
    waterMl: number
    waterTargetMl: number
    weightKg: number | null
  }
  meals: {
    slot: MealSlot
    entries: MealEntry[]
    totalKcal: number
  }[]
  water: WaterEntry[]
  activities: ActivityEntry[]
}
```

---

## Photo Recognition

```
POST   /api/v1/recognize/photo
  Body: multipart/form-data { image: File }
  → { jobId: string }

# Client subscribes to SSE stream — no polling
GET    /api/v1/recognize/photo/:jobId/stream   (text/event-stream)
  Events:
    data: { status: "processing" }
    data: { status: "done", items: RecognizedItem[] }
    data: { status: "failed", error: string }

# Fallback for environments without SSE support
GET    /api/v1/recognize/photo/:jobId
  → { status: "pending" | "done" | "failed", items?: RecognizedItem[], error?: string }

RecognizedItem { name: string, weightG: number, confidence: number, food?: FoodSearchItem }
```

---

## Analytics

```
GET    /api/v1/analytics/summary?from=2025-01-01&to=2025-03-01
  → {
      days: DailySummary[]        // one per day in range
      averages: {...}
      streaks: { current: number, best: number }
    }

GET    /api/v1/analytics/nutrients?from=...&to=...
  → per-day nutrient totals

GET    /api/v1/analytics/weight?from=...&to=...
  → weight entries + trend line

GET    /api/v1/analytics/foods/top?from=...&to=...&limit=10
  → most logged foods in period
```

---

## Recipes

```
GET    /api/v1/recipes           ?diet=vegan&maxTime=30&maxCalories=600&q=chicken
GET    /api/v1/recipes/:id
POST   /api/v1/recipes           Body: CreateRecipeDto  (user recipes)
PUT    /api/v1/recipes/:id       (own or admin)
DELETE /api/v1/recipes/:id

POST   /api/v1/recipes/:id/favorite
DELETE /api/v1/recipes/:id/favorite
GET    /api/v1/recipes/favorites

POST   /api/v1/recipes/:id/log   Body: {date, mealSlot, servings}
  → creates MealEntry for each ingredient
```

---

## Educational Content

```
GET    /api/v1/lessons           ?category=nutrition&limit=20
GET    /api/v1/lessons/:id
GET    /api/v1/lessons/today     → today's queued lessons for user
POST   /api/v1/lessons/:id/complete
GET    /api/v1/lessons/progress  → { completed: number, total: number, byCategory: {...} }
```

---

## Exercises

```
GET    /api/v1/exercises         ?q=running&category=cardio
GET    /api/v1/exercises/:id
```

---

## Data Export

```
GET    /api/v1/export/json       → full user data as JSON
GET    /api/v1/export/csv        → meal logs as CSV
```

---

## Error Codes

| Code | HTTP | Description |
|---|---|---|
| `unauthorized` | 401 | Missing or invalid token |
| `forbidden` | 403 | Resource not owned by user |
| `not_found` | 404 | Resource not found |
| `validation_error` | 422 | Request body invalid |
| `barcode_not_found` | 404 | Barcode not in any database |
| `recognition_failed` | 422 | Photo recognition returned no results |
| `food_db_unavailable` | 503 | External food DB unreachable |
