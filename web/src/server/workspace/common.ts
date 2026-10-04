import { and, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { listPeopleBySlugs } from "@/lib/people";
import { newId } from "@/lib/identity";
import { slugBase } from "@/lib/slug";
import { badRequest, forbidden, notFound } from "./http";
import type { ActorLookup } from "./mappers";
import type { Viewer } from "./viewer";

export const T = schema;
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Db = typeof db | Tx;

export { newId };

export function visibleProject(v: Viewer) {
  return and(eq(T.projects.isDemo, v.demo), isNull(T.projects.archivedAt));
}

export function visibleCasting(v: Viewer) {
  return and(eq(T.castings.isDemo, v.demo), isNull(T.castings.archivedAt));
}

/** Свободный слаг: base, base-2, base-3 … Повторную гонку ловит UNIQUE + ретрай в вызывающем коде. */
export async function freeSlug(kind: "project" | "casting", title: string, client: Db = db) {
  const base = slugBase(title, kind);
  const table = kind === "project" ? T.projects : T.castings;
  const taken = await client
    .select({ slug: table.slug })
    .from(table)
    .where(inArray(table.slug, [base, ...Array.from({ length: 12 }, (_, i) => `${base}-${i + 2}`)]));
  const used = new Set(taken.map((r) => r.slug));
  if (!used.has(base)) return base;
  for (let i = 2; i <= 13; i++) if (!used.has(`${base}-${i}`)) return `${base}-${i}`;
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export function isUniqueViolation(err: unknown) {
  const code = (err as { code?: string; cause?: { code?: string } })?.code ?? (err as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

/** Людей по slug: каталог + демо-оверлей. Возвращает только запрошенные. */
export async function lookupPeople(slugs: Iterable<string>) {
  const wanted = Array.from(new Set(slugs)).filter(Boolean);
  const map = new Map<string, ActorLookup & { role: string; city: string }>();
  if (!wanted.length) return map;
  const faces = await listPeopleBySlugs(wanted);
  const want = new Set(wanted);
  for (const f of faces) {
    if (!want.has(f.slug)) continue;
    map.set(f.slug, {
      name: f.name,
      avatar: f.imageUrl,
      role: f.role,
      city: f.city,
      meta: [f.role, f.city].filter(Boolean).join(" · "),
    });
  }
  return map;
}

export async function requirePerson(slug: string) {
  const found = await lookupPeople([slug]);
  const person = found.get(slug);
  if (!person) throw notFound("Профиль не найден");
  return person;
}

export function requireRole(v: Viewer, role: Viewer["role"], message: string) {
  if (v.role !== role) throw forbidden(message);
}

/** Проект, которым viewer владеет (и который не в архиве). */
export async function ownedProject(v: Viewer, slug: string, client: Db = db) {
  const [row] = await client
    .select()
    .from(T.projects)
    .where(and(eq(T.projects.slug, slug), visibleProject(v)))
    .limit(1);
  if (!row) throw notFound("Проект не найден");
  if (row.ownerSlug !== v.slug) throw forbidden("Это не ваш проект");
  return row;
}

export async function ownedCasting(v: Viewer, slug: string, client: Db = db) {
  const [row] = await client
    .select()
    .from(T.castings)
    .where(and(eq(T.castings.slug, slug), visibleCasting(v)))
    .limit(1);
  if (!row) throw notFound("Кастинг не найден");
  if (row.ownerSlug !== v.slug) throw forbidden("Это не ваш кастинг");
  return row;
}

const MAX_JSON_BYTES = 96_000;

/**
 * Санитайзер вложенного JSON (график, команда, документы, блоки страницы).
 * Структура свободная, но: ограничены глубина/размер, а data:/javascript: в строках не пропускаются —
 * так base64 больше не может осесть в базе.
 */
export function cleanJson(value: unknown, depth = 0): unknown {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    if (/^\s*(data|javascript|blob):/i.test(value)) throw badRequest("Файлы нужно загружать, а не вставлять как данные");
    if (value.length > 8000) throw badRequest("Слишком длинное значение");
    return value;
  }
  if (depth > 5) throw badRequest("Слишком глубокая вложенность");
  if (Array.isArray(value)) {
    if (value.length > 300) throw badRequest("Слишком длинный список");
    return value.map((v) => cleanJson(v, depth + 1));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > 60) throw badRequest("Слишком много полей");
    for (const [k, v] of entries) {
      if (v === undefined) continue;
      out[k] = cleanJson(v, depth + 1);
    }
    return out;
  }
  return null;
}

export function cleanDetails(input: Record<string, unknown>, allowed: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (!(key in input)) continue;
    out[key] = cleanJson(input[key]);
  }
  if (JSON.stringify(out).length > MAX_JSON_BYTES) throw badRequest("Слишком много данных");
  return out;
}
