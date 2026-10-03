/**
 * Drop invented crew from the live DB without reseeding akter1.
 * Fill demo cards for Взметнев / Кеворкова.
 *
 *   npm run db:purge-fakes
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { people, personLinks, personPhotos } from "../src/db/schema";
import { eq } from "drizzle-orm";
import {
  DEMO_BIOS,
  KEVORKOVA_CARD,
  KEVORKOVA_LINKS,
  VZMETNEV_CARD,
  VZMETNEV_LINKS,
  VZMETNEV_PHOTOS,
} from "../src/lib/demo-profiles";

config({ path: ".env.local" });
config({ path: ".env" });

const KEEP = ["vzmetnev", "kevorkova", "soykina", "gneusheva"];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  const deleted = await client<{ slug: string; name: string }[]>`
    DELETE FROM people
    WHERE slug NOT IN ('vzmetnev', 'kevorkova', 'soykina', 'gneusheva')
      AND (source_url IS NULL OR source_url NOT ILIKE '%akter1.ru%')
    RETURNING slug, name
  `;
  if (deleted.length) {
    console.log(`deleted ${deleted.length}: ${deleted.map((r) => r.slug).join(", ")}`);
  } else {
    console.log("no fake people to delete");
  }

  await db
    .update(people)
    .set({
      birthDate: "1993-08-18",
      sourceUrl: "https://www.kinopoisk.ru/name/4531331/",
      card: VZMETNEV_CARD,
      bio: DEMO_BIOS.vzmetnev,
      hint: "«Любовь СССР» · Кинопоиск",
      verified: true,
      agencyId: null,
      agentId: null,
    })
    .where(eq(people.slug, "vzmetnev"));

  await db.delete(personPhotos).where(eq(personPhotos.personSlug, "vzmetnev"));
  await db.insert(personPhotos).values(
    VZMETNEV_PHOTOS.map((photo, i) => ({
      id: `vzmetnev-${i}`,
      personSlug: "vzmetnev",
      url: photo,
      sort: i,
    })),
  );
  await db.delete(personLinks).where(eq(personLinks.personSlug, "vzmetnev"));
  await db.insert(personLinks).values(
    VZMETNEV_LINKS.map((l) => ({
      id: `vzmetnev-${l.kind}`,
      personSlug: "vzmetnev",
      kind: l.kind,
      url: l.url,
    })),
  );

  await db
    .update(people)
    .set({
      name: "Анна Кеворкова",
      role: "Кастинг-директор",
      profession: "casting",
      card: KEVORKOVA_CARD,
      bio: DEMO_BIOS.kevorkova,
      hint: "«Союз Спасения» · «Майор Гром»",
      verified: true,
      city: "Москва",
      imageUrl: "/assets/people/kevorkova.jpg",
      birthDate: "1981-12-07",
      sourceUrl: "https://www.kino-teatr.ru/kino/casting/ros/467639/works/",
      agencyId: null,
      agentId: null,
    })
    .where(eq(people.slug, "kevorkova"));

  await db.delete(personLinks).where(eq(personLinks.personSlug, "kevorkova"));
  await db.insert(personLinks).values(
    KEVORKOVA_LINKS.map((l) => ({
      id: `kevorkova-${l.kind}`,
      personSlug: "kevorkova",
      kind: l.kind,
      url: l.url,
    })),
  );

  await client`DELETE FROM people WHERE slug = 'lebedeva'`;

  console.log(`demo cards: ${KEEP.join(", ")}`);
  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
