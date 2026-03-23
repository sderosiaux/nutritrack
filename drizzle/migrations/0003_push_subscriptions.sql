CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "push_subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint

CREATE UNIQUE INDEX "push_subscriptions_user_endpoint_idx" ON "push_subscriptions" ("user_id", "endpoint");--> statement-breakpoint

CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" ("user_id");
