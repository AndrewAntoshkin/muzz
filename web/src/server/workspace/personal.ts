import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { rehearsalCap, parsePlan } from "@/lib/plans";
import { rehearsalMonthKey } from "@/lib/rehearsal";
import type { Availability, WorkspaceSettings } from "@/lib/workspace";
import { conflict } from "./http";
import { T, newId, requirePerson, requireRole } from "./common";
import { oneOf, optBool, optOneOf, reqSavedKey, reqSlug, reqStr } from "./validate";
import { DEFAULT_SETTINGS } from "./snapshot";
import type { Viewer } from "./viewer";

export async function setSaved(v: Viewer, body: Record<string, unknown>) {
  const key = reqSavedKey(body.key);
  const on = optBool(body.saved, "saved");
  if (on === false) {
    await db.delete(T.savedItems).where(and(eq(T.savedItems.ownerSlug, v.slug), eq(T.savedItems.key, key)));
  } else {
    await db.insert(T.savedItems).values({ ownerSlug: v.slug, key }).onConflictDoNothing();
  }
  return { key, saved: on !== false };
}

export async function setShortlist(v: Viewer, body: Record<string, unknown>) {
  const personSlug = reqSlug(body.personSlug, "Профиль");
  const on = optBool(body.on, "on");
  if (on === false) {
    await db
      .delete(T.personShortlist)
      .where(and(eq(T.personShortlist.ownerSlug, v.slug), eq(T.personShortlist.personSlug, personSlug)));
  } else {
    await requirePerson(personSlug);
    await db.insert(T.personShortlist).values({ ownerSlug: v.slug, personSlug }).onConflictDoNothing();
  }
  return { personSlug, on: on !== false };
}

export async function createPost(v: Viewer, body: Record<string, unknown>) {
  const text = reqStr(body.text, { label: "Текст", max: 2000 });
  const id = newId("post");
  await db.insert(T.feedPosts).values({ id, authorSlug: v.slug, authorRole: v.role, text, isDemo: v.demo });
  const [row] = await db.select().from(T.feedPosts).where(eq(T.feedPosts.id, id)).limit(1);
  return { post: { id, authorRole: v.role, text, createdAt: row.createdAt.getTime() } };
}

export async function publishPulse(v: Viewer, body: Record<string, unknown>) {
  requireRole(v, "actor", "Статус публикуют актёры");
  const text = reqStr(body.text, { label: "Статус", max: 280 });
  const availability = oneOf(body.availability, ["open", "busy", "hold"] as const satisfies readonly Availability[], "Занятость");
  const now = new Date();
  await db
    .insert(T.actorPulses)
    .values({ personSlug: v.slug, text, availability, isDemo: v.demo, updatedAt: now })
    .onConflictDoUpdate({ target: T.actorPulses.personSlug, set: { text, availability, isDemo: v.demo, updatedAt: now } });
  return { pulse: { personSlug: v.slug, text, availability, updatedAt: now.getTime() } };
}

function toSettings(row: typeof T.userSettings.$inferSelect | undefined): WorkspaceSettings {
  if (!row) return DEFAULT_SETTINGS;
  return {
    notifyEmail: row.notifyEmail,
    notifyPush: row.notifyPush,
    plan: parsePlan(row.plan),
    rehearsalsUsed: row.rehearsalsUsed,
    rehearsalsMonth: row.rehearsalsMonth,
  };
}

async function ensureSettings(v: Viewer) {
  await db.insert(T.userSettings).values({ ownerSlug: v.slug }).onConflictDoNothing();
}

export async function patchSettings(v: Viewer, body: Record<string, unknown>) {
  await ensureSettings(v);
  const set: Partial<typeof T.userSettings.$inferInsert> = { updatedAt: new Date() };
  const email = optBool(body.notifyEmail, "notifyEmail");
  if (email !== undefined) set.notifyEmail = email;
  const push = optBool(body.notifyPush, "notifyPush");
  if (push !== undefined) set.notifyPush = push;
  const plan = optOneOf(body.plan, ["standard", "pro", "premium"] as const, "plan");
  if (plan !== undefined) set.plan = plan;
  await db.update(T.userSettings).set(set).where(eq(T.userSettings.ownerSlug, v.slug));
  const [row] = await db.select().from(T.userSettings).where(eq(T.userSettings.ownerSlug, v.slug)).limit(1);
  return { settings: toSettings(row) };
}

/** Репетиция расходует лимит тарифа. Счётчик атомарный и серверный — «починить» его очисткой браузера нельзя. */
export async function consumeRehearsal(v: Viewer) {
  await ensureSettings(v);
  const month = rehearsalMonthKey();
  const [current] = await db.select().from(T.userSettings).where(eq(T.userSettings.ownerSlug, v.slug)).limit(1);
  const cap = rehearsalCap(parsePlan(current.plan));
  const used = current.rehearsalsMonth === month ? current.rehearsalsUsed : 0;
  if (Number.isFinite(cap) && used >= cap) throw conflict("Лимит репетиций на этот месяц исчерпан");

  await db
    .update(T.userSettings)
    .set({
      rehearsalsMonth: month,
      rehearsalsUsed: sql`case when ${T.userSettings.rehearsalsMonth} = ${month} then ${T.userSettings.rehearsalsUsed} + 1 else 1 end`,
      updatedAt: new Date(),
    })
    .where(eq(T.userSettings.ownerSlug, v.slug));
  const [row] = await db.select().from(T.userSettings).where(eq(T.userSettings.ownerSlug, v.slug)).limit(1);
  return { settings: toSettings(row) };
}

export async function markInboxSeen(v: Viewer) {
  await ensureSettings(v);
  const now = new Date();
  await db.update(T.userSettings).set({ inboxSeenAt: now }).where(eq(T.userSettings.ownerSlug, v.slug));
  return { inboxSeenAt: now.getTime() };
}
