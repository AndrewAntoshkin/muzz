-- Рабочее пространство переезжает из localStorage в Postgres.
-- Все операторы идемпотентны: повторный прогон безопасен.

CREATE TABLE IF NOT EXISTS "projects" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "owner_slug" text NOT NULL,
  "title" text NOT NULL,
  "studio" text DEFAULT '' NOT NULL,
  "platform" text DEFAULT '' NOT NULL,
  "kind" text DEFAULT '' NOT NULL,
  "status" text DEFAULT '' NOT NULL,
  "city" text DEFAULT '' NOT NULL,
  "cover" text DEFAULT '' NOT NULL,
  "logline" text DEFAULT '' NOT NULL,
  "text" text DEFAULT '' NOT NULL,
  "details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_demo" boolean DEFAULT false NOT NULL,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "castings" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "project_id" text NOT NULL,
  "owner_slug" text NOT NULL,
  "title" text NOT NULL,
  "role_label" text DEFAULT '' NOT NULL,
  "text" text DEFAULT '' NOT NULL,
  "meta" text DEFAULT '' NOT NULL,
  "deadline_on" date,
  "deadline_text" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "urgent" boolean DEFAULT false NOT NULL,
  "media" text DEFAULT '' NOT NULL,
  "facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_demo" boolean DEFAULT false NOT NULL,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "castings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "applications" (
  "id" text PRIMARY KEY NOT NULL,
  "casting_id" text NOT NULL,
  "actor_slug" text NOT NULL,
  "submitted_by_slug" text NOT NULL,
  "source" text NOT NULL,
  "kind" text NOT NULL,
  "note" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'sent' NOT NULL,
  "match_label" text,
  "tape" jsonb,
  "is_demo" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "casting_pins" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "owner_slug" text NOT NULL,
  "actor_slug" text NOT NULL,
  "character" text DEFAULT '' NOT NULL,
  "rotation" real DEFAULT 0 NOT NULL,
  "x" real,
  "y" real,
  "chosen" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_layouts" (
  "project_id" text NOT NULL,
  "casting_id" text NOT NULL,
  "x" real NOT NULL,
  "y" real NOT NULL,
  CONSTRAINT "role_layouts_project_id_casting_id_pk" PRIMARY KEY("project_id","casting_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "person_shortlist" (
  "owner_slug" text NOT NULL,
  "person_slug" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "person_shortlist_owner_slug_person_slug_pk" PRIMARY KEY("owner_slug","person_slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feed_posts" (
  "id" text PRIMARY KEY NOT NULL,
  "author_slug" text NOT NULL,
  "author_role" text NOT NULL,
  "text" text NOT NULL,
  "is_demo" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "actor_pulses" (
  "person_slug" text PRIMARY KEY NOT NULL,
  "text" text DEFAULT '' NOT NULL,
  "availability" text DEFAULT 'open' NOT NULL,
  "is_demo" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_items" (
  "owner_slug" text NOT NULL,
  "key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "saved_items_owner_slug_key_pk" PRIMARY KEY("owner_slug","key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
  "owner_slug" text PRIMARY KEY NOT NULL,
  "notify_email" boolean DEFAULT true NOT NULL,
  "notify_push" boolean DEFAULT false NOT NULL,
  "plan" text DEFAULT 'pro' NOT NULL,
  "rehearsals_used" integer DEFAULT 0 NOT NULL,
  "rehearsals_month" text DEFAULT '' NOT NULL,
  "inbox_seen_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile_patches" (
  "person_slug" text PRIMARY KEY NOT NULL,
  "patch" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "castings" ADD CONSTRAINT "castings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "applications" ADD CONSTRAINT "applications_casting_id_castings_id_fk" FOREIGN KEY ("casting_id") REFERENCES "public"."castings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "casting_pins" ADD CONSTRAINT "casting_pins_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "role_layouts" ADD CONSTRAINT "role_layouts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "role_layouts" ADD CONSTRAINT "role_layouts_casting_id_castings_id_fk" FOREIGN KEY ("casting_id") REFERENCES "public"."castings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_owner_idx" ON "projects" USING btree ("owner_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_visible_idx" ON "projects" USING btree ("is_demo","archived_at","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "castings_owner_idx" ON "castings" USING btree ("owner_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "castings_project_idx" ON "castings" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "castings_visible_idx" ON "castings" USING btree ("is_demo","archived_at","status","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "applications_unique_idx" ON "applications" USING btree ("casting_id","actor_slug","source");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_actor_idx" ON "applications" USING btree ("actor_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_submitter_idx" ON "applications" USING btree ("submitted_by_slug");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "casting_pins_unique_idx" ON "casting_pins" USING btree ("project_id","actor_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feed_posts_created_idx" ON "feed_posts" USING btree ("is_demo","created_at");
