ALTER TABLE "users" ADD COLUMN "access" text DEFAULT 'user' NOT NULL;
--> statement-breakpoint
UPDATE "users" SET "access" = 'admin' WHERE "login" IN ('andrew', 'demo');
--> statement-breakpoint
CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"kind" text NOT NULL,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"url" text NOT NULL,
	"storage_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "files_owner_user_id_idx" ON "files" ("owner_user_id");
