/**
 * Match kino-teatr.ru photos onto existing agency people only.
 * Does not import the encyclopedia (deceased / historical / inactive).
 *
 *   npm run db:scrape-kinoteatr
 */
import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { agencies, people, personLinks } from "../src/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const LETTERS = [
  "",
  "a",
  "b",
  "v",
  "g",
  "d",
  "e",
  "ye",
  "zh",
  "z",
  "i",
  "y",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "r",
  "s",
  "t",
  "u",
  "f",
  "h",
  "ts",
  "ch",
  "sh",
  "sch",
  "yu",
  "ya",
  "c",
  "cz",
  "j",
];

const GENDERS = [
  { key: "m" as const, profession: "actor" as const, role: "Актёр" },
  { key: "w" as const, profession: "actress" as const, role: "Актриса" },
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function decodeBody(buf: Buffer, contentType: string): string {
  const head = buf.toString("latin1").slice(0, 2000);
  const headerCs = contentType.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase();
  const metaCs = head.match(/charset=["']?([\w-]+)/i)?.[1]?.toLowerCase();
  const cs = (headerCs || metaCs || "windows-1251").replace("cp1251", "windows-1251");
  try {
    return new TextDecoder(cs).decode(buf);
  } catch {
    return buf.toString("utf8");
  }
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "ru",
        Accept: "text/html",
        Referer: "https://www.kino-teatr.ru/",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    if (res.status >= 400) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return decodeBody(buf, res.headers.get("content-type") || "text/html; charset=windows-1251");
  } catch {
    return null;
  }
}

function nameKey(name: string) {
  return name
    .toLowerCase()
    .replace(/ё/g, "е")
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .sort()
    .join(" ");
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

type Listed = {
  id: string;
  name: string;
  photo: string;
  url: string;
  profession: "actor" | "actress";
  role: string;
  region: "ros" | "sov";
};

function parseList(html: string, gender: (typeof GENDERS)[number], region: "ros" | "sov"): Listed[] {
  const out: Listed[] = [];
  const seen = new Set<string>();
  const re = new RegExp(`/acter/foto/${region}/(\\d+)\\.jpg"[^>]*alt="([^"]+)"`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const name = decodeHtml(m[2]).replace(/\s+/g, " ").trim();
    if (name.length < 4) continue;
    out.push({
      id,
      name,
      photo: `https://www.kino-teatr.ru/acter/foto/${region}/${id}.jpg`,
      url: `https://www.kino-teatr.ru/kino/acter/${gender.key}/${region}/${id}/bio/`,
      profession: gender.profession,
      role: gender.role,
      region,
    });
  }
  return out;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const listed: Listed[] = [];
  const seen = new Set<string>();

  for (const region of ["ros"] as const) {
    for (const gender of GENDERS) {
      for (const letter of LETTERS) {
        const path = letter ? `${letter}/` : "";
        const page = `https://www.kino-teatr.ru/kino/acter/${gender.key}/${region}/${path}`;
        const html = await fetchPage(page);
        if (!html) continue;
        const cards = parseList(html, gender, region);
        for (const card of cards) {
          if (seen.has(card.id)) continue;
          seen.add(card.id);
          listed.push(card);
        }
        await sleep(80);
      }
      console.log(`  ${gender.key}/${region}: running total ${listed.length}`);
    }
  }

  console.log(`kino-teatr listed ${listed.length}`);

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  await db
    .insert(agencies)
    .values({ id: "kino-teatr", name: "Кино-Театр.Ру", website: "https://www.kino-teatr.ru" })
    .onConflictDoUpdate({
      target: agencies.id,
      set: { name: "Кино-Театр.Ру", website: "https://www.kino-teatr.ru" },
    });

  const existing = await db.select({
    slug: people.slug,
    name: people.name,
    imageUrl: people.imageUrl,
  }).from(people);

  const byKey = new Map<string, (typeof existing)[number]>();
  for (const row of existing) {
    const key = nameKey(row.name);
    if (!byKey.has(key)) byKey.set(key, row);
  }

  let matched = 0;
  let skipped = 0;

  for (const card of listed) {
    if (card.region === "sov") {
      skipped += 1;
      continue;
    }
    const key = nameKey(card.name);
    const hit = byKey.get(key);
    if (hit && !hit.imageUrl) {
      await db
        .update(people)
        .set({ imageUrl: card.photo })
        .where(eq(people.slug, hit.slug));
      await db
        .insert(personLinks)
        .values({
          id: `${hit.slug}-kino-teatr`,
          personSlug: hit.slug,
          kind: "kino-teatr",
          url: card.url,
        })
        .onConflictDoNothing();
      hit.imageUrl = card.photo;
      matched += 1;
      continue;
    }
    if (hit) {
      skipped += 1;
      continue;
    }
    skipped += 1;
  }

  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(people);
  console.log(`kino-teatr photos onto agency roster: matched=${matched} skipped=${skipped} people=${n}`);
  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
