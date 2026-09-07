CREATE TABLE "athletes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"grade" integer,
	"position" text,
	"parent_email" text,
	"parent_name" text,
	"has_hoop" boolean DEFAULT true NOT NULL,
	"track" text DEFAULT 'TRYOUT' NOT NULL,
	"tier" text DEFAULT 'NONE' NOT NULL,
	"start_date" date,
	"tryout_date" date,
	"practice_days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"days_per_week" integer DEFAULT 4 NOT NULL,
	"levels" jsonb DEFAULT '{"HANDLE":1,"FINISH":1,"SHOOT":1,"ENGINE":1}'::jsonb NOT NULL,
	"goals" text,
	"onboarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "athletes_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "benchmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"athlete_id" integer NOT NULL,
	"date" date NOT NULL,
	"handle60" integer,
	"two_ball90" integer,
	"form25" integer,
	"spot25" integer,
	"finish60" integer,
	"shuttle" real,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clips" (
	"id" serial PRIMARY KEY NOT NULL,
	"athlete_id" integer NOT NULL,
	"url" text NOT NULL,
	"note" text,
	"coach_feedback" text,
	"feedback_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"athlete_id" integer NOT NULL,
	"body" text NOT NULL,
	"visible_to_athlete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drills" (
	"id" serial PRIMARY KEY NOT NULL,
	"block" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"video_url" text,
	"needs_hoop" boolean DEFAULT false NOT NULL,
	"no_hoop_name" text,
	"no_hoop_description" text,
	"minutes" integer DEFAULT 4 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "film_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_number" integer DEFAULT 1 NOT NULL,
	"track" text DEFAULT 'ALL' NOT NULL,
	"title" text NOT NULL,
	"theme" text,
	"video_url" text,
	"breakdown" text DEFAULT '' NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "film_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"athlete_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"minutes_watched" integer,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"coach_reply" text
);
--> statement-breakpoint
CREATE TABLE "group_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"track" text DEFAULT 'ALL' NOT NULL,
	"tier" text DEFAULT 'ALL' NOT NULL,
	"weekday" integer DEFAULT 3 NOT NULL,
	"time" text DEFAULT '19:00' NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"meet_url" text,
	"agenda" text,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"athlete_name" text,
	"grade" text,
	"tier" text,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	CONSTRAINT "magic_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"tier" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_checkout_id" text,
	"current_period_end" timestamp,
	"source" text DEFAULT 'stripe' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nudges" (
	"id" serial PRIMARY KEY NOT NULL,
	"athlete_id" integer NOT NULL,
	"kind" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"athlete_id" integer NOT NULL,
	"date" date NOT NULL,
	"kind" text NOT NULL,
	"planned_minutes" integer DEFAULT 0 NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"actual_minutes" integer,
	"effort" integer,
	"notes" text,
	"with_hoop" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'ATHLETE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_notes" ADD CONSTRAINT "coach_notes_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_responses" ADD CONSTRAINT "film_responses_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_responses" ADD CONSTRAINT "film_responses_module_id_film_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."film_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nudges" ADD CONSTRAINT "nudges_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "benchmarks_athlete" ON "benchmarks" USING btree ("athlete_id","date");--> statement-breakpoint
CREATE INDEX "drills_block_level" ON "drills" USING btree ("block","level");--> statement-breakpoint
CREATE UNIQUE INDEX "film_resp_unique" ON "film_responses" USING btree ("athlete_id","module_id");--> statement-breakpoint
CREATE INDEX "memberships_email" ON "memberships" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_athlete_date" ON "sessions" USING btree ("athlete_id","date");
