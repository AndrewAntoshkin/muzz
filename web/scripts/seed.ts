import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  DEMO_BIOS,
  KEVORKOVA_CARD,
  LEBEDEVA_CARD,
  VZMETNEV_CARD,
  VZMETNEV_LINKS,
  VZMETNEV_PHOTOS,
} from "../src/lib/demo-profiles";
import {
  agencies,
  agents,
  people,
  personLinks,
  personPhotos,
} from "../src/db/schema";
import type { PersonCard } from "../src/lib/person-card";

config({ path: ".env.local" });
config({ path: ".env" });

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(webRoot, "..");

type FaceCard = {
  slug: string;
  name: string;
  role: string;
  profession: string;
  city?: string;
  img?: string;
  verified?: boolean;
  hint?: string;
};

type CrewRow = {
  slug: string;
  name: string;
  role: string;
  profession: string;
  city: string;
  img?: string;
  verified?: boolean;
  hint?: string;
  bio?: string;
  initials?: string;
  bg?: string;
  birthDate?: string;
  sourceUrl?: string;
  agencyId?: string;
  agentId?: string;
  card?: PersonCard;
};

const CREW: CrewRow[] = [
  {
    slug: "vzmetnev",
    name: "Александр Взметнев",
    role: "Актёр",
    profession: "actor",
    city: "Москва",
    img: "assets/actors/vzmetnev-kinopoisk.jpg",
    verified: true,
    hint: "«Любовь СССР» · Кинопоиск",
    bio: DEMO_BIOS.vzmetnev,
    birthDate: "1993-08-18",
    sourceUrl: "https://www.kinopoisk.ru/name/4531331/",
    card: VZMETNEV_CARD,
  },
  {
    slug: "lebedeva",
    name: "Анна Лебедева",
    role: "Кастинг-директор",
    profession: "casting",
    city: "Москва",
    img: "assets/figma/avatar-02.png",
    verified: true,
    hint: "«Тихий январь» · Sreda",
    bio: DEMO_BIOS.lebedeva,
    card: LEBEDEVA_CARD,
  },
  {
    slug: "kevorkova",
    name: "Анна Кеворкова",
    role: "Агент",
    profession: "agent",
    city: "Москва",
    img: "assets/figma/avatar-01.png",
    verified: true,
    hint: "Агентство «Актёр 1»",
    bio: DEMO_BIOS.kevorkova,
    sourceUrl: "https://akter1.ru/",
    agencyId: "akter1",
    agentId: "anna-kevorkova",
    card: KEVORKOVA_CARD,
  },
];

function publicPath(img?: string) {
  if (!img) return null;
  if (/^https?:\/\//i.test(img)) return img;
  return img.startsWith("/") ? img : `/${img}`;
}

function loadAkter1(): FaceCard[] {
  const text = readFileSync(resolve(repoRoot, "assets/akter1-faces.js"), "utf8");
  const json = text
    .replace(/^[\s\S]*?window\.AKTER1_FACES\s*=\s*/, "")
    .replace(/;\s*$/, "");
  return JSON.parse(json) as FaceCard[];
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  const faces = loadAkter1();

  await db.delete(personPhotos);
  await db.delete(personLinks);
  await db.delete(people);
  await db.delete(agents);
  await db.delete(agencies);

  await db.insert(agencies).values({
    id: "akter1",
    name: "Актёр 1",
    website: "https://akter1.ru",
  });

  await db.insert(agents).values({
    id: "anna-kevorkova",
    name: "Анна Кеворкова",
    email: "anna@akter1.ru",
    agencyId: "akter1",
  });

  const crewRows = CREW.map((p) => ({
    slug: p.slug,
    name: p.name,
    role: p.role,
    profession: p.profession,
    city: p.city,
    bio: p.bio ?? null,
    imageUrl: publicPath(p.img),
    coverUrl: null,
    verified: Boolean(p.verified),
    sourceUrl: p.sourceUrl ?? null,
    birthDate: p.birthDate ?? null,
    agencyId: p.agencyId ?? null,
    agentId: p.agentId ?? null,
    hint: p.hint ?? null,
    initials: p.initials ?? initialsOf(p.name),
    bg: p.bg ?? null,
    card: p.card ?? null,
  }));

  const akterRows = faces.map((card) => {
    const path = card.profession === "actress" ? "actress" : "actor";
    return {
      slug: card.slug,
      name: card.name,
      role: card.role,
      profession: card.profession,
      city: card.city || "Москва",
      bio: `${card.role} агентства «Актёр 1». Москва.`,
      imageUrl: publicPath(card.img),
      coverUrl: null,
      verified: card.verified !== false,
      sourceUrl: `https://akter1.ru/${path}/item/${card.slug}.html`,
      birthDate: null,
      agencyId: "akter1",
      agentId: "anna-kevorkova",
      hint: card.hint || "Агентство «Актёр 1»",
      initials: initialsOf(card.name),
      bg: null,
      card: null,
    };
  });

  await db.insert(people).values([...crewRows, ...akterRows]);

  await db.insert(personPhotos).values(
    VZMETNEV_PHOTOS.map((url, i) => ({
      id: `vzmetnev-${i}`,
      personSlug: "vzmetnev",
      url,
      sort: i,
    })),
  );
  await db.insert(personLinks).values(
    VZMETNEV_LINKS.map((l) => ({
      id: `vzmetnev-${l.kind}`,
      personSlug: "vzmetnev",
      kind: l.kind,
      url: l.url,
    })),
  );

  console.log(`seed: ${crewRows.length} crew + ${akterRows.length} akter1 = ${crewRows.length + akterRows.length}`);
  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
