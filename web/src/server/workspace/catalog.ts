import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { isDeadlinePast } from "@/lib/deadline";
import { PROJECT_STATUSES, type Casting, type Project } from "@/lib/productions";
import { badRequest, conflict } from "./http";
import {
  T,
  cleanDetails,
  freeSlug,
  isUniqueViolation,
  lookupPeople,
  newId,
  ownedCasting,
  ownedProject,
  requireRole,
} from "./common";
import { rowToCasting, rowToProject } from "./mappers";
import { optBool, optDate, optStr, optUrl, oneOf, reqStr } from "./validate";
import type { Viewer } from "./viewer";

const PROJECT_DETAIL_KEYS = [
  "studioAvatar",
  "year",
  "shifts",
  "client",
  "budget",
  "nature",
  "pavilion",
  "cdName",
  "shiftsDone",
  "scenesDone",
  "spent",
  "schedule",
  "financing",
  "distribution",
  "partners",
  "docs",
  "team",
  "openings",
  "updates",
  "blocks",
] as const;

const CASTING_DETAIL_KEYS = ["published", "timeline", "scenes", "scenesPdf", "applicants", "docs"] as const;

const PROJECT_STATUS_VALUES = PROJECT_STATUSES as readonly string[];

async function projectDto(slug: string): Promise<Project> {
  const [row] = await db.select().from(T.projects).where(eq(T.projects.slug, slug)).limit(1);
  const owner = (await lookupPeople([row.ownerSlug])).get(row.ownerSlug);
  return rowToProject(row, owner?.name);
}

async function castingDto(slug: string): Promise<Casting> {
  const [row] = await db.select().from(T.castings).where(eq(T.castings.slug, slug)).limit(1);
  const [proj] = await db.select({ slug: T.projects.slug }).from(T.projects).where(eq(T.projects.id, row.projectId)).limit(1);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(T.applications)
    .where(eq(T.applications.castingId, row.id));
  const owner = (await lookupPeople([row.ownerSlug])).get(row.ownerSlug);
  return rowToCasting(row, proj.slug, n, owner?.name);
}

/* ───────────────────────── projects ───────────────────────── */

export async function createProject(v: Viewer, body: Record<string, unknown>) {
  requireRole(v, "casting", "Проекты создают кастинг-директора");
  const title = reqStr(body.title, { label: "Название", max: 140 });
  const status = body.status === undefined || body.status === "" ? "Препродакшн" : reqStr(body.status, { label: "Статус", max: 40 });
  if (!PROJECT_STATUS_VALUES.includes(status)) throw badRequest("Статус: недопустимое значение");

  const details = cleanDetails(body, PROJECT_DETAIL_KEYS);
  if (typeof details.studioAvatar === "string") {
    const url = optUrl(details.studioAvatar, "Аватар");
    if (url) details.studioAvatar = url;
    else delete details.studioAvatar;
  }

  const values = {
    ownerSlug: v.slug,
    title: title.startsWith("«") ? title : `«${title}»`,
    studio: optStr(body.studio, { label: "Студия", max: 140 }) ?? "",
    platform: optStr(body.platform, { label: "Платформа", max: 80 }) ?? "",
    kind: optStr(body.kind, { label: "Формат", max: 120 }) ?? "",
    status,
    city: optStr(body.city, { label: "Город", max: 80 }) ?? "",
    cover: optUrl(body.cover, "Обложка") ?? "",
    logline: optStr(body.logline, { label: "Логлайн", max: 600 }) ?? "",
    text: optStr(body.text, { label: "Описание", max: 8000 }) ?? "",
    details,
    isDemo: v.demo,
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = await freeSlug("project", title);
    try {
      await db.insert(T.projects).values({ id: newId("prj"), slug, ...values });
      return { project: await projectDto(slug) };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  throw conflict("Не удалось подобрать адрес проекта, попробуйте ещё раз");
}

export async function updateProject(v: Viewer, slug: string, body: Record<string, unknown>) {
  const row = await ownedProject(v, slug);
  const set: Partial<typeof T.projects.$inferInsert> = { updatedAt: new Date() };

  if (body.title !== undefined) set.title = reqStr(body.title, { label: "Название", max: 140 });
  const studio = optStr(body.studio, { label: "Студия", max: 140 });
  if (studio !== undefined) set.studio = studio;
  const platform = optStr(body.platform, { label: "Платформа", max: 80 });
  if (platform !== undefined) set.platform = platform;
  const kind = optStr(body.kind, { label: "Формат", max: 120 });
  if (kind !== undefined) set.kind = kind;
  if (body.status !== undefined) set.status = oneOf(body.status, PROJECT_STATUS_VALUES, "Статус");
  const city = optStr(body.city, { label: "Город", max: 80 });
  if (city !== undefined) set.city = city;
  const cover = optUrl(body.cover, "Обложка");
  if (cover !== undefined) set.cover = cover;
  const logline = optStr(body.logline, { label: "Логлайн", max: 600 });
  if (logline !== undefined) set.logline = logline;
  const text = optStr(body.text, { label: "Описание", max: 8000 });
  if (text !== undefined) set.text = text;

  const patch = cleanDetails(body, PROJECT_DETAIL_KEYS);
  if (Object.keys(patch).length) {
    const next: Record<string, unknown> = { ...(row.details ?? {}) };
    for (const [k, val] of Object.entries(patch)) {
      if (val === null) delete next[k];
      else next[k] = val;
    }
    set.details = next;
  }

  await db.update(T.projects).set(set).where(eq(T.projects.id, row.id));
  return { project: await projectDto(slug) };
}

/** «Удаление» проекта — архив: отклики и история сохраняются, но проект и его роли пропадают из выдачи. */
export async function archiveProject(v: Viewer, slug: string) {
  const row = await ownedProject(v, slug);
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(T.projects).set({ archivedAt: now, updatedAt: now }).where(eq(T.projects.id, row.id));
    await tx.update(T.castings).set({ archivedAt: now, updatedAt: now }).where(eq(T.castings.projectId, row.id));
  });
  return { ok: true };
}

/* ───────────────────────── castings ───────────────────────── */

function parseFacts(value: unknown): [string, string][] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 30) throw badRequest("Факты: неверный формат");
  return value.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw badRequest("Факты: неверный формат");
    return [reqStr(pair[0], { label: "Факт", min: 0, max: 80 }), reqStr(pair[1], { label: "Факт", min: 0, max: 400 })] as [string, string];
  });
}

export async function createCasting(v: Viewer, body: Record<string, unknown>) {
  requireRole(v, "casting", "Кастинги создают кастинг-директора");
  const project = await ownedProject(v, reqStr(body.projectSlug, { label: "Проект", max: 120 }));
  const title = reqStr(body.title, { label: "Название роли", max: 160 });
  const roleLabel = reqStr(body.roleLabel, { label: "Тип роли", max: 120 });
  const deadlineOn = optDate(body.deadlineOn, "Дедлайн") ?? null;
  if (deadlineOn && isDeadlinePast(deadlineOn)) throw badRequest("Дедлайн уже прошёл — выберите дату не раньше сегодняшней");

  const age = optStr(body.age, { label: "Возраст", max: 60 });
  const facts: [string, string][] = parseFacts(body.facts) ?? [["Роль", roleLabel]];
  if (age && !facts.some(([k]) => k.toLowerCase() === "возраст")) facts.splice(1, 0, ["Возраст", age]);

  const details = cleanDetails(body, CASTING_DETAIL_KEYS);
  const values = {
    projectId: project.id,
    ownerSlug: v.slug,
    title,
    roleLabel,
    text: optStr(body.text, { label: "О роли", max: 8000 }) ?? "",
    meta: [project.kind, project.platform].filter(Boolean).join(" · ") || "Кастинг",
    deadlineOn,
    urgent: optBool(body.urgent, "Срочно") ?? false,
    media: project.cover,
    facts,
    details,
    isDemo: v.demo,
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = await freeSlug("casting", title);
    try {
      await db.insert(T.castings).values({ id: newId("cst"), slug, ...values });
      return { casting: await castingDto(slug) };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  throw conflict("Не удалось подобрать адрес кастинга, попробуйте ещё раз");
}

export async function updateCasting(v: Viewer, slug: string, body: Record<string, unknown>) {
  const row = await ownedCasting(v, slug);
  const set: Partial<typeof T.castings.$inferInsert> = { updatedAt: new Date() };

  if (body.title !== undefined) set.title = reqStr(body.title, { label: "Название роли", max: 160 });
  if (body.roleLabel !== undefined) set.roleLabel = reqStr(body.roleLabel, { label: "Тип роли", max: 120 });
  const text = optStr(body.text, { label: "О роли", max: 8000 });
  if (text !== undefined) set.text = text;
  const urgent = optBool(body.urgent, "Срочно");
  if (urgent !== undefined) set.urgent = urgent;
  const facts = parseFacts(body.facts);
  if (facts !== undefined) set.facts = facts;

  const deadlineOn = optDate(body.deadlineOn, "Дедлайн");
  if (deadlineOn !== undefined && deadlineOn !== row.deadlineOn) {
    set.deadlineOn = deadlineOn;
    // Новая дата — осознанное решение: сбрасываем устаревший текст и, если дата в будущем, снова открываем набор.
    set.deadlineText = "";
    if (deadlineOn && !isDeadlinePast(deadlineOn) && row.status === "closed" && body.status === undefined) set.status = "open";
  }

  if (body.status !== undefined) {
    const status = oneOf(body.status, ["open", "closed"] as const, "Статус");
    const effectiveDeadline = deadlineOn !== undefined ? deadlineOn : row.deadlineOn;
    if (status === "open" && effectiveDeadline && isDeadlinePast(effectiveDeadline)) {
      throw badRequest("Срок уже прошёл. Сначала выберите новый дедлайн.");
    }
    set.status = status;
  }

  const patch = cleanDetails(body, CASTING_DETAIL_KEYS);
  if (Object.keys(patch).length) {
    const next: Record<string, unknown> = { ...(row.details ?? {}) };
    for (const [k, val] of Object.entries(patch)) {
      if (val === null) delete next[k];
      else next[k] = val;
    }
    set.details = next;
  }

  await db.update(T.castings).set(set).where(eq(T.castings.id, row.id));
  return { casting: await castingDto(slug) };
}

export async function archiveCasting(v: Viewer, slug: string) {
  const row = await ownedCasting(v, slug);
  const now = new Date();
  await db.update(T.castings).set({ archivedAt: now, updatedAt: now }).where(eq(T.castings.id, row.id));
  return { ok: true };
}

export { castingDto, projectDto };
