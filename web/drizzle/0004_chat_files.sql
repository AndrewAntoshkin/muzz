ALTER TABLE "files" ADD COLUMN "status" text DEFAULT 'ready' NOT NULL;
--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "text" SET DEFAULT '';
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "file_id" text;
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
