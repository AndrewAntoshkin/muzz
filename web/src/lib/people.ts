import { unstable_cache } from "next/cache";
import { and, asc, count, eq, inArray, isNotNull, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents, people, personLinks, personPhotos } from "@/db/schema";
import { PENDING_PROFILE_HINT } from "./people-flags";
import { searchCondition } from "./search-query";
import { applyDemoFace, applyDemoPerson, overlayFaces, syntheticIndustry, syntheticGneusheva, syntheticSoykina } from "./demo-overlay";

export type FaceCard = {
  slug: string;
  name: string;
  role: string;
  profession: string;
  city: string;
  imageUrl: string | null;
  verified: boolean;
  hint: string | null;
  initials: string | null;
  bg: string | null;
  agencyId: string | null;
};

export async function countPeople() {
  const [row] = await db.select({ n: count() }).from(people);
  return row?.n ?? 0;
}

export async function countActors() {
  const [row] = await db
    .select({ n: count() })
    .from(people)
    .where(or(eq(people.profession, "actor"), eq(people.profession, "actress")));
  return row?.n ?? 0;
}

const FACE_FIELDS = {
  slug: people.slug,
  name: people.name,
  role: people.role,
  profession: people.profession,
  city: people.city,
  imageUrl: people.imageUrl,
  verified: people.verified,
  hint: people.hint,
  initials: people.initials,
  bg: people.bg,
  agencyId: people.agencyId,
} as const;

export type FaceSearch = {
  q?: string;
  profession?: string;
  city?: string;
  professions?: string[];
  agencyId?: string;
  limit?: number;
  offset?: number;
};

/** Скрываем пустые анкеты с регистрации: каталог не засоряется ботами и «мёртвыми» аккаунтами. */
function visibleInCatalog(): SQL | undefined {
  return or(
    isNull(people.hint),
    ne(people.hint, PENDING_PROFILE_HINT),
    isNotNull(people.imageUrl),
    isNotNull(people.card),
  );
}

function faceWhere(opts: FaceSearch): SQL | undefined {
  const parts: SQL[] = [];
  const visible = visibleInCatalog();
  if (visible) parts.push(visible);
  if (opts.profession) parts.push(eq(people.profession, opts.profession));
  else if (opts.professions?.length) parts.push(inArray(people.profession, opts.professions));
  if (opts.city) parts.push(eq(people.city, opts.city));
  if (opts.agencyId) parts.push(eq(people.agencyId, opts.agencyId));
  const match = searchCondition(opts.q);
  if (match) parts.push(match);
  if (!parts.length) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
}

async function searchFacesUncached(opts: FaceSearch = {}): Promise<{ items: FaceCard[]; total: number }> {
  const rawLimit = Number.isFinite(opts.limit) ? Number(opts.limit) : 96;
  const rawOffset = Number.isFinite(opts.offset) ? Number(opts.offset) : 0;
  const limit = Math.min(Math.max(Math.trunc(rawLimit), 1), 200);
  const offset = Math.min(Math.max(Math.trunc(rawOffset), 0), 20000);
  const where = faceWhere(opts);
  const [totalRow, rows] = await Promise.all([
    db.select({ n: count() }).from(people).where(where),
    db.select(FACE_FIELDS).from(people).where(where).orderBy(asc(people.name)).limit(limit).offset(offset),
  ]);
  const items = rows
    .map((r) => applyDemoFace({ ...r, city: r.city ?? "" }))
    .filter((row): row is FaceCard => row !== null);
  return { items, total: Number(totalRow[0]?.n ?? 0) };
}

const searchFacesCached = unstable_cache(
  async (key: string) => searchFacesUncached(JSON.parse(key) as FaceSearch),
  ["faces-search"],
  { revalidate: 60, tags: ["people"] },
);

/**
 * Поиск без текстового запроса (первые страницы каталога, фильтры) кэшируем на минуту:
 * это самый частый запрос, и он одинаков для всех. Свободный текст идёт напрямую в базу.
 */
export async function searchFaces(opts: FaceSearch = {}): Promise<{ items: FaceCard[]; total: number }> {
  if (opts.q?.trim()) return searchFacesUncached(opts);
  const key = JSON.stringify({
    profession: opts.profession || "",
    city: opts.city || "",
    professions: opts.professions ?? [],
    agencyId: opts.agencyId || "",
    limit: Number.isFinite(opts.limit) ? opts.limit : 96,
    offset: Number.isFinite(opts.offset) ? opts.offset : 0,
  });
  return searchFacesCached(key);
}

export async function listFaces(): Promise<FaceCard[]> {
  const rows = await db.select(FACE_FIELDS).from(people).where(visibleInCatalog()).orderBy(asc(people.name)).limit(400);
  return overlayFaces(rows.map((r) => ({ ...r, city: r.city ?? "" })));
}

export async function listRoster(agencyId = "akter1"): Promise<FaceCard[]> {
  const rows = await db
    .select(FACE_FIELDS)
    .from(people)
    .where(
      and(
        eq(people.agencyId, agencyId),
        or(eq(people.profession, "actor"), eq(people.profession, "actress")),
      ),
    )
    .orderBy(asc(people.name));

  return overlayFaces(rows.map((r) => ({ ...r, city: r.city ?? "" }))).filter(
    (r) => r.agencyId === agencyId && (r.profession === "actor" || r.profession === "actress"),
  );
}

export async function listPeopleBySlugs(slugs: string[]): Promise<FaceCard[]> {
  if (!slugs.length) return [];
  const rows = await db.select(FACE_FIELDS).from(people).where(inArray(people.slug, slugs));
  const order = new Map(slugs.map((slug, i) => [slug, i]));
  return overlayFaces(
    rows
      .slice()
      .sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99))
      .map((r) => ({ ...r, city: r.city ?? "" })),
  );
}

export async function getPerson(slug: string) {
  const resolved = slug === "lebedeva" ? "kevorkova" : slug;
  const existing = await fetchPersonRow(resolved);
  if (existing) return applyDemoPerson(existing);
  const synthetic = syntheticIndustry(resolved) ?? (resolved === "gneusheva" ? syntheticGneusheva() : resolved === "soykina" ? syntheticSoykina() : null);
  return synthetic;
}

const fetchPersonRowCached = unstable_cache(
  async (slug: string) => fetchPersonRowUncached(slug),
  ["person-row"],
  { revalidate: 60, tags: ["people"] },
);

async function fetchPersonRow(slug: string) {
  // «Не найден» не кэшируем: только что зарегистрированный человек должен открыть свой профиль сразу.
  return (await fetchPersonRowCached(slug)) ?? fetchPersonRowUncached(slug);
}

async function fetchPersonRowUncached(slug: string) {
  const [row] = await db
    .select({
      slug: people.slug,
      name: people.name,
      role: people.role,
      profession: people.profession,
      city: people.city,
      bio: people.bio,
      imageUrl: people.imageUrl,
      coverUrl: people.coverUrl,
      verified: people.verified,
      sourceUrl: people.sourceUrl,
      birthDate: people.birthDate,
      hint: people.hint,
      initials: people.initials,
      bg: people.bg,
      card: people.card,
      agencyId: people.agencyId,
      agencyName: agencies.name,
      agencyWebsite: agencies.website,
      agentName: agents.name,
      agentEmail: agents.email,
    })
    .from(people)
    .leftJoin(agencies, eq(people.agencyId, agencies.id))
    .leftJoin(agents, eq(people.agentId, agents.id))
    .where(eq(people.slug, slug))
    .limit(1);

  if (!row) return null;

  const [links, photos] = await Promise.all([
    db
      .select()
      .from(personLinks)
      .where(eq(personLinks.personSlug, slug)),
    db
      .select()
      .from(personPhotos)
      .where(and(eq(personPhotos.personSlug, slug)))
      .orderBy(asc(personPhotos.sort)),
  ]);

  return { ...row, links, photos };
}

export type PersonProfile = NonNullable<Awaited<ReturnType<typeof getPerson>>>;
