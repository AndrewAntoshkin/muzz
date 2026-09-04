/**
 * Pull birth date, agent, Kinopoisk/Vimeo/kino-teatr links and photos
 * from akter1.ru profile pages. Writes only what the page actually has.
 *
 *   npm run db:enrich -- --limit 12 --offset 0
 *   npm run db:enrich -- --all
 */
import { config } from "dotenv";
import { and, asc, eq, isNotNull, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { agents, people, personLinks, personPhotos } from "../src/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

const MONTHS: Record<string, string> = {
  января: "01",
  февраля: "02",
  марта: "03",
  апреля: "04",
  мая: "05",
  июня: "06",
  июля: "07",
  августа: "08",
  сентября: "09",
  октября: "10",
  ноября: "11",
  декабря: "12",
};

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function parseRuDate(raw: string): string | null {
  const cleaned = raw.replace(/[Гг.]+/g, " ").replace(/\s+/g, " ").trim();
  const m = cleaned.match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
}

function slugifyAgent(name: string) {
  return name
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-|-$/g, "") || "agent";
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function absUrl(href: string) {
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return `https://akter1.ru${href}`;
  return href;
}

type Scraped = {
  birthDate: string | null;
  agentName: string | null;
  agentEmail: string | null;
  links: { kind: string; url: string }[];
  photos: string[];
};

function scrapeProfile(html: string): Scraped {
  const birthRaw =
    html.match(/Дата рождения:\s*<\/div>\s*([^<]+)/i)?.[1] ??
    html.match(/Дата рождения:<\/div>\s*([^<]+)/i)?.[1] ??
    null;
  const birthDate = birthRaw ? parseRuDate(birthRaw) : null;

  const agentName = html.match(/Агент:\s*<strong>([^<]+)<\/strong>/i)?.[1]?.trim() ?? null;
  const agentEmail =
    html.match(/E-mail:\s*<strong>([^<]+)<\/strong>/i)?.[1]?.trim() ?? null;

  const links: { kind: string; url: string }[] = [];
  const kp = html.match(/href="(https?:\/\/(?:www\.)?kinopoisk\.ru\/name\/[^"]+)"/i);
  if (kp) links.push({ kind: "kinopoisk", url: decodeHtml(kp[1]) });
  const kt = html.match(/href="(https?:\/\/(?:www\.)?kino-teatr\.ru\/[^"]+)"/i);
  if (kt) links.push({ kind: "kino-teatr", url: decodeHtml(kt[1]) });
  const vimeo = html.match(/href="(\/\/vimeo\.com\/\d+[^"]*)"/i) ?? html.match(/href="(https?:\/\/vimeo\.com\/\d+[^"]*)"/i);
  if (vimeo) {
    const url = absUrl(decodeHtml(vimeo[1])).replace(/\?.*$/, "");
    links.push({ kind: "vimeo", url });
  }

  const photos: string[] = [];
  const seen = new Set<string>();
  const galleryAt = html.search(/class="[^"]*photogallery/i);
  const gallery = galleryAt >= 0 ? html.slice(galleryAt, galleryAt + 120_000) : html;
  const re = /href="(https?:\/\/akter1\.ru\/images\/uploads\/[^"]+\.(?:jpe?g|png|webp))"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(gallery))) {
    const url = decodeHtml(m[1]);
    if (seen.has(url)) continue;
    seen.add(url);
    photos.push(url);
    if (photos.length >= 24) break;
  }

  return { birthDate, agentName, agentEmail, links, photos };
}

async function fetchPage(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Referer: "https://akter1.ru/",
      "Accept-Language": "ru,en;q=0.8",
    },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.text();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const all = hasFlag("all");
  const limit = all ? 10_000 : Number(arg("limit", "12"));
  const offset = Number(arg("offset", "0"));

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  const roster = await db
    .select({
      slug: people.slug,
      name: people.name,
      sourceUrl: people.sourceUrl,
      agencyId: people.agencyId,
    })
    .from(people)
    .where(and(isNotNull(people.sourceUrl), like(people.sourceUrl, "%akter1.ru%")))
    .orderBy(asc(people.slug));

  const batch = roster.slice(offset, offset + limit);
  console.log(`enrich: ${batch.length} of ${roster.length} (offset ${offset})`);

  let ok = 0;
  let fail = 0;

  for (const person of batch) {
    const source = person.sourceUrl;
    if (!source) continue;
    try {
      const html = await fetchPage(source);
      const data = scrapeProfile(html);

      let agentId: string | null = null;
      if (data.agentName) {
        agentId = slugifyAgent(data.agentName);
        await db
          .insert(agents)
          .values({
            id: agentId,
            name: data.agentName,
            email: data.agentEmail,
            agencyId: person.agencyId,
          })
          .onConflictDoUpdate({
            target: agents.id,
            set: {
              name: data.agentName,
              email: data.agentEmail ?? undefined,
            },
          });
      }

      await db
        .update(people)
        .set({
          birthDate: data.birthDate,
          agentId,
        })
        .where(eq(people.slug, person.slug));

      await db.delete(personLinks).where(eq(personLinks.personSlug, person.slug));
      if (data.links.length) {
        await db.insert(personLinks).values(
          data.links.map((l) => ({
            id: `${person.slug}-${l.kind}`,
            personSlug: person.slug,
            kind: l.kind,
            url: l.url,
          })),
        );
      }

      await db.delete(personPhotos).where(eq(personPhotos.personSlug, person.slug));
      if (data.photos.length) {
        await db.insert(personPhotos).values(
          data.photos.map((photo, i) => ({
            id: `${person.slug}-${i}`,
            personSlug: person.slug,
            url: photo,
            sort: i,
          })),
        );
      }

      ok += 1;
      console.log(
        `  ${person.slug}: birth=${data.birthDate ?? "—"} agent=${data.agentName ?? "—"} links=${data.links.length} photos=${data.photos.length}`,
      );
    } catch (err) {
      fail += 1;
      console.error(`  FAIL ${person.slug}:`, err instanceof Error ? err.message : err);
    }
    await sleep(450);
  }

  console.log(`enrich done: ok=${ok} fail=${fail}`);
  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
