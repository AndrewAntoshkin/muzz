import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { agencies, castings, people, projects } from "@/db/schema";
import { getAgencyPage } from "./agencies";
import { INDUSTRY } from "./demo-industry";
import { getEvent } from "./events";

/**
 * Existence checks for dynamic routes whose data lives on the server (people, agencies,
 * events). They run from the proxy (src/middleware.ts) BEFORE the page renders, because
 * the HTTP status of a streamed response is fixed when the first byte goes out: a
 * notFound() thrown inside the page arrives after AppFrame's "Загрузка…" shell was sent
 * with 200 (see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md,
 * "Status Codes"). Keep these cheap: primary-key lookups plus a short in-memory cache.
 *
 * Castings and projects live in the database too (archived ones count as missing). We only check
 * that the slug exists, not who may see it: visibility is enforced by the workspace API.
 */

type Kind = "people" | "agencies" | "events" | "castings" | "projects";

const ROUTE = /^\/(people|agencies|events|castings|projects)\/([^/]+)(\/board|\/responses)?\/?$/;
/** Какие подстраницы существуют у каких разделов. */
const SUBPAGE: Partial<Record<Kind, string>> = { projects: "/board", castings: "/responses" };

const POSITIVE_TTL_MS = 5 * 60_000;
const NEGATIVE_TTL_MS = 15_000;
const MAX_ENTRIES = 5000;
const cache = new Map<string, { ok: boolean; until: number }>();

function remember(key: string, ok: boolean) {
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(key, { ok, until: Date.now() + (ok ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS) });
}

/** Slugs that exist only in code (demo personas, hand-written industry cards). */
function demoPersonExists(slug: string) {
  return slug === "soykina" || slug === "gneusheva" || slug === "kevorkova" || Object.hasOwn(INDUSTRY, slug);
}

async function lookup(kind: Kind, key: string): Promise<boolean> {
  if (kind === "events") return Boolean(getEvent(key));
  if (kind === "people") {
    if (demoPersonExists(key)) return true;
    const [row] = await db.select({ slug: people.slug }).from(people).where(eq(people.slug, key)).limit(1);
    return Boolean(row);
  }
  if (kind === "castings") {
    const [row] = await db.select({ id: castings.id }).from(castings).where(and(eq(castings.slug, key), isNull(castings.archivedAt))).limit(1);
    return Boolean(row);
  }
  if (kind === "projects") {
    const [row] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.slug, key), isNull(projects.archivedAt))).limit(1);
    return Boolean(row);
  }
  if (getAgencyPage(key)) return true;
  const [row] = await db.select({ id: agencies.id }).from(agencies).where(eq(agencies.id, key)).limit(1);
  return Boolean(row);
}

export type RouteCheck = { kind: Kind; key: string };

export function matchCheckedRoute(pathname: string): RouteCheck | null {
  const m = ROUTE.exec(pathname);
  if (!m) return null;
  if (m[3] && SUBPAGE[m[1] as Kind] !== m[3]) return null;
  let key: string;
  try {
    key = decodeURIComponent(m[2]);
  } catch {
    return { kind: m[1] as Kind, key: "\u0000" }; // malformed escape
  }
  return { kind: m[1] as Kind, key };
}

/** true / false, or null when we could not tell (DB down): callers must then let the page decide. */
export async function routeExists(check: RouteCheck): Promise<boolean | null> {
  if (check.key.includes("\u0000")) return false; // malformed escape / NUL: certainly missing (and PG rejects NUL)
  const cacheKey = `${check.kind}:${check.key}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.until > Date.now()) return hit.ok;
  try {
    const ok = check.key.length <= 200 && (await lookup(check.kind, check.key));
    remember(cacheKey, ok);
    return ok;
  } catch {
    return null;
  }
}
