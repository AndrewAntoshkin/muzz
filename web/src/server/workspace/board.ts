import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import type { CastingPin, RoleLayout } from "@/lib/workspace";
import { badRequest, forbidden, notFound } from "./http";
import { T, lookupPeople, newId, ownedProject, requirePerson, requireRole } from "./common";
import { rowToPin } from "./mappers";
import { optBool, optNumber, optStr, reqSlug } from "./validate";
import type { Viewer } from "./viewer";

const COORD_MIN = -20000;
const COORD_MAX = 20000;

async function pinDto(id: string): Promise<CastingPin> {
  const [row] = await db.select().from(T.castingPins).where(eq(T.castingPins.id, id)).limit(1);
  const [proj] = await db.select({ slug: T.projects.slug }).from(T.projects).where(eq(T.projects.id, row.projectId)).limit(1);
  const actor = (await lookupPeople([row.actorSlug])).get(row.actorSlug);
  return rowToPin(row, proj.slug, actor);
}

export async function addPin(v: Viewer, body: Record<string, unknown>) {
  requireRole(v, "casting", "Доска доступна кастинг-директорам");
  const project = await ownedProject(v, reqSlug(body.projectSlug, "Проект"));
  const actorSlug = reqSlug(body.actorSlug, "Актёр");
  await requirePerson(actorSlug);

  const existing = await db
    .select({ id: T.castingPins.id })
    .from(T.castingPins)
    .where(and(eq(T.castingPins.projectId, project.id), eq(T.castingPins.actorSlug, actorSlug)))
    .limit(1);
  if (existing[0]) return { pin: await pinDto(existing[0].id), created: false };

  const id = newId("pin");
  await db
    .insert(T.castingPins)
    .values({
      id,
      projectId: project.id,
      ownerSlug: v.slug,
      actorSlug,
      character: optStr(body.character, { label: "Персонаж", max: 120 }) ?? "",
      rotation: optNumber(body.rotation, "Поворот", -15, 15) ?? Math.round((Math.random() * 10 - 5) * 10) / 10,
      x: optNumber(body.x, "x", COORD_MIN, COORD_MAX) ?? null,
      y: optNumber(body.y, "y", COORD_MIN, COORD_MAX) ?? null,
      chosen: optBool(body.chosen, "Выбран") ?? false,
    })
    .onConflictDoNothing();
  const [row] = await db
    .select({ id: T.castingPins.id })
    .from(T.castingPins)
    .where(and(eq(T.castingPins.projectId, project.id), eq(T.castingPins.actorSlug, actorSlug)))
    .limit(1);
  return { pin: await pinDto(row.id), created: row.id === id };
}

export async function updatePin(v: Viewer, id: string, body: Record<string, unknown>) {
  const [row] = await db.select().from(T.castingPins).where(eq(T.castingPins.id, id)).limit(1);
  if (!row) throw notFound("Карточка не найдена");
  if (row.ownerSlug !== v.slug) throw forbidden();

  const set: Partial<typeof T.castingPins.$inferInsert> = {};
  const character = optStr(body.character, { label: "Персонаж", max: 120 });
  if (character !== undefined) set.character = character;
  const x = optNumber(body.x, "x", COORD_MIN, COORD_MAX);
  if (x !== undefined) set.x = x;
  const y = optNumber(body.y, "y", COORD_MIN, COORD_MAX);
  if (y !== undefined) set.y = y;
  const chosen = optBool(body.chosen, "Выбран");
  if (chosen !== undefined) set.chosen = chosen;
  if (!Object.keys(set).length) throw badRequest("Нечего менять");

  await db.update(T.castingPins).set(set).where(eq(T.castingPins.id, id));
  return { pin: await pinDto(id) };
}

export async function removePin(v: Viewer, id: string) {
  const [row] = await db.select().from(T.castingPins).where(eq(T.castingPins.id, id)).limit(1);
  if (!row) return { ok: true };
  if (row.ownerSlug !== v.slug) throw forbidden();
  await db.delete(T.castingPins).where(eq(T.castingPins.id, id));
  return { ok: true };
}

export async function clearPins(v: Viewer, projectSlug: string) {
  const project = await ownedProject(v, projectSlug);
  await db.delete(T.castingPins).where(and(eq(T.castingPins.projectId, project.id), eq(T.castingPins.ownerSlug, v.slug)));
  return { ok: true };
}

export async function setRoleLayout(v: Viewer, body: Record<string, unknown>): Promise<{ layout: RoleLayout }> {
  const project = await ownedProject(v, reqSlug(body.projectSlug, "Проект"));
  const castingSlug = reqSlug(body.castingSlug, "Кастинг");
  const [casting] = await db
    .select({ id: T.castings.id })
    .from(T.castings)
    .where(and(eq(T.castings.slug, castingSlug), eq(T.castings.projectId, project.id)))
    .limit(1);
  if (!casting) throw notFound("Кастинг не найден в этом проекте");
  const x = optNumber(body.x, "x", COORD_MIN, COORD_MAX);
  const y = optNumber(body.y, "y", COORD_MIN, COORD_MAX);
  if (x === undefined || y === undefined) throw badRequest("Нужны координаты");

  await db
    .insert(T.roleLayouts)
    .values({ projectId: project.id, castingId: casting.id, x, y })
    .onConflictDoUpdate({ target: [T.roleLayouts.projectId, T.roleLayouts.castingId], set: { x, y } });
  return { layout: { projectSlug: project.slug, castingSlug, x, y } };
}
