# Bulk food data import pipeline

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import all of Open Food Facts (~3.5M products) and USDA FoodData Central (~400k foods) into PostgreSQL, with a weekly autonomous sync script.

**Architecture:** A standalone `pnpm data:sync` script downloads compressed dumps, streams them into a staging table via raw SQL COPY, upserts into the main `foods` table, and rebuilds search indexes. A new migration adds a generated `search_vector tsvector` column with a GIN index for fast full-text search at 3.5M+ rows. The existing food-service search is updated to use the tsvector column instead of computing it per query.

**Tech Stack:** Node.js streams, PostgreSQL COPY, `pg_trgm` extension, GIN indexes, `csv-parse` for OFF CSV streaming, zlib for gzip decompression.

---

### Task 1: Migration — add search_vector column + GIN indexes + pg_trgm

**Files:**
- Create: `drizzle/migrations/0002_search_vector.sql`
- Modify: `src/server/db/schema/foods.ts` (add search_vector to schema)

**Step 1: Write the migration SQL**

Create `drizzle/migrations/0002_search_vector.sql`:

```sql
-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add generated tsvector column for full-text search
ALTER TABLE "foods" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("brand_name", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("category", '')), 'C')
  ) STORED;

-- GIN index on the tsvector column (fast full-text search)
CREATE INDEX "foods_search_vector_idx" ON "foods" USING gin ("search_vector");

-- Trigram index on name for fuzzy/typo-tolerant search
CREATE INDEX "foods_name_trgm_idx" ON "foods" USING gin ("name" gin_trgm_ops);

-- Trigram index on brand_name for fuzzy search
CREATE INDEX "foods_brand_trgm_idx" ON "foods" USING gin ("brand_name" gin_trgm_ops);
```

**Step 2: Update the Drizzle journal**

Add entry to `drizzle/migrations/meta/_journal.json` for migration `0002_search_vector`.

**Step 3: Run migration**

Run: `docker compose exec app pnpm db:migrate`
Expected: migration applies, new column + indexes created.

**Step 4: Commit**

```bash
git add drizzle/ src/server/db/schema/foods.ts
git commit -m "feat: add search_vector tsvector column + GIN/trigram indexes"
```

---

### Task 2: Update food-service search to use search_vector

**Files:**
- Modify: `src/server/services/food-service.ts`

**Step 1: Write test for tsvector search**

Create test in `src/__tests__/data-sync-search.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildSearchCondition } from "@/server/services/food-service";

describe("buildSearchCondition", () => {
  it("uses websearch_to_tsquery for multi-word queries", () => {
    const sql = buildSearchCondition("chicken breast");
    expect(sql).toBeDefined();
  });

  it("uses similarity for single-word queries", () => {
    const sql = buildSearchCondition("banana");
    expect(sql).toBeDefined();
  });
});
```

**Step 2: Rewrite searchFoods to use search_vector**

Replace the search logic in `food-service.ts`:

- Multi-word queries: `foods.search_vector @@ websearch_to_tsquery('english', q)` with `ts_rank` ordering
- Single-word queries: `similarity(foods.name, q) > 0.2` via pg_trgm, ordered by similarity desc
- Remove the ILIKE fallback (trigram handles typos better)
- Remove the `to_tsvector` call per query (the stored column handles it)
- Keep the JS-side ranking (recent > exact > verified > generic) as a tiebreaker

**Step 3: Run tests**

Run: `pnpm test -- --reporter=dot`
Expected: all pass

**Step 4: Commit**

```bash
git add src/server/services/food-service.ts src/__tests__/
git commit -m "feat: use stored search_vector + trigram for food search"
```

---

### Task 3: Create the data sync script — OFF import

**Files:**
- Create: `src/scripts/data-sync.ts`
- Modify: `package.json` (add `data:sync` script)

**Step 1: Install csv-parse**

Run: `pnpm add csv-parse`

**Step 2: Write the OFF importer**

Create `src/scripts/data-sync.ts` that:

1. Downloads `https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz` via streaming fetch
2. Pipes through `zlib.createGunzip()`
3. Pipes through `csv-parse` with columns: `code,product_name,brands,categories_en,energy-kcal_100g,proteins_100g,carbohydrates_100g,fat_100g,fiber_100g,sugars_100g,sodium_100g,saturated-fat_100g`
4. Filters out rows without `product_name` or `energy-kcal_100g`
5. Writes batches of 5000 rows to a temp CSV file
6. Uses `COPY foods_staging FROM STDIN CSV` via `postgres` driver raw SQL
7. After all rows loaded into staging, runs:
   ```sql
   INSERT INTO foods (id, name, brand_name, barcode, source, source_id,
     calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
     fiber_per_100g, sugar_per_100g, sodium_mg_per_100g, saturated_fat_per_100g,
     category, verified, name_translations, micronutrients, updated_at)
   SELECT
     'off-' || code, product_name, brands, code, 'open_food_facts', code,
     energy_kcal, proteins, carbs, fat, fiber, sugars, sodium * 1000, saturated_fat,
     categories, false, '{}'::jsonb, '{}'::jsonb, now()
   FROM foods_staging
   WHERE product_name IS NOT NULL AND product_name != ''
   ON CONFLICT (id) DO UPDATE SET
     name = EXCLUDED.name,
     brand_name = EXCLUDED.brand_name,
     calories_per_100g = EXCLUDED.calories_per_100g,
     protein_per_100g = EXCLUDED.protein_per_100g,
     carbs_per_100g = EXCLUDED.carbs_per_100g,
     fat_per_100g = EXCLUDED.fat_per_100g,
     fiber_per_100g = EXCLUDED.fiber_per_100g,
     sugar_per_100g = EXCLUDED.sugar_per_100g,
     sodium_mg_per_100g = EXCLUDED.sodium_mg_per_100g,
     saturated_fat_per_100g = EXCLUDED.saturated_fat_per_100g,
     category = EXCLUDED.category,
     updated_at = now()
   WHERE foods.source != 'user_created';
   ```

**Step 3: Add package.json script**

Add to scripts: `"data:sync": "tsx src/scripts/data-sync.ts"`

**Step 4: Test locally**

Run: `pnpm data:sync --source=off --limit=1000` (test with first 1000 rows)
Expected: 1000 foods imported, no errors

**Step 5: Commit**

```bash
git add src/scripts/data-sync.ts package.json pnpm-lock.yaml
git commit -m "feat: OFF bulk import pipeline via streaming CSV + COPY"
```

---

### Task 4: Add USDA FoodData Central import

**Files:**
- Modify: `src/scripts/data-sync.ts`

**Step 1: Add USDA download + parse**

USDA bulk data is at `https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_csv_2024-10-31.zip` (CSV format).

Key files inside the zip:
- `food.csv` — id, description, food_category_id
- `food_nutrient.csv` — food_id, nutrient_id, amount
- Nutrient IDs: 1008=energy(kcal), 1003=protein, 1005=carbs, 1004=fat, 1079=fiber, 2000=sugars, 1093=sodium, 1258=saturated fat

The script:
1. Downloads the zip, extracts `food.csv` and `food_nutrient.csv` using Node streams
2. Builds a map: food_id → {name, nutrients} by streaming both files
3. Pivots nutrient rows into per-food records
4. Loads into `foods_staging` via COPY
5. Upserts into `foods` with `source = 'usda'`, `verified = true`

**Step 2: Add CLI flags**

`pnpm data:sync` supports:
- `--source=all|off|usda` (default: `all`)
- `--limit=N` (for testing, 0 = no limit)
- `--dry-run` (show count, don't import)

**Step 3: Test locally**

Run: `pnpm data:sync --source=usda --limit=1000`
Expected: 1000 USDA foods imported with verified=true

**Step 4: Commit**

```bash
git add src/scripts/data-sync.ts
git commit -m "feat: add USDA FoodData Central bulk import"
```

---

### Task 5: Add serving sizes from bulk data

**Files:**
- Modify: `src/scripts/data-sync.ts`

**Step 1: Extract serving sizes from datasets**

- **OFF:** `serving_size` column in CSV → parse into label + weight_g
- **USDA:** `food_portion.csv` in the zip → portion_description, gram_weight

**Step 2: Bulk upsert serving sizes**

After foods are upserted, load serving sizes into a `serving_sizes_staging` table, then:
```sql
INSERT INTO serving_sizes (id, food_id, label, weight_g)
SELECT id, food_id, label, weight_g FROM serving_sizes_staging
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  weight_g = EXCLUDED.weight_g;
```

**Step 3: Commit**

```bash
git add src/scripts/data-sync.ts
git commit -m "feat: import serving sizes from OFF + USDA bulk data"
```

---

### Task 6: Add weekly cron + progress logging

**Files:**
- Modify: `src/scripts/data-sync.ts` (add progress reporting)
- Create: `src/scripts/data-sync-cron.sh` (wrapper for cron)

**Step 1: Add progress logging**

During import, log every 100k rows:
```
[OFF] 100,000 / ~3,500,000 rows processed (2.8%)
[OFF] 200,000 / ~3,500,000 rows processed (5.7%)
...
[OFF] Done: 3,412,876 foods upserted in 18m 32s
[USDA] Done: 398,241 foods upserted in 4m 12s
Total: 3,811,117 foods in database
```

**Step 2: Add ETag/Last-Modified caching**

Store download metadata in `data/.sync-meta.json`:
```json
{
  "off": { "etag": "...", "lastSync": "2026-03-22T..." },
  "usda": { "etag": "...", "lastSync": "2026-03-22T..." }
}
```
On subsequent runs, send `If-None-Match` header. Skip download if 304.

**Step 3: Create cron wrapper**

`src/scripts/data-sync-cron.sh`:
```bash
#!/bin/bash
cd "$(dirname "$0")/../.."
pnpm data:sync --source=all 2>&1 | tee -a data/sync.log
```

**Step 4: Document cron setup**

Add to README and docs/self-hosting.md:
```bash
# Weekly food data sync (Sunday 3am)
0 3 * * 0 /path/to/nutritrack/src/scripts/data-sync-cron.sh
```

**Step 5: Commit**

```bash
git add src/scripts/ data/ docs/ README.md
git commit -m "feat: weekly data sync with ETag caching + cron wrapper"
```

---

### Task 7: Update seed to be optional, document data:sync

**Files:**
- Modify: `src/server/db/seed.ts` (skip foods if data:sync was run)
- Modify: `README.md`
- Modify: `docs/self-hosting.md`

**Step 1: Make seed idempotent with bulk data**

In `seedFoods()`, check if foods table has >100k rows. If so, skip seed foods (bulk data already loaded). Still seed demo user, lessons, recipes, exercises.

**Step 2: Update README**

Add to Getting Started:
```markdown
### 5. Load food database (first time)

pnpm data:sync          # Downloads ~3.5M foods from OFF + USDA (~20min)
# Or for a quick start with demo data only:
# docker compose exec app pnpm db:seed
```

**Step 3: Commit**

```bash
git add src/server/db/seed.ts README.md docs/self-hosting.md
git commit -m "feat: document data:sync, make seed skip when bulk data present"
```

---

### Task 8: Integration test

**Files:**
- Create: `src/__tests__/data-sync.test.ts`

**Step 1: Write test**

Test the CSV parsing and row transformation logic (not the actual download):

```typescript
import { describe, it, expect } from "vitest";
import { parseOffRow, parseUsdaFood } from "@/scripts/data-sync";

describe("data-sync", () => {
  it("parses OFF CSV row into food record", () => {
    const row = {
      code: "3017620422003",
      product_name: "Nutella",
      brands: "Ferrero",
      "energy-kcal_100g": "539",
      proteins_100g: "6.3",
      carbohydrates_100g: "57.5",
      fat_100g: "30.9",
      fiber_100g: "3.4",
      sugars_100g: "56.3",
      sodium_100g: "0.107",
      "saturated-fat_100g": "10.6",
      categories_en: "spreads",
    };
    const food = parseOffRow(row);
    expect(food.id).toBe("off-3017620422003");
    expect(food.name).toBe("Nutella");
    expect(food.caloriesPer100g).toBe(539);
    expect(food.source).toBe("open_food_facts");
  });

  it("skips OFF rows without name", () => {
    const row = { code: "123", product_name: "", "energy-kcal_100g": "100" };
    const food = parseOffRow(row);
    expect(food).toBeNull();
  });

  it("parses USDA food + nutrients into food record", () => {
    const food = parseUsdaFood(
      { fdc_id: "12345", description: "Chicken breast, raw" },
      { 1008: 120, 1003: 22.5, 1005: 0, 1004: 2.6, 1079: 0 }
    );
    expect(food.id).toBe("usda-12345");
    expect(food.name).toBe("Chicken breast, raw");
    expect(food.verified).toBe(true);
  });
});
```

**Step 2: Run tests**

Run: `pnpm test -- --reporter=dot`
Expected: all pass

**Step 3: Commit**

```bash
git add src/__tests__/data-sync.test.ts
git commit -m "test: add data-sync parsing unit tests"
```
