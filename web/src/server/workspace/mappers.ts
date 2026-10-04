import type { InferSelectModel } from "drizzle-orm";
import type { schema } from "@/db";
import { formatDeadline, isDeadlinePast } from "@/lib/deadline";
import type { Casting, Project } from "@/lib/productions";
import type { Application, CastingPin, RoleLayout } from "@/lib/workspace";

type ProjectRow = InferSelectModel<typeof schema.projects>;
type CastingRow = InferSelectModel<typeof schema.castings>;
type ApplicationRow = InferSelectModel<typeof schema.applications>;
type PinRow = InferSelectModel<typeof schema.castingPins>;
type LayoutRow = InferSelectModel<typeof schema.roleLayouts>;

/** Поля Project, которые живут в колонках; остальное — в `details`. */
const PROJECT_COLUMNS = ["slug", "title", "studio", "platform", "kind", "status", "city", "cover", "logline", "text", "cdSlug"] as const;
/** Поля Casting, которые живут в колонках или считаются сервером. */
const CASTING_COLUMNS = [
  "slug",
  "projectSlug",
  "title",
  "roleLabel",
  "text",
  "meta",
  "deadline",
  "deadlineOn",
  "status",
  "responses",
  "createdAt",
  "urgent",
  "media",
  "facts",
  "cdSlug",
] as const;

function omit<T extends Record<string, unknown>>(obj: T, keys: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!keys.includes(k) && v !== undefined) out[k] = v;
  }
  return out;
}

export function projectDetails(p: Partial<Project>) {
  return omit(p as Record<string, unknown>, PROJECT_COLUMNS);
}

export function castingDetails(c: Partial<Casting>) {
  return omit(c as Record<string, unknown>, CASTING_COLUMNS);
}

export function rowToProject(r: ProjectRow, ownerName?: string): Project {
  const d = (r.details ?? {}) as Partial<Project>;
  return {
    studioAvatar: "",
    cdName: ownerName ?? "",
    ...d,
    slug: r.slug,
    title: r.title,
    studio: r.studio,
    platform: r.platform,
    kind: r.kind,
    status: r.status,
    city: r.city,
    cover: r.cover,
    logline: r.logline,
    text: r.text,
    year: (d as { year?: string }).year ?? String(r.createdAt.getUTCFullYear()),
    cdSlug: r.ownerSlug,
  } as Project;
}

/** Статус кастинга с учётом срока: просроченный закрывается сам, без ручных действий. */
export function effectiveCastingStatus(r: Pick<CastingRow, "status" | "deadlineOn">, now = new Date()) {
  if (r.status === "closed") return "closed" as const;
  if (r.deadlineOn && isDeadlinePast(r.deadlineOn, now)) return "closed" as const;
  return "open" as const;
}

export function rowToCasting(
  r: CastingRow,
  projectSlug: string,
  responses: number,
  ownerName?: string,
  now = new Date(),
): Casting {
  const d = (r.details ?? {}) as Partial<Casting>;
  const status = effectiveCastingStatus(r, now);
  const deadline = r.deadlineOn ? formatDeadline(r.deadlineOn, now) : r.deadlineText;
  return {
    cdName: ownerName ?? "",
    ...d,
    slug: r.slug,
    projectSlug,
    title: r.title,
    roleLabel: r.roleLabel,
    text: r.text,
    meta: r.meta,
    deadline,
    deadlineOn: r.deadlineOn,
    status,
    // Демо-кастинги показывают «витринное» число откликов; у настоящих — только реальный счёт.
    responses: r.isDemo ? Math.max(responses, Number((d as { responsesBase?: number }).responsesBase) || 0) : responses,
    createdAt: r.createdAt.getTime(),
    urgent: r.urgent || undefined,
    media: r.media,
    facts: r.facts ?? [],
    cdSlug: r.ownerSlug,
  } as Casting;
}

export type ActorLookup = { name: string; avatar: string | null; meta: string };

export function rowToApplication(r: ApplicationRow, castingSlug: string, actor: ActorLookup | undefined): Application {
  return {
    id: r.id,
    castingSlug,
    actorSlug: r.actorSlug,
    actorName: actor?.name ?? r.actorSlug,
    actorAvatar: actor?.avatar ?? null,
    kind: r.kind as Application["kind"],
    note: r.note,
    status: r.status as Application["status"],
    source: r.source as Application["source"],
    createdAt: r.createdAt.getTime(),
    updatedAt: r.updatedAt.getTime(),
    match: r.matchLabel ?? undefined,
    actorMeta: actor?.meta || undefined,
    tape: r.tape ?? undefined,
  };
}

export function rowToPin(r: PinRow, projectSlug: string, actor: ActorLookup | undefined): CastingPin {
  return {
    id: r.id,
    projectSlug,
    actorSlug: r.actorSlug,
    actorName: actor?.name ?? r.actorSlug,
    photo: actor?.avatar ?? "",
    character: r.character,
    rotation: r.rotation,
    x: r.x ?? undefined,
    y: r.y ?? undefined,
    chosen: r.chosen || undefined,
  };
}

export function rowToLayout(r: LayoutRow, projectSlug: string, castingSlug: string): RoleLayout {
  return { projectSlug, castingSlug, x: r.x, y: r.y };
}
