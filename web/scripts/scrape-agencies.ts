/**
 * Scrape live actor catalogs into people. Writes only fields present on the page.
 *
 *   npm run db:scrape -- --limit 8
 *   npm run db:scrape
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { agencies, agents, people, personLinks, personPhotos } from "../src/db/schema";
import type { Credit, PersonCard } from "../src/lib/person-card";

config({ path: ".env.local" });
config({ path: ".env" });

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(html: string) {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
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

function parseDotDate(raw: string) {
  const m = raw.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function slugifyAgent(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-zа-я0-9]+/gi, "-")
      .replace(/^-|-$/g, "") || "agent"
  );
}

async function fetchPage(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept-Language": "ru,en;q=0.8",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

type Listed = {
  url: string;
  slug: string;
  profession: "actor" | "actress";
};

type Scraped = {
  name: string;
  birthDate: string | null;
  imageUrl: string | null;
  agentName: string | null;
  agentEmail: string | null;
  links: { kind: string; url: string }[];
  photos: string[];
  card: PersonCard;
};

function labeledItems(html: string) {
  const out: Record<string, string> = {};
  const re = /<div class=['"]info__text_item['"]>\s*<b>([^<]+):?\s*<\/b>\s*([\s\S]*?)<\/div>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const key = stripTags(m[1]).replace(/:$/, "").trim();
    out[key] = m[2];
  }
  return out;
}

function kindOfLink(url: string) {
  if (/kinopoisk\.ru/i.test(url)) return "kinopoisk";
  if (/kino-teatr\.ru/i.test(url)) return "kino-teatr";
  if (/kinolift\./i.test(url)) return "kinolift";
  if (/vimeo\.com/i.test(url)) return "vimeo";
  if (/t\.me|telegram/i.test(url)) return "telegram";
  if (/instagram\.com/i.test(url)) return "instagram";
  return "site";
}

function parseFilmName(raw: string): Credit {
  const cleaned = stripTags(raw);
  const m = cleaned.match(/^«([^»]+)»\s*(?:[-–—]\s*)?(.*)$/);
  if (!m) return { title: cleaned };
  const rest = m[2].trim();
  const parts = rest.split(/,\s*реж\.\s*/i);
  const credit = parts[0]?.trim() || undefined;
  const director = parts[1]?.trim();
  return {
    title: `«${m[1]}»`,
    credit,
    meta: director ? `реж. ${director}` : undefined,
  };
}

function parseCastingrus(html: string): Scraped {
  const name =
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ||
    html.match(/<title>([^<]+)<\/title>/i)?.[1]?.split("—")[0]?.trim() ||
    "Без имени";

  const fields = labeledItems(html);
  const birthDate = fields["Дата рождения"] ? parseDotDate(stripTags(fields["Дата рождения"])) : null;
  const heightRaw = fields["Рост"] ? stripTags(fields["Рост"]).replace(/\.$/, "") : null;
  const education = fields["Образование"] ? stripTags(fields["Образование"]).replace(/\.$/, "") : null;

  const params: PersonCard["params"] = [];
  if (heightRaw) params.push({ label: "Рост", value: heightRaw });
  if (education) params.push({ label: "Образование", value: education });

  let agentName: string | null = null;
  let agentEmail: string | null = null;
  const managerHtml = fields["Кастинг-менеджер"] || "";
  if (managerHtml) {
    const text = stripTags(managerHtml);
    agentName = text.replace(/\+7[\d\s()-]+.*/, "").replace(/,.*/, "").trim() || null;
    agentEmail = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  }

  const links: { kind: string; url: string }[] = [];
  const seen = new Set<string>();
  const profiles = fields["Профайлы в сети"] || "";
  const hrefRe = /href=['"](https?:\/\/[^'"]+)['"]/gi;
  let hm: RegExpExecArray | null;
  while ((hm = hrefRe.exec(profiles))) {
    const url = decodeHtml(hm[1]).replace(/[?&]utm_[^&]+/g, "").replace(/\?$/, "");
    if (seen.has(url)) continue;
    seen.add(url);
    links.push({ kind: kindOfLink(url), url });
  }

  const credits: Credit[] = [];
  const filmRe = /<div class=['"]info__film['"]>\s*<span class=['"]info__film_year['"]>([^<]*)<\/span>\s*<span class=['"]info__film_name['"]>([\s\S]*?)<\/span>/gi;
  let fm: RegExpExecArray | null;
  while ((fm = filmRe.exec(html))) {
    const parsed = parseFilmName(fm[2]);
    credits.push({ year: stripTags(fm[1]) || undefined, ...parsed });
  }

  const photos: string[] = [];
  const photoSeen = new Set<string>();
  const og = html.match(/property=['"]og:image['"]\s+content=['"]([^'"]+)['"]/i)?.[1];
  if (og) {
    photoSeen.add(og);
    photos.push(og);
  }
  const imgRe = /src=['"](https:\/\/castingrus\.ru\/site\/files\/[^'"]+\.(?:jpe?g|png|webp))['"]/gi;
  let im: RegExpExecArray | null;
  while ((im = imgRe.exec(html))) {
    const url = decodeHtml(im[1]);
    if (photoSeen.has(url)) continue;
    photoSeen.add(url);
    photos.push(url);
    if (photos.length >= 16) break;
  }

  return {
    name,
    birthDate,
    imageUrl: photos[0] ?? null,
    agentName,
    agentEmail,
    links,
    photos,
    card: {
      height: heightRaw || undefined,
      education: education || undefined,
      params: params.length ? params : undefined,
      credits: credits.length ? credits : undefined,
    },
  };
}

async function listCastingrus(): Promise<Listed[]> {
  const out: Listed[] = [];
  const seen = new Set<string>();
  for (const kind of ["actors", "actresses"] as const) {
    for (let page = 1; page <= 8; page++) {
      const url = page === 1 ? `https://castingrus.ru/${kind}/` : `https://castingrus.ru/${kind}/page/${page}/`;
      let html: string;
      try {
        html = await fetchPage(url);
      } catch {
        break;
      }
      const re = new RegExp(`https://castingrus\\.ru/${kind}/([a-z0-9-]+)/`, "gi");
      let found = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(html))) {
        const path = m[1];
        if (path === "page" || path === "feed" || /^\d+$/.test(path)) continue;
        const href = `https://castingrus.ru/${kind}/${path}/`;
        if (seen.has(href)) continue;
        seen.add(href);
        out.push({
          url: href,
          slug: `cr-${path}`,
          profession: kind === "actresses" ? "actress" : "actor",
        });
        found += 1;
      }
      if (found === 0) break;
      await sleep(350);
    }
  }
  return out;
}

function guessProfession(name: string, html: string): "actor" | "actress" {
  if (/актриса/i.test(html) && !/актёр|актер/i.test(html.slice(0, 4000))) return "actress";
  const first = name.split(/\s+/)[0] || "";
  if (/[ая]$/i.test(first) && !/илья|никита|кузьма|фома/i.test(first)) return "actress";
  return "actor";
}

function parseThomas(html: string): Scraped {
  const name =
    stripTags(html.match(/<title>([^<]+)/i)?.[1] || "")
      .replace(/».*/, "")
      .replace(/&raquo;.*/, "")
      .trim() || "Без имени";

  const desc = html.match(/name=['"]description['"]\s+content=['"]([^'"]+)['"]/i)?.[1] || "";
  const decoded = decodeHtml(desc);
  const year = decoded.match(/рождения:\s*(\d{4})/i)?.[1] || null;
  const education =
    decoded.match(/Образование:\s*([^]+?)(?:\s+Мастерская:|$)/i)?.[1]?.trim() ||
    decoded.match(/Education:\s*([^]+)$/i)?.[1]?.trim() ||
    null;
  const workshop = decoded.match(/Мастерская:\s*([^]+)$/i)?.[1]?.trim();

  const params: PersonCard["params"] = [];
  if (year) params.push({ label: "Год рождения", value: year });
  if (education) params.push({ label: "Образование", value: education });
  if (workshop) params.push({ label: "Мастерская", value: workshop });

  const credits: Credit[] = [];
  const seenTitles = new Set<string>();
  const filmRe = /(\d{4})\s*(?:<[^>]+>)*\s*(?:<a[^>]*>)?\s*([^<(<]{2,80}?)(?:<\/a>)?\s*(?:\((реж\.[^)]+)\))?/gi;
  const body = html.match(/фильмограф[\s\S]{0,25000}/i)?.[0] || html;
  let fm: RegExpExecArray | null;
  while ((fm = filmRe.exec(body))) {
    const title = stripTags(fm[2]).replace(/^\[|\]$/g, "").trim();
    if (!title || title.length < 2 || seenTitles.has(`${fm[1]}-${title}`)) continue;
    seenTitles.add(`${fm[1]}-${title}`);
    credits.push({
      year: fm[1],
      title: title.startsWith("«") ? title : `«${title.replace(/^[«"]|[»"]$/g, "")}»`,
      meta: fm[3] ? stripTags(fm[3]) : undefined,
    });
    if (credits.length >= 40) break;
  }

  const photos: string[] = [];
  const photoSeen = new Set<string>();
  const imgRe = /src=['"](https:\/\/thomasagency\.ru\/uploads\/posts\/[^'"]+\.(?:jpe?g|png|webp))['"]/gi;
  let im: RegExpExecArray | null;
  while ((im = imgRe.exec(html))) {
    const url = decodeHtml(im[1]);
    if (photoSeen.has(url) || /logo/i.test(url)) continue;
    photoSeen.add(url);
    photos.push(url);
    if (photos.length >= 16) break;
  }

  return {
    name,
    birthDate: null,
    imageUrl: photos[0] ?? null,
    agentName: null,
    agentEmail: null,
    links: [],
    photos,
    card: {
      education: education || undefined,
      params: params.length ? params : undefined,
      credits: credits.length ? credits : undefined,
    },
  };
}

async function listThomas(): Promise<Listed[]> {
  const html = await fetchPage("https://thomasagency.ru/ru/");
  const out: Listed[] = [];
  const seen = new Set<string>();
  const re = /href=['"]https?:\/\/(?:www\.)?thomasagency\.ru\/(?:ru\/)?(\d+-[a-z0-9-]+)\.html['"]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const path = m[1];
    if (seen.has(path)) continue;
    seen.add(path);
    const ru = `https://thomasagency.ru/ru/${path}.html`;
    out.push({ url: ru, slug: `th-${path.replace(/^\d+-/, "")}`, profession: "actor" });
  }
  return out;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const limit = Number(arg("limit", "10000"));
  const offset = Number(arg("offset", "0"));
  const site = arg("site", "castingrus");

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  if (site === "thomas" || site === "all") {
    await db
      .insert(agencies)
      .values({
        id: "thomas",
        name: "Thomas Agency",
        website: "https://thomasagency.ru",
      })
      .onConflictDoUpdate({
        target: agencies.id,
        set: { name: "Thomas Agency", website: "https://thomasagency.ru" },
      });

    console.log("listing thomasagency…");
    const listed = (await listThomas()).slice(offset, offset + limit);
    console.log(`thomas profiles: ${listed.length}`);
    let ok = 0;
    let fail = 0;
    for (const item of listed) {
      try {
        const html = await fetchPage(item.url);
        const data = parseThomas(html);
        const profession = guessProfession(data.name, html);
        if (!data.name || data.name === "Без имени") throw new Error("no name");
        await db
          .insert(people)
          .values({
            slug: item.slug,
            name: data.name,
            role: profession === "actress" ? "Актриса" : "Актёр",
            profession,
            city: null,
            bio: data.card.education || null,
            imageUrl: data.imageUrl,
            coverUrl: null,
            verified: true,
            sourceUrl: item.url,
            birthDate: null,
            agencyId: "thomas",
            agentId: null,
            hint: data.card.credits?.[0]?.title || "Thomas Agency",
            initials: initialsOf(data.name),
            bg: null,
            card: data.card,
          })
          .onConflictDoUpdate({
            target: people.slug,
            set: {
              name: data.name,
              role: profession === "actress" ? "Актриса" : "Актёр",
              profession,
              bio: data.card.education || null,
              imageUrl: data.imageUrl,
              sourceUrl: item.url,
              agencyId: "thomas",
              hint: data.card.credits?.[0]?.title || "Thomas Agency",
              card: data.card,
            },
          });
        await db.delete(personPhotos).where(eq(personPhotos.personSlug, item.slug));
        if (data.photos.length) {
          await db.insert(personPhotos).values(
            data.photos.map((photo, i) => ({
              id: `${item.slug}-${i}`,
              personSlug: item.slug,
              url: photo,
              sort: i,
            })),
          );
        }
        ok += 1;
        console.log(`  ${item.slug}: ${data.name} films=${data.card.credits?.length ?? 0} photos=${data.photos.length}`);
      } catch (err) {
        fail += 1;
        console.error(`  FAIL ${item.slug}:`, err instanceof Error ? err.message : err);
      }
      await sleep(400);
    }
    console.log(`thomas scrape done: ok=${ok} fail=${fail}`);
    if (site === "thomas") {
      await client.end({ timeout: 5 });
      return;
    }
  }

  await db
    .insert(agencies)
    .values({
      id: "castingrus",
      name: "Актерское агентство Натальи Гнеушевой",
      website: "https://castingrus.ru",
    })
    .onConflictDoUpdate({
      target: agencies.id,
      set: { name: "Актерское агентство Натальи Гнеушевой", website: "https://castingrus.ru" },
    });

  console.log("listing castingrus…");
  const listed = (await listCastingrus()).slice(offset, offset + limit);
  console.log(`profiles: ${listed.length}`);

  let ok = 0;
  let fail = 0;

  for (const item of listed) {
    try {
      const html = await fetchPage(item.url);
      const data = parseCastingrus(html);
      if (!data.name || data.name === "Без имени") throw new Error("no name");

      let agentId: string | null = null;
      if (data.agentName) {
        agentId = `cr-${slugifyAgent(data.agentName)}`;
        await db
          .insert(agents)
          .values({
            id: agentId,
            name: data.agentName,
            email: data.agentEmail,
            agencyId: "castingrus",
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
        .insert(people)
        .values({
          slug: item.slug,
          name: data.name,
          role: item.profession === "actress" ? "Актриса" : "Актёр",
          profession: item.profession,
          city: null,
          bio: data.card.education || null,
          imageUrl: data.imageUrl,
          coverUrl: null,
          verified: true,
          sourceUrl: item.url,
          birthDate: data.birthDate,
          agencyId: "castingrus",
          agentId,
          hint: data.card.credits?.[0]?.title || "Агентство Натальи Гнеушевой",
          initials: initialsOf(data.name),
          bg: null,
          card: data.card,
        })
        .onConflictDoUpdate({
          target: people.slug,
          set: {
            name: data.name,
            role: item.profession === "actress" ? "Актриса" : "Актёр",
            profession: item.profession,
            bio: data.card.education || null,
            imageUrl: data.imageUrl,
            sourceUrl: item.url,
            birthDate: data.birthDate,
            agencyId: "castingrus",
            agentId,
            hint: data.card.credits?.[0]?.title || "Агентство Натальи Гнеушевой",
            card: data.card,
          },
        });

      await db.delete(personLinks).where(eq(personLinks.personSlug, item.slug));
      if (data.links.length) {
        await db.insert(personLinks).values(
          data.links.map((l, i) => ({
            id: `${item.slug}-${l.kind}-${i}`,
            personSlug: item.slug,
            kind: l.kind,
            url: l.url,
          })),
        );
      }

      await db.delete(personPhotos).where(eq(personPhotos.personSlug, item.slug));
      if (data.photos.length) {
        await db.insert(personPhotos).values(
          data.photos.map((photo, i) => ({
            id: `${item.slug}-${i}`,
            personSlug: item.slug,
            url: photo,
            sort: i,
          })),
        );
      }

      ok += 1;
      console.log(
        `  ${item.slug}: ${data.name} birth=${data.birthDate ?? "—"} h=${data.card.height ?? "—"} films=${data.card.credits?.length ?? 0} photos=${data.photos.length}`,
      );
    } catch (err) {
      fail += 1;
      console.error(`  FAIL ${item.slug}:`, err instanceof Error ? err.message : err);
    }
    await sleep(400);
  }

  console.log(`scrape done: ok=${ok} fail=${fail}`);
  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
