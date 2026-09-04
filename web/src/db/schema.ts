import { boolean, date, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type { PersonCard } from "../lib/person-card";
import type { RoleId } from "../lib/roles";

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

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  login: text("login").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").$type<RoleId>().notNull(),
  passwordHash: text("password_hash").notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
  personSlug: text("person_slug").references(() => people.slug),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatThreads = pgTable("chat_threads", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatThreadMembers = pgTable(
  "chat_thread_members",
  {
    threadId: text("thread_id")
      .notNull()
      .references(() => chatThreads.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.threadId, t.userId] })],
);

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id")
    .notNull()
    .references(() => chatThreads.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
