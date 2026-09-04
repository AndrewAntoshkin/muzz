import { and, asc, count, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents, people, personLinks, personPhotos } from "@/db/schema";

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

export async function listFaces(): Promise<FaceCard[]> {
  const rows = await db
    .select({
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
    })
    .from(people)
    .orderBy(asc(people.name));

  return rows.map((r) => ({
    ...r,
    city: r.city ?? "",
  }));
}

export async function listRoster(agencyId = "akter1"): Promise<FaceCard[]> {
  const rows = await db
    .select({
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
    })
    .from(people)
    .where(
      and(
        eq(people.agencyId, agencyId),
        or(eq(people.profession, "actor"), eq(people.profession, "actress")),
      ),
    )
    .orderBy(asc(people.name));

  return rows.map((r) => ({
    ...r,
    city: r.city ?? "",
  }));
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

export async function listPeopleBySlugs(slugs: string[]): Promise<FaceCard[]> {
  if (!slugs.length) return [];
  const rows = await db.select(FACE_FIELDS).from(people).where(inArray(people.slug, slugs));
  const order = new Map(slugs.map((slug, i) => [slug, i]));
  return rows
    .slice()
    .sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99))
    .map((r) => ({ ...r, city: r.city ?? "" }));
}

export async function getPerson(slug: string) {
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
