import { boolean, date, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { PersonCard } from "../lib/person-card";

export const agencies = pgTable("agencies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  website: text("website"),
});

export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  agencyId: text("agency_id").references(() => agencies.id),
});

export const people = pgTable("people", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  profession: text("profession").notNull(),
  city: text("city"),
  bio: text("bio"),
  imageUrl: text("image_url"),
  coverUrl: text("cover_url"),
  verified: boolean("verified").notNull().default(false),
  sourceUrl: text("source_url"),
  birthDate: date("birth_date"),
  agencyId: text("agency_id").references(() => agencies.id),
  agentId: text("agent_id").references(() => agents.id),
  hint: text("hint"),
  initials: text("initials"),
  bg: text("bg"),
  card: jsonb("card").$type<PersonCard | null>(),
});

export const personLinks = pgTable("person_links", {
  id: text("id").primaryKey(),
  personSlug: text("person_slug")
    .notNull()
    .references(() => people.slug, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  url: text("url").notNull(),
});

export const personPhotos = pgTable("person_photos", {
  id: text("id").primaryKey(),
  personSlug: text("person_slug")
    .notNull()
    .references(() => people.slug, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sort: integer("sort").notNull().default(0),
});
