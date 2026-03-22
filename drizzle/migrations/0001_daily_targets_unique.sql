-- Fix daily_targets: convert index to unique index for onConflict support
DROP INDEX IF EXISTS "daily_targets_user_date_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "daily_targets_user_date_idx" ON "daily_targets" USING btree ("user_id","date");
