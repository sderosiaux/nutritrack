-- Include nameTranslations in search_vector so multi-language queries
-- are indexed and ranked (not ILIKE seq scan).
-- Extracts all JSONB text values and adds them as weight D.
ALTER TABLE "foods" DROP COLUMN "search_vector";--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("brand_name", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("category", '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(
      (SELECT string_agg(value::text, ' ') FROM jsonb_each_text("name_translations")),
      ''
    )), 'D')
  ) STORED;--> statement-breakpoint

-- Recreate GIN index on updated column
DROP INDEX IF EXISTS "foods_search_vector_idx";--> statement-breakpoint
CREATE INDEX "foods_search_vector_idx" ON "foods" USING gin ("search_vector");
