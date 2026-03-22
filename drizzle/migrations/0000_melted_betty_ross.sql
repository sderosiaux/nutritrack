CREATE TYPE "public"."activity_level" AS ENUM('sedentary', 'light', 'moderate', 'active', 'very_active');--> statement-breakpoint
CREATE TYPE "public"."biological_sex" AS ENUM('male', 'female', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."entry_source" AS ENUM('manual', 'barcode', 'photo', 'voice', 'quick_add', 'recipe');--> statement-breakpoint
CREATE TYPE "public"."exercise_category" AS ENUM('cardio', 'strength', 'flexibility', 'sports', 'daily_activity');--> statement-breakpoint
CREATE TYPE "public"."food_source" AS ENUM('usda', 'open_food_facts', 'user_created', 'admin');--> statement-breakpoint
CREATE TYPE "public"."goal" AS ENUM('lose_weight', 'maintain', 'build_muscle', 'eat_healthier');--> statement-breakpoint
CREATE TYPE "public"."intensity_level" AS ENUM('low', 'moderate', 'high');--> statement-breakpoint
CREATE TYPE "public"."lesson_category" AS ENUM('nutrition', 'sleep', 'stress', 'habits', 'fitness', 'mindfulness');--> statement-breakpoint
CREATE TYPE "public"."meal_slot" AS ENUM('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack', 'other');--> statement-breakpoint
CREATE TYPE "public"."recipe_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."recipe_source" AS ENUM('system', 'user_created');--> statement-breakpoint
CREATE TYPE "public"."units" AS ENUM('metric', 'imperial');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL,
	"exercise_id" text,
	"custom_name" text,
	"duration_min" integer NOT NULL,
	"intensity_level" "intensity_level",
	"calories_burned" numeric(7, 2) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "daily_targets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"calories_kcal" integer NOT NULL,
	"protein_g" numeric(6, 2) NOT NULL,
	"carbs_g" numeric(6, 2) NOT NULL,
	"fat_g" numeric(6, 2) NOT NULL,
	"fiber_g" numeric(6, 2) NOT NULL,
	"water_ml" integer NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" "exercise_category" NOT NULL,
	"met_value" numeric(4, 2) NOT NULL,
	"met_low" numeric(4, 2) NOT NULL,
	"met_high" numeric(4, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorite_recipes" (
	"user_id" text NOT NULL,
	"recipe_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_recipes_unique" UNIQUE("user_id","recipe_id")
);
--> statement-breakpoint
CREATE TABLE "food_favorites" (
	"user_id" text NOT NULL,
	"food_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "food_favorites_unique" UNIQUE("user_id","food_id")
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_translations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"brand_name" text,
	"barcode" text,
	"source" "food_source" NOT NULL,
	"source_id" text,
	"created_by_user_id" text,
	"calories_per_100g" numeric(7, 2) NOT NULL,
	"protein_per_100g" numeric(6, 2) NOT NULL,
	"carbs_per_100g" numeric(6, 2) NOT NULL,
	"fat_per_100g" numeric(6, 2) NOT NULL,
	"fiber_per_100g" numeric(6, 2) NOT NULL,
	"sugar_per_100g" numeric(6, 2),
	"sodium_mg_per_100g" numeric(8, 2),
	"saturated_fat_per_100g" numeric(6, 2),
	"micronutrients" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"default_serving_id" text,
	"category" text,
	"image_url" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"completed_at" timestamp,
	"queued_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_unique" UNIQUE("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"body_markdown" text NOT NULL,
	"category" "lesson_category" NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"read_time_min" integer DEFAULT 5 NOT NULL,
	"illustration_url" text,
	"order" integer DEFAULT 0 NOT NULL,
	"published_at" date,
	CONSTRAINT "lessons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "meal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"meal_slot" "meal_slot" NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL,
	"food_id" text,
	"recipe_id" text,
	"custom_name" text,
	"serving_size_id" text,
	"quantity_g" numeric(7, 2) NOT NULL,
	"serving_label" text NOT NULL,
	"calories_kcal" numeric(7, 2) NOT NULL,
	"protein_g" numeric(6, 2) NOT NULL,
	"carbs_g" numeric(6, 2) NOT NULL,
	"fat_g" numeric(6, 2) NOT NULL,
	"fiber_g" numeric(6, 2) NOT NULL,
	"source" "entry_source" DEFAULT 'manual' NOT NULL,
	"photo_url" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" text PRIMARY KEY NOT NULL,
	"recipe_id" text NOT NULL,
	"food_id" text NOT NULL,
	"quantity_g" numeric(7, 2) NOT NULL,
	"display_label" text NOT NULL,
	"optional" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"author_id" text,
	"source" "recipe_source" DEFAULT 'system' NOT NULL,
	"source_url" text,
	"servings" integer DEFAULT 1 NOT NULL,
	"prep_time_mins" integer DEFAULT 0 NOT NULL,
	"cook_time_mins" integer DEFAULT 0 NOT NULL,
	"difficulty" "recipe_difficulty" DEFAULT 'easy' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"steps" text[] DEFAULT '{}' NOT NULL,
	"calories_per_serving" numeric(7, 2) DEFAULT '0' NOT NULL,
	"protein_per_serving" numeric(6, 2) DEFAULT '0' NOT NULL,
	"carbs_per_serving" numeric(6, 2) DEFAULT '0' NOT NULL,
	"fat_per_serving" numeric(6, 2) DEFAULT '0' NOT NULL,
	"fiber_per_serving" numeric(6, 2) DEFAULT '0' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serving_sizes" (
	"id" text PRIMARY KEY NOT NULL,
	"food_id" text NOT NULL,
	"label" text NOT NULL,
	"weight_g" numeric(7, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"birth_date" date,
	"biological_sex" "biological_sex",
	"current_weight_kg" numeric(5, 2),
	"height_cm" numeric(5, 2),
	"goal" "goal",
	"target_weight_kg" numeric(5, 2),
	"weekly_pace_kg" numeric(4, 2),
	"activity_level" "activity_level",
	"dietary_restrictions" text[] DEFAULT '{}' NOT NULL,
	"allergies" text[] DEFAULT '{}' NOT NULL,
	"units" "units" DEFAULT 'metric' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "water_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL,
	"amount_ml" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weight_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"note" text
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_entries" ADD CONSTRAINT "activity_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_entries" ADD CONSTRAINT "activity_entries_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_targets" ADD CONSTRAINT "daily_targets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_recipes" ADD CONSTRAINT "favorite_recipes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_recipes" ADD CONSTRAINT "favorite_recipes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_favorites" ADD CONSTRAINT "food_favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_favorites" ADD CONSTRAINT "food_favorites_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_entries" ADD CONSTRAINT "meal_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_entries" ADD CONSTRAINT "meal_entries_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_entries" ADD CONSTRAINT "meal_entries_serving_size_id_serving_sizes_id_fk" FOREIGN KEY ("serving_size_id") REFERENCES "public"."serving_sizes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serving_sizes" ADD CONSTRAINT "serving_sizes_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_entries" ADD CONSTRAINT "water_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_entries_user_date_idx" ON "activity_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_targets_user_date_idx" ON "daily_targets" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "favorite_recipes_user_idx" ON "favorite_recipes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "food_favorites_user_idx" ON "food_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "foods_name_idx" ON "foods" USING btree ("name");--> statement-breakpoint
CREATE INDEX "foods_barcode_idx" ON "foods" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "foods_source_idx" ON "foods" USING btree ("source");--> statement-breakpoint
CREATE INDEX "lesson_progress_user_idx" ON "lesson_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meal_entries_user_date_idx" ON "meal_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "meal_entries_user_slot_idx" ON "meal_entries" USING btree ("user_id","date","meal_slot");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_recipe_idx" ON "recipe_ingredients" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipes_source_idx" ON "recipes" USING btree ("source");--> statement-breakpoint
CREATE INDEX "serving_sizes_food_idx" ON "serving_sizes" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "water_entries_user_date_idx" ON "water_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "weight_entries_user_date_idx" ON "weight_entries" USING btree ("user_id","date");