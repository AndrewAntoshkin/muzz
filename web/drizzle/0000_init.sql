CREATE TABLE "agencies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"website" text
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"agency_id" text
);
--> statement-breakpoint
CREATE TABLE "people" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"profession" text NOT NULL,
	"city" text,
	"bio" text,
	"image_url" text,
	"cover_url" text,
	"verified" boolean DEFAULT false NOT NULL,
	"source_url" text,
	"birth_date" date,
	"agency_id" text,
	"agent_id" text,
	"hint" text,
	"initials" text,
	"bg" text
);
--> statement-breakpoint
CREATE TABLE "person_links" (
	"id" text PRIMARY KEY NOT NULL,
	"person_slug" text NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"person_slug" text NOT NULL,
	"url" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "person_links" ADD CONSTRAINT "person_links_person_slug_people_slug_fk" FOREIGN KEY ("person_slug") REFERENCES "public"."people"("slug") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "person_photos" ADD CONSTRAINT "person_photos_person_slug_people_slug_fk" FOREIGN KEY ("person_slug") REFERENCES "public"."people"("slug") ON DELETE cascade ON UPDATE no action;
