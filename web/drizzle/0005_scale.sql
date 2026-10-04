CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_reset_at_idx" ON "rate_limits" ("reset_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_thread_created_idx" ON "chat_messages" ("thread_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_file_id_idx" ON "chat_messages" ("file_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_thread_members_user_idx" ON "chat_thread_members" ("user_id", "thread_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_threads_updated_idx" ON "chat_threads" ("updated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_person_slug_idx" ON "users" ("person_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_status_created_idx" ON "files" ("status", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "people_profession_name_idx" ON "people" ("profession", "name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "people_agency_name_idx" ON "people" ("agency_id", "name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "people_city_idx" ON "people" ("city");
--> statement-breakpoint
-- Один составной trigram-индекс под поиск каталога (должен совпадать с SEARCH_EXPR в src/lib/people.ts).
CREATE INDEX IF NOT EXISTS "people_search_trgm_idx" ON "people" USING gin ((name || ' ' || role || ' ' || coalesce(city, '') || ' ' || coalesce(hint, '')) gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "person_links_person_slug_idx" ON "person_links" ("person_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "person_photos_person_slug_idx" ON "person_photos" ("person_slug", "sort");
