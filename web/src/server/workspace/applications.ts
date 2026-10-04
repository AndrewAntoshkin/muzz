import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import type { AppStatus, Application, AppTape } from "@/lib/workspace";
import { badRequest, conflict, forbidden, notFound } from "./http";
import { T, cleanJson, isUniqueViolation, lookupPeople, newId, requirePerson, requireRole, visibleCasting } from "./common";
import { effectiveCastingStatus, rowToApplication } from "./mappers";
import { oneOf, optStr, reqSlug } from "./validate";
import type { Viewer } from "./viewer";

const STATUSES = ["sent", "shortlist", "invited", "declined"] as const satisfies readonly AppStatus[];

async function openCasting(v: Viewer, slug: string) {
  const [row] = await db
    .select()
    .from(T.castings)
    .where(and(eq(T.castings.slug, slug), visibleCasting(v)))
    .limit(1);
  if (!row) throw notFound("Кастинг не найден");
  if (effectiveCastingStatus(row) === "closed") throw conflict("Набор на этот кастинг закрыт");
  return row;
}

function parseTape(value: unknown): AppTape | null {
  if (value === undefined || value === null) return null;
  const clean = cleanJson(value);
  if (!clean || typeof clean !== "object" || Array.isArray(clean)) throw badRequest("Самопроба: неверный формат");
  const t = clean as Record<string, unknown>;
  const str = (x: unknown, max: number) => (typeof x === "string" ? x.slice(0, max) : undefined);
  const title = str(t.title, 200);
  if (!title) throw badRequest("Самопроба: нет названия");
  const href = str(t.href, 2000);
  if (href && !(href.startsWith("/") || /^https?:\/\//i.test(href))) throw badRequest("Самопроба: неверная ссылка");
  return { title, poster: str(t.poster, 2000) ?? "", duration: str(t.duration, 40), href, caption: str(t.caption, 400) };
}

/** Есть ли у профиля живой аккаунт в «Кадре»: только тогда человек реально увидит уведомление. */
export async function hasAccount(personSlug: string) {
  const [row] = await db.select({ id: T.users.id }).from(T.users).where(eq(T.users.personSlug, personSlug)).limit(1);
  return Boolean(row);
}

async function dto(id: string): Promise<Application> {
  const [row] = await db.select().from(T.applications).where(eq(T.applications.id, id)).limit(1);
  const [casting] = await db.select({ slug: T.castings.slug }).from(T.castings).where(eq(T.castings.id, row.castingId)).limit(1);
  const actor = (await lookupPeople([row.actorSlug])).get(row.actorSlug);
  return rowToApplication(row, casting.slug, actor);
}

export async function applyToCasting(v: Viewer, body: Record<string, unknown>) {
  requireRole(v, "actor", "Откликаться могут актёры");
  const casting = await openCasting(v, reqSlug(body.castingSlug, "Кастинг"));
  const kind = oneOf(body.kind ?? "apply", ["apply", "selftape"] as const, "Тип отклика");
  const tape = parseTape(body.tape);
  if (kind === "selftape" && !tape) throw badRequest("Для самопробы нужно видео");
  const note = optStr(body.note, { label: "Сообщение", max: 2000 }) ?? "";

  try {
    const id = newId("app");
    await db.insert(T.applications).values({
      id,
      castingId: casting.id,
      actorSlug: v.slug,
      submittedBySlug: v.slug,
      source: "actor",
      kind,
      note,
      status: "sent",
      tape,
      isDemo: v.demo,
    });
    return { application: await dto(id) };
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("Вы уже откликнулись на этот кастинг");
    throw err;
  }
}

export async function proposeActor(v: Viewer, body: Record<string, unknown>) {
  requireRole(v, "agent", "Предлагать актёров могут агенты");
  const casting = await openCasting(v, reqSlug(body.castingSlug, "Кастинг"));
  const actorSlug = reqSlug(body.actorSlug, "Актёр");
  await requirePerson(actorSlug);
  const note = optStr(body.note, { label: "Комментарий", max: 1000 }) ?? "";

  try {
    const id = newId("app");
    await db.insert(T.applications).values({
      id,
      castingId: casting.id,
      actorSlug,
      submittedBySlug: v.slug,
      source: "agent",
      kind: "propose",
      note,
      status: "sent",
      isDemo: v.demo,
    });
    return { application: await dto(id) };
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("Этого актёра уже предлагали на роль");
    throw err;
  }
}

/**
 * Приглашение кастинг-директором. Если человек уже откликался (сам или через агента) — переводим его отклик в «приглашён»,
 * иначе создаём приглашение. Ответ честно говорит, увидит ли его адресат: `notified` — есть ли у профиля аккаунт.
 */
export async function inviteActor(v: Viewer, body: Record<string, unknown>) {
  requireRole(v, "casting", "Приглашать могут кастинг-директора");
  const casting = await openCasting(v, reqSlug(body.castingSlug, "Кастинг"));
  if (casting.ownerSlug !== v.slug) throw forbidden("Это не ваш кастинг");
  const actorSlug = reqSlug(body.actorSlug, "Актёр");
  await requirePerson(actorSlug);
  const note = optStr(body.note, { label: "Сообщение", max: 1000 }) ?? "";

  const existing = await db
    .select()
    .from(T.applications)
    .where(and(eq(T.applications.castingId, casting.id), eq(T.applications.actorSlug, actorSlug)));

  let id: string;
  let created = false;
  if (existing.length) {
    id = existing[0].id;
    await db
      .update(T.applications)
      .set({ status: "invited", updatedAt: new Date() })
      .where(and(eq(T.applications.castingId, casting.id), eq(T.applications.actorSlug, actorSlug)));
  } else {
    id = newId("app");
    created = true;
    await db.insert(T.applications).values({
      id,
      castingId: casting.id,
      actorSlug,
      submittedBySlug: v.slug,
      source: "casting",
      kind: "invite",
      note,
      status: "invited",
      isDemo: v.demo,
    });
  }
  return { application: await dto(id), created, notified: await hasAccount(actorSlug) };
}

export async function setApplicationStatus(v: Viewer, id: string, body: Record<string, unknown>) {
  const status = oneOf(body.status, STATUSES, "Статус");
  const [row] = await db
    .select({ app: T.applications, ownerSlug: T.castings.ownerSlug, castingDemo: T.castings.isDemo })
    .from(T.applications)
    .innerJoin(T.castings, eq(T.castings.id, T.applications.castingId))
    .where(eq(T.applications.id, id))
    .limit(1);
  if (!row || row.app.isDemo !== v.demo) throw notFound("Отклик не найден");
  if (row.ownerSlug !== v.slug) throw forbidden("Менять статус может только владелец кастинга");

  await db.update(T.applications).set({ status, updatedAt: new Date() }).where(eq(T.applications.id, id));
  return { application: await dto(id), notified: await hasAccount(row.app.actorSlug) };
}

/** Отозвать свой отклик/предложение. Приглашения от кастинга актёр удалить не может. */
export async function withdrawApplication(v: Viewer, id: string) {
  const [row] = await db.select().from(T.applications).where(eq(T.applications.id, id)).limit(1);
  if (!row || row.isDemo !== v.demo) throw notFound("Отклик не найден");
  if (row.submittedBySlug !== v.slug || row.source === "casting") throw forbidden("Этот отклик нельзя отозвать");
  await db.delete(T.applications).where(eq(T.applications.id, id));
  return { ok: true };
}
