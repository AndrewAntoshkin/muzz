import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { agencies, people } from "@/db/schema";

/**
 * Agencies from the `agencies` table (101 rows, imported by the scrapers). Only a few of
 * them have a hand-written page in lib/agencies.ts (AGENCY_PAGES); every other id gets a
 * generic roster page built from this row.
 */
export type AgencyRow = {
  id: string;
  name: string;
  website: string | null;
};

/** Aggregators are data sources, not agencies: they have no agent, no response time, no contacts. */
const SOURCE_NAMES: Record<string, string> = {
  kinolift: "Kinolift",
};

export function isSourceAgency(id: string) {
  return Object.hasOwn(SOURCE_NAMES, id);
}

export async function getAgencyRow(id: string): Promise<AgencyRow | null> {
  const [row] = await db
    .select({ id: agencies.id, name: agencies.name, website: agencies.website })
    .from(agencies)
    .where(eq(agencies.id, id))
    .limit(1);
  return row ?? null;
}

export function websiteHost(url: string | null | undefined) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  }
}

/** Scraped site titles that say nothing ("Контакты", "wordpress-website-default", "Актрисы"…). */
const GENERIC_TITLE = /^(контакты|главная|официальный сайт|wordpress-website-default|актрисы|актеры|актёры|art|актерское агент?ство|актёрское агент?ство|актерско агентство|актерское агенство|креативное агентство)$/i;

/** Human title for the page: the scraped name, unless it is junk / a repeated phrase - then the site's host. */
export function agencyDisplayName(row: AgencyRow) {
  if (Object.hasOwn(SOURCE_NAMES, row.id)) return SOURCE_NAMES[row.id];
  let name = row.name.replace(/\s+/g, " ").trim();
  // "Актерское агентство X - Актерское агентство X"
  const halves = name.split(/\s+-\s+/);
  if (halves.length === 2 && halves[0].trim().toLowerCase() === halves[1].trim().toLowerCase()) name = halves[0].trim();
  name = name.replace(/^["«»]+|["«»]+$/g, "").trim();
  if (!name || GENERIC_TITLE.test(name)) return websiteHost(row.website) || row.id;
  return name;
}

export type AgencyListItem = AgencyRow & { people: number };

/** Directory of agencies with roster size (actors / actresses), biggest first. 101 rows at most, filtered by `q`. */
export async function listAgencies(q = "", limit = 150): Promise<AgencyListItem[]> {
  const needle = `%${q.trim().replace(/[%_\\]/g, "")}%`;
  const where = q.trim() ? or(ilike(agencies.name, needle), ilike(agencies.website, needle), ilike(agencies.id, needle)) : undefined;
  const people_n = count(people.slug);
  const rows = await db
    .select({ id: agencies.id, name: agencies.name, website: agencies.website, people: people_n })
    .from(agencies)
    .leftJoin(people, and(eq(people.agencyId, agencies.id), inArray(people.profession, ["actor", "actress"])))
    .where(where)
    .groupBy(agencies.id)
    .orderBy(desc(people_n), asc(agencies.name))
    .limit(Math.min(Math.max(limit, 1), 200));
  return rows.map((r) => ({ ...r, people: Number(r.people) }));
}
