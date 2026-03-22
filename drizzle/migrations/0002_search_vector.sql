-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint

-- Add generated tsvector column for full-text search
ALTER TABLE "foods" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("brand_name", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("category", '')), 'C')
  ) STORED;--> statement-breakpoint

-- GIN index on tsvector column (fast full-text search at 3.5M+ rows)
CREATE INDEX "foods_search_vector_idx" ON "foods" USING gin ("search_vector");--> statement-breakpoint

-- Trigram index on name for fuzzy/typo-tolerant search
CREATE INDEX "foods_name_trgm_idx" ON "foods" USING gin ("name" gin_trgm_ops);--> statement-breakpoint

-- Trigram index on brand_name for fuzzy search
CREATE INDEX "foods_brand_trgm_idx" ON "foods" USING gin ("brand_name" gin_trgm_ops);
