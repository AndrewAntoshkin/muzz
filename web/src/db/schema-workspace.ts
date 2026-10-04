import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AppTape, ProfilePatch } from "../lib/workspace";
import type { CastingStatus } from "../lib/productions";

/**
 * Рабочее пространство: проекты, кастинги, отклики, доска, ростер.
 *
 * Владелец — `owner_slug` (slug анкеты в people либо демо-персоны). Внешних ключей на people нет
 * намеренно: демо-персон там нет, а чистка каталога не должна каскадом сносить чужие кастинги.
 * Демо-контент помечен `is_demo` и виден только демо-пользователям и админам.
 */

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    ownerSlug: text("owner_slug").notNull(),
    title: text("title").notNull(),
    studio: text("studio").notNull().default(""),
    platform: text("platform").notNull().default(""),
    kind: text("kind").notNull().default(""),
    status: text("status").notNull().default(""),
    city: text("city").notNull().default(""),
    cover: text("cover").notNull().default(""),
    logline: text("logline").notNull().default(""),
    text: text("text").notNull().default(""),
    /** Всё редкое и вложенное: график, финансирование, команда, документы, блоки страницы. */
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    isDemo: boolean("is_demo").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("projects_owner_idx").on(t.ownerSlug),
    index("projects_visible_idx").on(t.isDemo, t.archivedAt, t.createdAt),
  ],
);

export const castings = pgTable(
  "castings",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    ownerSlug: text("owner_slug").notNull(),
    title: text("title").notNull(),
    roleLabel: text("role_label").notNull().default(""),
    text: text("text").notNull().default(""),
    meta: text("meta").notNull().default(""),
    /** Реальный срок. Если дата прошла — кастинг считается закрытым без ручных действий. */
    deadlineOn: date("deadline_on"),
    /** Свободная подпись для старого/импортированного контента, пока нет даты. */
    deadlineText: text("deadline_text").notNull().default(""),
    status: text("status").$type<CastingStatus>().notNull().default("open"),
    urgent: boolean("urgent").notNull().default(false),
    media: text("media").notNull().default(""),
    facts: jsonb("facts").$type<[string, string][]>().notNull().default([]),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    isDemo: boolean("is_demo").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("castings_owner_idx").on(t.ownerSlug),
    index("castings_project_idx").on(t.projectId),
    index("castings_visible_idx").on(t.isDemo, t.archivedAt, t.status, t.createdAt),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: text("id").primaryKey(),
    castingId: text("casting_id")
      .notNull()
      .references(() => castings.id, { onDelete: "cascade" }),
    actorSlug: text("actor_slug").notNull(),
    /** Кто создал запись: сам актёр, его агент или кастинг-директор (приглашение). */
    submittedBySlug: text("submitted_by_slug").notNull(),
    source: text("source").notNull(),
    kind: text("kind").notNull(),
    note: text("note").notNull().default(""),
    status: text("status").notNull().default("sent"),
    matchLabel: text("match_label"),
    tape: jsonb("tape").$type<AppTape | null>(),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("applications_unique_idx").on(t.castingId, t.actorSlug, t.source),
    index("applications_actor_idx").on(t.actorSlug),
    index("applications_submitter_idx").on(t.submittedBySlug),
  ],
);

export const castingPins = pgTable(
  "casting_pins",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    ownerSlug: text("owner_slug").notNull(),
    actorSlug: text("actor_slug").notNull(),
    character: text("character").notNull().default(""),
    rotation: real("rotation").notNull().default(0),
    x: real("x"),
    y: real("y"),
    chosen: boolean("chosen").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("casting_pins_unique_idx").on(t.projectId, t.actorSlug)],
);

export const roleLayouts = pgTable(
  "role_layouts",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    castingId: text("casting_id")
      .notNull()
      .references(() => castings.id, { onDelete: "cascade" }),
    x: real("x").notNull(),
    y: real("y").notNull(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.castingId] })],
);

export const personShortlist = pgTable(
  "person_shortlist",
  {
    ownerSlug: text("owner_slug").notNull(),
    personSlug: text("person_slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.ownerSlug, t.personSlug] })],
);

export const feedPosts = pgTable(
  "feed_posts",
  {
    id: text("id").primaryKey(),
    authorSlug: text("author_slug").notNull(),
    authorRole: text("author_role").notNull(),
    text: text("text").notNull(),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("feed_posts_created_idx").on(t.isDemo, t.createdAt)],
);

export const actorPulses = pgTable("actor_pulses", {
  personSlug: text("person_slug").primaryKey(),
  text: text("text").notNull().default(""),
  availability: text("availability").notNull().default("open"),
  isDemo: boolean("is_demo").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedItems = pgTable(
  "saved_items",
  {
    ownerSlug: text("owner_slug").notNull(),
    /** `casting:<slug>` | `project:<slug>` | `person:<slug>` */
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.ownerSlug, t.key] })],
);

export const userSettings = pgTable("user_settings", {
  ownerSlug: text("owner_slug").primaryKey(),
  notifyEmail: boolean("notify_email").notNull().default(true),
  notifyPush: boolean("notify_push").notNull().default(false),
  plan: text("plan").notNull().default("pro"),
  rehearsalsUsed: integer("rehearsals_used").notNull().default(0),
  rehearsalsMonth: text("rehearsals_month").notNull().default(""),
  /** Метка «прочитано» для колокольчика — вместо списка id в localStorage. */
  inboxSeenAt: timestamp("inbox_seen_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Оверлей правок профиля для демо-персон: их записи в people общие с каталогом, поэтому демо-правки
 * кладём отдельно и показываем только демо-зрителям. У реальных пользователей правки пишутся прямо в people.
 */
export const profilePatches = pgTable("profile_patches", {
  personSlug: text("person_slug").primaryKey(),
  patch: jsonb("patch").$type<ProfilePatch>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
