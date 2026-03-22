#!/usr/bin/env tsx
/**
 * Bulk food data sync: downloads Open Food Facts (~3.5M) and USDA FoodData Central (~400k)
 * dumps, streams them into PostgreSQL via staging tables + upsert.
 *
 * Usage:
 *   pnpm data:sync                    # sync all sources
 *   pnpm data:sync --source=off       # Open Food Facts only
 *   pnpm data:sync --source=usda      # USDA only
 *   pnpm data:sync --limit=1000       # test with first N rows
 */
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, renameSync } from "fs";
import { createGunzip } from "zlib";
import { parse } from "csv-parse";
import { execFileSync } from "child_process";
import postgres from "postgres";
import { join } from "path";

// ── Types ──────────────────────────────────────────────────────────────────

type FoodRow = {
  id: string;
  name: string;
  brandName: string | null;
  barcode: string | null;
  source: "usda" | "open_food_facts";
  sourceId: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g: number | null;
  sodiumMgPer100g: number | null;
  saturatedFatPer100g: number | null;
  category: string | null;
  verified: boolean;
};

type ServingRow = {
  id: string;
  foodId: string;
  label: string;
  weightG: number;
};

type SyncMeta = {
  off?: { etag?: string; lastSync?: string };
  usda?: { etag?: string; lastSync?: string };
};

// ── Config ────────────────────────────────────────────────────────────────

const OFF_CSV_URL = "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz";
const USDA_CSV_URL = "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_csv_2024-10-31.zip";

const DATA_DIR = join(process.cwd(), "data");
const META_FILE = join(DATA_DIR, ".sync-meta.json");
const BATCH_SIZE = 2000; // 16 columns × 2000 = 32k params (under PG's 65534 limit)
const MAX_DOWNLOAD_SIZE = 10 * 1024 * 1024 * 1024; // 10GB hard limit

// USDA nutrient IDs
const NUTRIENT_ENERGY = 1008;
const NUTRIENT_PROTEIN = 1003;
const NUTRIENT_CARBS = 1005;
const NUTRIENT_FAT = 1004;
const NUTRIENT_FIBER = 1079;
const NUTRIENT_SUGAR = 2000;
const NUTRIENT_SODIUM = 1093;
const NUTRIENT_SAT_FAT = 1258;

// ── Helpers ────────────────────────────────────────────────────────────────

function num(v: string | undefined | null, max = 99999): number {
  if (!v || v === "") return 0;
  const n = parseFloat(v);
  if (isNaN(n) || !isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

function numOrNull(v: string | undefined | null, max = 99999): number | null {
  if (!v || v === "") return null;
  const n = parseFloat(v);
  if (isNaN(n) || !isFinite(n)) return null;
  if (n < 0) return 0;
  return Math.min(n, max);
}

function loadMeta(): SyncMeta {
  if (!existsSync(META_FILE)) return {};
  return JSON.parse(readFileSync(META_FILE, "utf-8")) as SyncMeta;
}

function saveMeta(meta: SyncMeta): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
}

function elapsed(start: number): string {
  const s = Math.floor((Date.now() - start) / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

// ── OFF Parsing ───────────────────────────────────────────────────────────

export function parseOffRow(row: Record<string, string>): FoodRow | null {
  const name = row["product_name"]?.trim();
  if (!name) return null;

  const code = row["code"]?.trim();
  if (!code) return null;

  const cal = num(row["energy-kcal_100g"]);
  // Skip rows with no calorie data at all
  if (cal === 0 && !row["energy-kcal_100g"]) return null;

  const sodiumG = numOrNull(row["sodium_100g"]);

  return {
    id: `off-${code}`,
    name,
    brandName: row["brands"]?.trim() || null,
    barcode: code,
    source: "open_food_facts",
    sourceId: code,
    caloriesPer100g: cal,
    proteinPer100g: num(row["proteins_100g"], 9999),
    carbsPer100g: num(row["carbohydrates_100g"], 9999),
    fatPer100g: num(row["fat_100g"], 9999),
    fiberPer100g: num(row["fiber_100g"], 9999),
    sugarPer100g: numOrNull(row["sugars_100g"], 9999),
    sodiumMgPer100g: sodiumG !== null ? Math.min(sodiumG * 1000, 999999) : null,
    saturatedFatPer100g: numOrNull(row["saturated-fat_100g"], 9999),
    category: row["categories_en"]?.split(",")[0]?.trim() || null,
    verified: false,
  };
}

export function parseOffServing(row: Record<string, string>): ServingRow | null {
  const code = row["code"]?.trim();
  const servingSize = row["serving_size"]?.trim();
  if (!code || !servingSize) return null;

  // Try extracting gram value from parentheses first: "1 cup (240g)" → 240
  const gramMatch = servingSize.match(/\((\d+(?:\.\d+)?)\s*g\)/i);
  const weightG = gramMatch ? parseFloat(gramMatch[1]) : parseFloat(servingSize);
  if (isNaN(weightG) || weightG <= 0 || weightG > 99999) return null;

  return {
    id: `off-${code}-ss0`,
    foodId: `off-${code}`,
    label: servingSize,
    weightG,
  };
}

// ── USDA Parsing ──────────────────────────────────────────────────────────

export function parseUsdaFood(
  food: { fdc_id: string; description: string },
  nutrients: Record<number, number>
): FoodRow {
  return {
    id: `usda-${food.fdc_id}`,
    name: food.description,
    brandName: null,
    barcode: null,
    source: "usda",
    sourceId: food.fdc_id,
    caloriesPer100g: nutrients[NUTRIENT_ENERGY] ?? 0,
    proteinPer100g: nutrients[NUTRIENT_PROTEIN] ?? 0,
    carbsPer100g: nutrients[NUTRIENT_CARBS] ?? 0,
    fatPer100g: nutrients[NUTRIENT_FAT] ?? 0,
    fiberPer100g: nutrients[NUTRIENT_FIBER] ?? 0,
    sugarPer100g: nutrients[NUTRIENT_SUGAR] ?? null,
    sodiumMgPer100g: nutrients[NUTRIENT_SODIUM] ?? null,
    saturatedFatPer100g: nutrients[NUTRIENT_SAT_FAT] ?? null,
    category: null,
    verified: true,
  };
}

// ── Batch Accumulator ────────────────────────────────────────────────────

class BatchAccumulator {
  private foodBatch: FoodRow[] = [];
  private servingBatch: ServingRow[] = [];
  private imported = 0;

  constructor(
    private sql: postgres.Sql,
    private tag: string,
    private start: number,
  ) {}

  get count(): number { return this.imported; }

  async add(food: FoodRow, servings: ServingRow[] = []): Promise<void> {
    this.foodBatch.push(food);
    this.servingBatch.push(...servings);
    if (this.foodBatch.length >= BATCH_SIZE) await this.flush();
  }

  async flush(): Promise<void> {
    if (this.foodBatch.length === 0) return;
    await insertFoodBatch(this.sql, this.foodBatch);
    if (this.servingBatch.length > 0) await insertServingBatch(this.sql, this.servingBatch);
    this.imported += this.foodBatch.length;
    this.foodBatch = [];
    this.servingBatch = [];
    if (this.imported % 100_000 === 0) {
      console.log(`[${this.tag}] ${this.imported.toLocaleString()} rows staged (${elapsed(this.start)})`);
    }
  }
}

// ── Database Operations ──────────────────────────────────────────────────

async function resetStagingTables(sql: postgres.Sql): Promise<void> {
  await sql`
    CREATE TEMPORARY TABLE IF NOT EXISTS foods_staging (
      id text PRIMARY KEY,
      name text NOT NULL,
      brand_name text,
      barcode text,
      source text NOT NULL,
      source_id text,
      calories_per_100g numeric NOT NULL DEFAULT 0,
      protein_per_100g numeric NOT NULL DEFAULT 0,
      carbs_per_100g numeric NOT NULL DEFAULT 0,
      fat_per_100g numeric NOT NULL DEFAULT 0,
      fiber_per_100g numeric NOT NULL DEFAULT 0,
      sugar_per_100g numeric,
      sodium_mg_per_100g numeric,
      saturated_fat_per_100g numeric,
      category text,
      verified boolean NOT NULL DEFAULT false
    ) ON COMMIT PRESERVE ROWS
  `;
  await sql`
    CREATE TEMPORARY TABLE IF NOT EXISTS serving_sizes_staging (
      id text PRIMARY KEY,
      food_id text NOT NULL,
      label text NOT NULL,
      weight_g numeric NOT NULL
    ) ON COMMIT PRESERVE ROWS
  `;
  await sql`TRUNCATE foods_staging`;
  await sql`TRUNCATE serving_sizes_staging`;
}

async function insertFoodBatch(sql: postgres.Sql, rows: FoodRow[]): Promise<void> {
  if (rows.length === 0) return;
  await sql`
    INSERT INTO foods_staging ${sql(rows.map(r => ({
      id: r.id,
      name: r.name,
      brand_name: r.brandName,
      barcode: r.barcode,
      source: r.source,
      source_id: r.sourceId,
      calories_per_100g: r.caloriesPer100g,
      protein_per_100g: r.proteinPer100g,
      carbs_per_100g: r.carbsPer100g,
      fat_per_100g: r.fatPer100g,
      fiber_per_100g: r.fiberPer100g,
      sugar_per_100g: r.sugarPer100g,
      sodium_mg_per_100g: r.sodiumMgPer100g,
      saturated_fat_per_100g: r.saturatedFatPer100g,
      category: r.category,
      verified: r.verified,
    })))}
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
      verified = EXCLUDED.verified
  `;
}

async function insertServingBatch(sql: postgres.Sql, rows: ServingRow[]): Promise<void> {
  if (rows.length === 0) return;
  await sql`
    INSERT INTO serving_sizes_staging ${sql(rows.map(r => ({
      id: r.id,
      food_id: r.foodId,
      label: r.label,
      weight_g: r.weightG,
    })))}
    ON CONFLICT (id) DO UPDATE SET
      label = EXCLUDED.label,
      weight_g = EXCLUDED.weight_g
  `;
}

async function dropSearchIndexes(sql: postgres.Sql): Promise<void> {
  await sql`DROP INDEX IF EXISTS foods_search_vector_idx`;
  await sql`DROP INDEX IF EXISTS foods_name_trgm_idx`;
  await sql`DROP INDEX IF EXISTS foods_brand_trgm_idx`;
}

async function rebuildSearchIndexes(sql: postgres.Sql): Promise<void> {
  console.log("Rebuilding GIN indexes...");
  await sql`CREATE INDEX foods_search_vector_idx ON foods USING gin (search_vector)`;
  await sql`CREATE INDEX foods_name_trgm_idx ON foods USING gin (name gin_trgm_ops)`;
  await sql`CREATE INDEX foods_brand_trgm_idx ON foods USING gin (brand_name gin_trgm_ops)`;
  console.log("GIN indexes rebuilt");
}

async function upsertFromStaging(sql: postgres.Sql): Promise<void> {
  // Upsert foods (never overwrite user_created)
  await sql`
    INSERT INTO foods (
      id, name, brand_name, barcode, source, source_id,
      calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
      fiber_per_100g, sugar_per_100g, sodium_mg_per_100g, saturated_fat_per_100g,
      category, verified, name_translations, micronutrients, updated_at
    )
    SELECT
      id, name, brand_name, barcode, source::food_source, source_id,
      calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
      fiber_per_100g, sugar_per_100g, sodium_mg_per_100g, saturated_fat_per_100g,
      category, verified, '{}'::jsonb, '{}'::jsonb, now()
    FROM foods_staging
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      brand_name = EXCLUDED.brand_name,
      barcode = EXCLUDED.barcode,
      calories_per_100g = EXCLUDED.calories_per_100g,
      protein_per_100g = EXCLUDED.protein_per_100g,
      carbs_per_100g = EXCLUDED.carbs_per_100g,
      fat_per_100g = EXCLUDED.fat_per_100g,
      fiber_per_100g = EXCLUDED.fiber_per_100g,
      sugar_per_100g = EXCLUDED.sugar_per_100g,
      sodium_mg_per_100g = EXCLUDED.sodium_mg_per_100g,
      saturated_fat_per_100g = EXCLUDED.saturated_fat_per_100g,
      category = EXCLUDED.category,
      verified = EXCLUDED.verified,
      updated_at = now()
    WHERE foods.source != 'user_created'
  `;

  // Upsert serving sizes
  await sql`
    INSERT INTO serving_sizes (id, food_id, label, weight_g)
    SELECT id, food_id, label, weight_g FROM serving_sizes_staging
    ON CONFLICT (id) DO UPDATE SET
      label = EXCLUDED.label,
      weight_g = EXCLUDED.weight_g
  `;
}

// ── Download with ETag ───────────────────────────────────────────────────

async function downloadWithEtag(
  url: string,
  destPath: string,
  etag?: string
): Promise<{ path: string; etag?: string; skipped: boolean }> {
  // Skip download if file already exists on disk (e.g. meta was cleared but file kept)
  if (!etag && existsSync(destPath)) {
    console.log(`  File already on disk, skipping download`);
    return { path: destPath, skipped: false };
  }

  const headers: Record<string, string> = {};
  if (etag) headers["If-None-Match"] = etag;

  const res = await fetch(url, { headers, redirect: "follow" });

  if (res.status === 304) {
    console.log(`  Skipped (304 Not Modified)`);
    return { path: destPath, etag, skipped: true };
  }

  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);

  const newEtag = res.headers.get("etag") ?? undefined;
  const totalBytes = Number(res.headers.get("content-length") ?? 0);

  if (totalBytes > MAX_DOWNLOAD_SIZE) {
    throw new Error(`Download too large: ${totalBytes} bytes exceeds ${MAX_DOWNLOAD_SIZE} limit`);
  }

  console.log(`  Downloading ${totalBytes > 0 ? `${(totalBytes / 1e9).toFixed(1)}GB` : "unknown size"}...`);

  // Write to temp file, rename on success (atomic)
  const tmpPath = destPath + ".tmp";
  const fileStream = createWriteStream(tmpPath);
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  let downloaded = 0;
  let lastLog = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Respect backpressure
      const ok = fileStream.write(value);
      if (!ok) await new Promise<void>(resolve => fileStream.once("drain", resolve));

      downloaded += value.length;
      if (downloaded > MAX_DOWNLOAD_SIZE) throw new Error("Download exceeded size limit during transfer");

      if (downloaded - lastLog > 100_000_000) {
        const pct = totalBytes > 0 ? ((downloaded / totalBytes) * 100).toFixed(1) : "?";
        console.log(`  ${(downloaded / 1e6).toFixed(0)}MB downloaded (${pct}%)`);
        lastLog = downloaded;
      }
    }
    fileStream.end();
    await new Promise<void>((resolve) => fileStream.on("finish", resolve));
    renameSync(tmpPath, destPath);
  } catch (err) {
    reader.cancel().catch(() => {});
    fileStream.destroy();
    try { rmSync(tmpPath, { force: true }); } catch {}
    throw err;
  }

  console.log(`  Download complete: ${(downloaded / 1e6).toFixed(0)}MB`);
  return { path: destPath, etag: newEtag, skipped: false };
}

// ── OFF Import ───────────────────────────────────────────────────────────

async function importOff(sql: postgres.Sql, limit: number): Promise<number> {
  const start = Date.now();
  console.log("\n[OFF] Starting Open Food Facts import...");

  const meta = loadMeta();
  const destPath = join(DATA_DIR, "off-products.csv.gz");

  const dl = await downloadWithEtag(OFF_CSV_URL, destPath, meta.off?.etag);
  if (dl.skipped && existsSync(destPath)) {
    console.log("[OFF] Data unchanged since last sync, skipping import");
    return 0;
  }

  await resetStagingTables(sql);

  let processed = 0;
  const batch = new BatchAccumulator(sql, "OFF", start);

  const csvStream = createReadStream(destPath)
    .pipe(createGunzip())
    .pipe(parse({
      delimiter: "\t",
      columns: true,
      relax_quotes: true,
      relax_column_count: true,
      skip_empty_lines: true,
      cast: false,
    }));

  for await (const row of csvStream) {
    if (limit > 0 && processed >= limit) break;
    processed++;

    const food = parseOffRow(row as Record<string, string>);
    if (!food) continue;

    const serving = parseOffServing(row as Record<string, string>);
    await batch.add(food, serving ? [serving] : []);
  }
  await batch.flush();

  console.log(`[OFF] Staging complete: ${batch.count.toLocaleString()} foods (${elapsed(start)})`);
  console.log(`[OFF] Upserting into main tables...`);

  await upsertFromStaging(sql);

  // Save meta only after successful upsert
  meta.off = { etag: dl.etag, lastSync: new Date().toISOString() };
  saveMeta(meta);

  console.log(`[OFF] Done: ${batch.count.toLocaleString()} foods upserted in ${elapsed(start)}`);
  return batch.count;
}

// ── USDA Import ──────────────────────────────────────────────────────────

async function importUsda(sql: postgres.Sql, limit: number): Promise<number> {
  const start = Date.now();
  console.log("\n[USDA] Starting USDA FoodData Central import...");

  const meta = loadMeta();
  const destPath = join(DATA_DIR, "usda-fdc.zip");

  const dl = await downloadWithEtag(USDA_CSV_URL, destPath, meta.usda?.etag);
  if (dl.skipped && existsSync(destPath)) {
    console.log("[USDA] Data unchanged since last sync, skipping import");
    return 0;
  }

  const extractDir = join(DATA_DIR, "usda-extract");
  mkdirSync(extractDir, { recursive: true });

  try {
    // Use execFileSync (no shell interpolation — safe from injection)
    execFileSync("unzip", [
      "-o", "-j", destPath,
      "*/food.csv", "*/food_nutrient.csv", "*/food_portion.csv",
      "-d", extractDir,
    ], { stdio: "pipe" });

    console.log("[USDA] Building nutrient map...");

    // Step 1: Build nutrient map
    const nutrientMap = new Map<string, Record<number, number>>();
    const nutrientIds = new Set([
      NUTRIENT_ENERGY, NUTRIENT_PROTEIN, NUTRIENT_CARBS, NUTRIENT_FAT,
      NUTRIENT_FIBER, NUTRIENT_SUGAR, NUTRIENT_SODIUM, NUTRIENT_SAT_FAT,
    ]);

    const nutrientStream = createReadStream(join(extractDir, "food_nutrient.csv"))
      .pipe(parse({ columns: true, skip_empty_lines: true }));

    let nutrientRows = 0;
    for await (const row of nutrientStream) {
      const r = row as Record<string, string>;
      const nutrientId = parseInt(r["nutrient_id"] ?? "");
      if (!nutrientIds.has(nutrientId)) continue;

      const fdcId = r["fdc_id"] ?? "";
      if (!fdcId) continue;

      let map = nutrientMap.get(fdcId);
      if (!map) { map = {}; nutrientMap.set(fdcId, map); }
      map[nutrientId] = num(r["amount"]);
      nutrientRows++;
    }
    console.log(`[USDA] Loaded ${nutrientRows.toLocaleString()} nutrient rows for ${nutrientMap.size.toLocaleString()} foods`);

    // Step 2: Build serving sizes from food_portion.csv
    const portionMap = new Map<string, ServingRow[]>();
    const portionFile = join(extractDir, "food_portion.csv");
    if (existsSync(portionFile)) {
      const portionStream = createReadStream(portionFile)
        .pipe(parse({ columns: true, skip_empty_lines: true }));

      for await (const row of portionStream) {
        const r = row as Record<string, string>;
        const fdcId = r["fdc_id"] ?? "";
        const desc = r["portion_description"] ?? r["modifier"] ?? "";
        const grams = num(r["gram_weight"]);
        const portionId = r["id"] ?? "";

        if (!fdcId || !desc || grams <= 0) continue;

        const portions = portionMap.get(fdcId) ?? [];
        portions.push({
          id: `usda-${fdcId}-ss${portionId}`,
          foodId: `usda-${fdcId}`,
          label: desc,
          weightG: grams,
        });
        portionMap.set(fdcId, portions);
      }
      console.log(`[USDA] Loaded portions for ${portionMap.size.toLocaleString()} foods`);
    }

    // Step 3: Stream food.csv and build food records
    await resetStagingTables(sql);

    const foodStream = createReadStream(join(extractDir, "food.csv"))
      .pipe(parse({ columns: true, skip_empty_lines: true }));

    let processed = 0;
    const batch = new BatchAccumulator(sql, "USDA", start);

    for await (const row of foodStream) {
      if (limit > 0 && processed >= limit) break;
      processed++;

      const r = row as Record<string, string>;
      const fdcId = r["fdc_id"] ?? "";
      const description = r["description"]?.trim() ?? "";
      if (!fdcId || !description) continue;

      const nutrients = nutrientMap.get(fdcId) ?? {};
      const food = parseUsdaFood({ fdc_id: fdcId, description }, nutrients);
      const portions = portionMap.get(fdcId);
      await batch.add(food, portions ?? []);
    }
    await batch.flush();

    // Free memory before upsert
    nutrientMap.clear();
    portionMap.clear();

    console.log(`[USDA] Staging complete: ${batch.count.toLocaleString()} foods (${elapsed(start)})`);
    console.log(`[USDA] Upserting into main tables...`);

    await upsertFromStaging(sql);

    // Save meta only after successful upsert
    meta.usda = { etag: dl.etag, lastSync: new Date().toISOString() };
    saveMeta(meta);

    console.log(`[USDA] Done: ${batch.count.toLocaleString()} foods upserted in ${elapsed(start)}`);
    return batch.count;
  } finally {
    // Cleanup extracted files
    rmSync(extractDir, { recursive: true, force: true });
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const sourceArg = args.find(a => a.startsWith("--source="))?.split("=")[1] ?? "all";
  const limitArg = parseInt(args.find(a => a.startsWith("--limit="))?.split("=")[1] ?? "0");

  if (!["all", "off", "usda"].includes(sourceArg)) {
    throw new Error(`Invalid --source value: "${sourceArg}". Must be all, off, or usda.`);
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");

  mkdirSync(DATA_DIR, { recursive: true });

  const sql = postgres(url, { max: 1 });
  const totalStart = Date.now();
  let totalFoods = 0;

  try {
    // Drop GIN indexes before bulk load (3-5x faster upsert)
    console.log("Dropping GIN indexes for bulk load...");
    await dropSearchIndexes(sql);

    if (sourceArg === "all" || sourceArg === "off") {
      totalFoods += await importOff(sql, limitArg);
    }

    if (sourceArg === "all" || sourceArg === "usda") {
      totalFoods += await importUsda(sql, limitArg);
    }

    // Rebuild indexes + update statistics
    await rebuildSearchIndexes(sql);
    console.log("Running ANALYZE...");
    await sql`ANALYZE foods`;
    await sql`ANALYZE serving_sizes`;

    const [countRow] = await sql`SELECT count(*) as count FROM foods`;
    const total = Number(countRow?.count ?? 0);

    console.log(`\nSync complete in ${elapsed(totalStart)}`);
    console.log(`Total foods in database: ${total.toLocaleString()}`);
  } finally {
    await sql.end();
  }
}

// Only run when invoked directly, not when imported for tests
if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Data sync failed:", msg.replace(/postgresql:\/\/[^\s]+/g, "postgresql://***"));
    process.exit(1);
  });
}
