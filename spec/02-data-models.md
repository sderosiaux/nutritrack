# Data Models

## Entity Relationship Diagram

```
User
 ├── UserProfile (1:1)
 ├── DailyLog (1:N) — one per day
 │    ├── MealEntry (1:N) — foods logged
 │    ├── WaterEntry (1:N)
 │    ├── WeightEntry (0:1)
 │    └── ActivityEntry (1:N)
 ├── LessonProgress (1:N)
 └── FavoriteRecipes (1:N)

Food (global database)
 └── FoodEntry references Food

Recipe
 └── RecipeIngredient references Food

Lesson (content library)
Exercise (activity library)
```

---

## Core Models

### User

```typescript
User {
  id:         uuid
  email:      string (unique)
  createdAt:  timestamp
  lastActiveAt: timestamp
}
```

### UserProfile

```typescript
UserProfile {
  userId:          uuid (FK → User)

  // Demographics
  displayName:     string
  birthDate:       date
  biologicalSex:   enum(male, female, other, prefer_not_to_say)

  // Body metrics
  currentWeightKg: decimal
  heightCm:        decimal

  // Goals
  goal:            enum(lose_weight, maintain, build_muscle, eat_healthier)
  targetWeightKg:  decimal | null
  weeklyPaceKg:    decimal | null   // e.g. 0.5 = 0.5kg/week
  activityLevel:   enum(sedentary, light, moderate, active, very_active)

  // Dietary
  dietaryRestrictions: string[]   // vegetarian, vegan, gluten_free, etc.
  allergies:           string[]

  // Preferences
  units:           enum(metric, imperial)
  language:        string          // BCP-47 locale code
  timezone:        string          // IANA tz
}
```

### DailyTargets (computed, cached)

```typescript
DailyTargets {
  userId:       uuid
  date:         date

  caloriesKcal: integer
  proteinG:     decimal
  carbsG:       decimal
  fatG:         decimal
  fiberG:       decimal
  waterMl:      integer

  // Recalculated on profile change
  calculatedAt: timestamp
}
```

---

### Food (Database Item)

```typescript
Food {
  id:           uuid

  // Identity
  name:         string
  nameTranslations: Record<locale, string>
  brandName:    string | null
  barcode:      string | null       // EAN-13, UPC

  // Source
  source:       enum(usda, open_food_facts, user_created, admin)
  sourceId:     string | null       // original DB ID

  // Nutrition per 100g
  caloriesPer100g:  decimal
  proteinPer100g:   decimal
  carbsPer100g:     decimal
  fatPer100g:       decimal
  fiberPer100g:     decimal
  sugarPer100g:     decimal | null
  sodiumMgPer100g:  decimal | null
  saturatedFatPer100g: decimal | null

  // Micronutrients per 100g (optional, sparse)
  micronutrients:   Record<string, decimal>  // e.g. vitamin_c_mg, iron_mg

  // Serving sizes
  servingSizes:     ServingSize[]
  defaultServingId: uuid

  // Meta
  category:         string | null
  imageUrl:         string | null
  verified:         boolean
  createdAt:        timestamp
}

ServingSize {
  id:           uuid
  foodId:       uuid
  label:        string    // "1 cup", "1 slice", "100g"
  weightG:      decimal
}
```

### MealEntry

```typescript
MealEntry {
  id:           uuid
  userId:       uuid
  date:         date
  mealSlot:     enum(breakfast, morning_snack, lunch, afternoon_snack, dinner, evening_snack, other)
  loggedAt:     timestamp

  // Food reference
  foodId:       uuid | null        // null if custom text entry
  recipeId:     uuid | null        // if logging a recipe
  customName:   string | null

  // Quantity
  servingSizeId: uuid | null
  quantityG:    decimal            // always stored in grams
  servingLabel: string             // display label e.g. "2 slices"

  // Computed snapshot (denormalized for perf)
  caloriesKcal: decimal
  proteinG:     decimal
  carbsG:       decimal
  fatG:         decimal
  fiberG:       decimal

  // Source of entry
  source:       enum(manual, barcode, photo, voice, quick_add, recipe)
  photoUrl:     string | null

  notes:        string | null
}
```

### WaterEntry

```typescript
WaterEntry {
  id:        uuid
  userId:    uuid
  date:      date
  loggedAt:  timestamp
  amountMl:  integer
}
```

### WeightEntry

```typescript
WeightEntry {
  id:        uuid
  userId:    uuid
  date:      date
  loggedAt:  timestamp
  weightKg:  decimal
  note:      string | null
}
```

### ActivityEntry

```typescript
ActivityEntry {
  id:            uuid
  userId:        uuid
  date:          date
  loggedAt:      timestamp

  exerciseId:    uuid | null
  customName:    string | null
  durationMin:   integer
  intensityLevel: enum(low, moderate, high) | null
  caloriesBurned: decimal    // estimated

  notes:         string | null
}

Exercise {
  id:        uuid
  name:      string
  category:  enum(cardio, strength, flexibility, sports, daily_activity)
  metValue:  decimal    // MET for moderate intensity
  metLow:    decimal
  metHigh:   decimal
}
```

---

### Recipe

```typescript
Recipe {
  id:           uuid

  title:        string
  description:  string | null
  coverImageUrl: string | null

  authorId:     uuid | null     // null = system recipe
  source:       enum(system, user_created)
  sourceUrl:    string | null

  servings:     integer
  prepTimeMins: integer
  cookTimeMins: integer
  difficulty:   enum(easy, medium, hard)

  tags:         string[]        // e.g. ['vegan', 'high_protein', 'quick']

  ingredients:  RecipeIngredient[]
  steps:        string[]        // ordered list of step text

  // Computed per serving
  caloriesPerServing: decimal
  proteinPerServing:  decimal
  carbsPerServing:    decimal
  fatPerServing:      decimal
  fiberPerServing:    decimal

  published:    boolean
  createdAt:    timestamp
}

RecipeIngredient {
  recipeId:      uuid
  foodId:        uuid
  quantityG:     decimal
  displayLabel:  string    // "2 tbsp olive oil"
  optional:      boolean
}
```

---

### Lesson (Educational Content)

```typescript
Lesson {
  id:            uuid
  slug:          string (unique)

  title:         string
  summary:       string
  bodyMarkdown:  string

  category:      enum(nutrition, sleep, stress, habits, fitness, mindfulness)
  tags:          string[]

  readTimeMin:   integer
  illustrationUrl: string | null

  order:         integer       // sort within category
  publishedAt:   date | null
}

LessonProgress {
  userId:        uuid
  lessonId:      uuid
  completedAt:   timestamp | null
  queuedAt:      timestamp
}
```

---

## Computed / Derived Values

### Daily Summary (query, not stored)

```typescript
DailySummary {
  date:           date
  caloriesConsumed: decimal
  caloriesBurned:   decimal
  caloriesNet:      decimal
  targetCalories:   decimal

  proteinG:       decimal
  carbsG:         decimal
  fatG:           decimal
  fiberG:         decimal

  waterMl:        integer
  targetWaterMl:  integer

  weight:         decimal | null

  mealsLogged:    integer
  activitiesLogged: integer
}
```

### Calorie Calculation (TDEE)

```
TDEE = BMR × ActivityMultiplier

BMR (Mifflin-St Jeor):
  Male:   10 × weightKg + 6.25 × heightCm − 5 × age + 5
  Female: 10 × weightKg + 6.25 × heightCm − 5 × age − 161

ActivityMultiplier:
  sedentary:    1.2
  light:        1.375
  moderate:     1.55
  active:       1.725
  very_active:  1.9

CalorieTarget:
  maintain:      TDEE
  lose_weight:   TDEE − (weeklyPaceKg × 7700 / 7)   // 7700 kcal/kg
  build_muscle:  TDEE + (weeklyPaceKg × 7700 / 7)

MacroSplit (defaults per WHO/DRI guidelines, user-configurable):
  protein: 0.20 × calories / 4    // g  (20% — standard, not high-protein)
  fat:     0.30 × calories / 9    // g
  carbs:   0.50 × calories / 4    // g
```
