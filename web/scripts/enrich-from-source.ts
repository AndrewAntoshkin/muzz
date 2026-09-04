/**
 * Visit each person's sourceUrl and fill photo / bio / extras from the live page.
 *
 *   npm run db:enrich-sources
 *   npx tsx scripts/enrich-from-source.ts --limit 40
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { agencies, people, personPhotos } from "../src/db/schema";
import type { Credit, PersonCard } from "../src/lib/person-card";

config({ path: ".env.local" });
config({ path: ".env" });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

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

const MALE_FIRST = new Set(
  "александр алексей андрей антон артём артем борис вадим валентин валерий василий виктор виталий владимир влад всеволод вячеслав геннадий георгий григорий даниил денис дмитрий евгений егор иван игорь илья кирилл константин лев леонид максим матвей михаил никита николай олег павел пётр петр роман руслан сергей станислав степан тимофей фёдор федор юрий ярослав".split(
    " ",
  ),
);

const FEMALE_FIRST = new Set(
  "александра алина алиса алла анастасия анна валентина валерия вера вероника виктория дарья дария евгения екатерина елена елизавета ирина ксения лариса лидия людмила марина мария марья наталья наталия надежда нина оксана ольга полина светлана софия софья татьяна юлия яна".split(
    " ",
  ),
);

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, n) }, worker));
  return out;
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseAttrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([:\w-]+)\s*=\s*(["'])([\s\S]*?)\2/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) out[m[1].toLowerCase()] = m[3];
  return out;
}

function absUrl(href: string, base: string): string | null {
  const raw = decodeHtml(href).trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("javascript:")) return null;
  try {
    return new URL(raw, base).href;
  } catch {
    return null;
  }
}

function decodeBody(buf: Buffer, contentType: string): string {
  const head = buf.toString("latin1").slice(0, 2500);
  const headerCs = contentType.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase();
  const metaCs = head.match(/charset=["']?([\w-]+)/i)?.[1]?.toLowerCase();
  const cs = (headerCs || metaCs || "utf-8")
    .replace("cp1251", "windows-1251")
    .replace("utf8", "utf-8");
  try {
    return new TextDecoder(cs).decode(buf);
  } catch {
    return buf.toString("utf8");
  }
}

async function fetchPage(url: string): Promise<{ url: string; html: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "ru,en;q=0.9",
        Accept: "text/html,application/xhtml+xml",
        Referer: new URL(url).origin + "/",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (res.status >= 400) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 5_000_000) return null;
    return { url: res.url, html: decodeBody(buf, res.headers.get("content-type") || "") };
  } catch {
    return null;
  }
}

function isJunkImage(url: string) {
  return /(?:logo|favicon|sprite|icon|pixel|1x1|spacer|blank|button|header|menu|counter|captcha|FCH\.jpg|AGNI[-_]?\d|whatsapp|telegram|instagram|facebook|tilda\.cc\/img|resize\/20x|no-avatar|user_empty|\/banner|slider\/|_banner|nevesta|fixiki|fintiflushki|\/images\/content\/)/i.test(
    url,
  );
}

function cleanImageUrl(url: string) {
  return url
    .replace(/\/-\/resize\/\d+x[^/]*\//, "/")
    .replace(/\/-\/empty\//, "/")
    .replace("thb.tildacdn.com", "static.tildacdn.com");
}

function metaContent(html: string, prop: string): string | null {
  const re = new RegExp(
    `(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`,
    "i",
  );
  const m = html.match(re);
  const v = m?.[1] || m?.[2];
  return v ? decodeHtml(v) : null;
}

const TRANSLIT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function nameTokens(name: string) {
  const words = name
    .toLowerCase()
    .replace(/ё/g, "е")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2);
  const extra = words.map((w) => w.split("").map((ch) => TRANSLIT[ch] ?? ch).join(""));
  return [...new Set([...words, ...extra])];
}

function imageScore(url: string, alt: string, name: string, isOg: boolean) {
  if (isJunkImage(url)) return -1;
  if (!/\.(jpe?g|png|webp|avif)(\?|$)/i.test(url) && !/tildacdn|wp-content\/uploads|ucarecdn|\/upload\//i.test(url)) {
    return -1;
  }
  const blob = `${url} ${alt}`.toLowerCase().replace(/ё/g, "е");
  const tokens = nameTokens(name);
  const hits = tokens.filter((t) => blob.includes(t)).length;
  let score = 1;
  if (isOg) score += hits ? 8 : 2;
  if (hits >= 2) score += 12;
  else if (hits === 1) score += 8;
  if (/wp-content\/uploads/i.test(url) && !/elementor\/thumbs/i.test(url)) score += 3;
  if (/tildacdn/i.test(url)) score += 2;
  if (/\/upload\//i.test(url)) score += 2;
  if (/photogallery|portfolio|actor|actress|akter/i.test(url)) score += 2;
  if (/virtuemart|shop_image\/product|com_virtuemart/i.test(url)) score += 10;
  if (/\/(?:photo|photos|gallery|album)\//i.test(url)) score += 2;
  return score;
}

function extractImages(html: string, pageUrl: string, name: string): string[] {
  const scored: { url: string; score: number }[] = [];
  const seen = new Set<string>();

  const add = (raw: string | null, alt: string, isOg = false) => {
    if (!raw) return;
    const url0 = absUrl(raw, pageUrl);
    if (!url0) return;
    const url = cleanImageUrl(url0);
    if (seen.has(url)) return;
    const score = imageScore(url, alt, name, isOg);
    if (score < 0) return;
    seen.add(url);
    scored.push({ url, score });
  };

  add(metaContent(html, "og:image"), "og", true);
  add(metaContent(html, "twitter:image"), "twitter", true);

  const imgRe = /<img\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html))) {
    const a = parseAttrs(m[0]);
    const src = a["data-original"] || a["data-src"] || a["data-lazy-src"] || a.src || "";
    add(src, `${a.alt || ""} ${a.title || ""}`);
  }

  const hrefRe = /<(?:a|link)\b[^>]*>/gi;
  while ((m = hrefRe.exec(html))) {
    const a = parseAttrs(m[0]);
    const href = a.href || "";
    if (/\.(jpe?g|png|webp)(\?|$)/i.test(href)) add(href, a.title || "");
  }

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]?.score ?? 0;
  const kept = best >= 10 ? scored.filter((x) => x.score >= 8) : scored.filter((x) => x.score >= 3);
  return kept.slice(0, 12).map((x) => x.url);
}

function visibleText(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|li|tr|h\d|td|th)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function parseRuDate(raw: string): string | null {
  const cleaned = raw.replace(/[Гг.]+/g, " ").replace(/\s+/g, " ").trim();
  const named = cleaned.match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i);
  if (named) {
    const month = MONTHS[named[2].toLowerCase()];
    if (month) return `${named[3]}-${month}-${named[1].padStart(2, "0")}`;
  }
  const dotted = cleaned.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotted) return `${dotted[3]}-${dotted[2].padStart(2, "0")}-${dotted[1].padStart(2, "0")}`;
  return null;
}

function labeled(html: string, label: string): string | null {
  const re = new RegExp(`${label}\\s*[:–—]?\\s*</(?:b|strong|span|div|dt|td)[^>]*>\\s*([^<]{2,120})`, "i");
  const m = html.match(re);
  if (m) return decodeHtml(m[1]).replace(/\s+/g, " ").trim();
  const re2 = new RegExp(`${label}\\s*[:–—]\\s*([^<\\n]{2,80})`, "i");
  const m2 = html.match(re2);
  if (m2) return decodeHtml(m2[1]).replace(/\s+/g, " ").trim();
  const text = visibleText(html);
  const re3 = new RegExp(`${label}\\s*[:–—]\\s*([^\\n]{2,80})`, "i");
  const m3 = text.match(re3);
  return m3 ? m3[1].replace(/\s+/g, " ").trim() : null;
}

function extractBio(html: string, name: string): string | null {
  const desc = metaContent(html, "og:description") || metaContent(html, "description");
  if (desc && desc.length > 40 && desc.length < 600 && !/кино-театр\.ру$/i.test(desc)) {
    const low = desc.toLowerCase();
    const agencyish = /агентств|предлагает|каталог акт|лучшие профессиональн/i.test(desc);
    if (!agencyish && (!/^актерское агентство/i.test(desc) || nameTokens(name).some((t) => low.includes(t)))) {
      return desc.trim();
    }
  }
  const about = html.match(/<(?:p|div)[^>]{0,80}(?:class|id)=["'][^"']*(?:about|bio|desc|anketa)[^"']*["'][^>]*>([\s\S]{40,500}?)<\//i);
  if (about) {
    const text = decodeHtml(about[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (text.length > 40 && text.length < 600) return text;
  }
  return null;
}

function extractCredits(html: string): Credit[] {
  const credits: Credit[] = [];
  const seen = new Set<string>();
  const text = visibleText(html);
  const patterns = [
    /(\d{4})\s*[-–—]\s*[«„"]([^»“"]{2,90})[»“"]/g,
    /(\d{4})\s*[-–—:]\s*([^\n]{2,90})/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const year = Number(m[1]);
      if (year < 1950 || year > 2032) continue;
      let title = m[2].replace(/\s+/g, " ").trim();
      title = title.replace(/\s*[-–—]\s*(?:роль|реж\.|режиссёр).*$/i, "").trim();
      title = title.replace(/[.;,]+$/g, "").trim();
      if (title.length < 2 || title.length > 90) continue;
      if (/^(кино|театр|реклама|сериал|тв|роль|образование|рост|вес)$/i.test(title)) continue;
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const wrapped = /^[«"]/.test(title) ? title : `«${title}»`;
      credits.push({ year: m[1], title: wrapped });
      if (credits.length >= 40) return credits;
    }
  }
  return credits;
}

function cleanLabelValue(raw: string | null, max = 80) {
  if (!raw) return null;
  const v = raw.replace(/\s+/g, " ").replace(/[.;]+$/g, "").trim();
  if (v.length < 2 || v.length > max) return null;
  if (/^(undefined|null|—|-)$/i.test(v)) return null;
  return v;
}

function extractCard(html: string): PersonCard | null {
  const params: { label: string; value: string }[] = [];
  const appearance: { label: string; value: string }[] = [];

  const heightRaw = labeled(html, "Рост");
  const heightNum = heightRaw?.match(/(\d{2,3})/)?.[1];
  const height = heightNum ? `${heightNum} см` : null;
  const weightRaw = labeled(html, "Вес");
  const weightNum = weightRaw?.match(/(\d{2,3})/)?.[1];
  const education = cleanLabelValue(labeled(html, "Образование"), 160);
  const city = cleanLabelValue(labeled(html, "Город"), 40);
  const hair =
    cleanLabelValue(labeled(html, "Цвет волос"), 40) ||
    cleanLabelValue(labeled(html, "Волосы"), 40);
  const eyes =
    cleanLabelValue(labeled(html, "Цвет глаз"), 40) ||
    cleanLabelValue(labeled(html, "Глаза"), 40);
  const look =
    cleanLabelValue(labeled(html, "Тип внешности"), 40) ||
    cleanLabelValue(labeled(html, "Внешность"), 40);
  const clothes = cleanLabelValue(labeled(html, "Размер одежды"), 20) || cleanLabelValue(labeled(html, "Одежда"), 20);
  const shoes = cleanLabelValue(labeled(html, "Размер обуви"), 20) || cleanLabelValue(labeled(html, "Обувь"), 20);
  const body = cleanLabelValue(labeled(html, "Телосложение"), 40);

  if (height) params.push({ label: "Рост", value: height });
  if (weightNum) params.push({ label: "Вес", value: `${weightNum} кг` });
  if (education) params.push({ label: "Образование", value: education });
  if (city) params.push({ label: "Город", value: city });
  if (clothes) params.push({ label: "Одежда", value: clothes });
  if (shoes) params.push({ label: "Обувь", value: shoes });
  if (hair) appearance.push({ label: "Волосы", value: hair });
  if (eyes) appearance.push({ label: "Глаза", value: eyes });
  if (look) appearance.push({ label: "Тип внешности", value: look });
  if (body) appearance.push({ label: "Телосложение", value: body });

  const credits = extractCredits(html);
  if (!params.length && !appearance.length && !credits.length) return null;
  return {
    height: height || undefined,
    education: education || undefined,
    params: params.length ? params : undefined,
    appearance: appearance.length ? appearance : undefined,
    credits: credits.length ? credits : undefined,
  };
}

function isThinCard(card: PersonCard | null | undefined) {
  if (!card) return true;
  return !card.params?.length && !card.credits?.length && !card.height && !card.education && !card.appearance?.length;
}

function mergeCard(base: PersonCard | null | undefined, extra: PersonCard | null): PersonCard | null {
  if (!extra) return base ?? null;
  if (!base || isThinCard(base)) return extra;
  return {
    ...base,
    height: base.height || extra.height,
    education: base.education || extra.education,
    instagram: base.instagram || extra.instagram,
    params: base.params?.length ? base.params : extra.params,
    appearance: base.appearance?.length ? base.appearance : extra.appearance,
    languages: base.languages?.length ? base.languages : extra.languages,
    skills: base.skills?.length ? base.skills : extra.skills,
    credits: base.credits?.length ? base.credits : extra.credits,
    showreel: base.showreel || extra.showreel,
  };
}

function guessActress(name: string, html: string, url: string) {
  if (/\/actress|\/aktris|\/woman\/|\/female\/|\/w\//i.test(url)) return true;
  const tokens = name
    .toLowerCase()
    .replace(/ё/g, "е")
    .split(/[\s-]+/)
    .filter(Boolean);
  if (tokens.some((t) => FEMALE_FIRST.has(t))) return true;
  if (tokens.some((t) => MALE_FIRST.has(t))) return false;
  const first = tokens[0] || "";
  return /[ая]$/i.test(first) && !/илья|никита|кузьма|фома/.test(first);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const limit = Number(arg("limit", "10000"));
  const concurrency = Number(arg("concurrency", "8"));

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  const badAgencies = await db.select().from(agencies);
  for (const row of badAgencies) {
    let name = row.name.replace(/^Главная\s*\/\/\s*/i, "").trim();
    if (/^главн/i.test(name) || name.length < 3) {
      try {
        name = new URL(row.website || "").hostname.replace(/^www\./, "");
      } catch {
        name = row.id;
      }
    }
    if (name !== row.name) {
      await db.update(agencies).set({ name }).where(eq(agencies.id, row.id));
      console.log(`agency ${row.id}: ${row.name} → ${name}`);
    }
  }

  const rows = await db
    .select({
      slug: people.slug,
      name: people.name,
      sourceUrl: people.sourceUrl,
      imageUrl: people.imageUrl,
      bio: people.bio,
      card: people.card,
      profession: people.profession,
    })
    .from(people);

  const onlyPhoto = process.argv.includes("--missing-photo");
  const slugFilter = arg("slug");
  const batch = rows
    .filter((r) => r.sourceUrl)
    .filter((r) => (slugFilter ? r.slug === slugFilter : true))
    .filter((r) => (onlyPhoto ? !r.imageUrl : slugFilter || isThinCard(r.card)))
    .slice(0, limit);
  console.log(`enrich sources: ${batch.length} thin profiles${onlyPhoto ? " (photos only)" : ""}`);

  let ok = 0;
  let fail = 0;
  let withPhoto = 0;

  await pool(batch, concurrency, async (person) => {
    const source = person.sourceUrl!;
    const fetched = await fetchPage(source);
    if (!fetched) {
      fail += 1;
      return;
    }
    const photos = extractImages(fetched.html, fetched.url, person.name);
    const extractedBio = extractBio(fetched.html, person.name);
    const promoBio = (s?: string | null) => !!s && /агентств|предлагает|лучшие профессиональн/i.test(s);
    const birthRaw = labeled(fetched.html, "Дата рождения") || labeled(fetched.html, "Родилась") || labeled(fetched.html, "Родился");
    const birthDate = birthRaw ? parseRuDate(birthRaw) : null;
    const extracted = extractCard(fetched.html);
    const actress = guessActress(person.name, fetched.html, fetched.url);

    const patch: Record<string, unknown> = {};
    if (photos[0] && (!person.imageUrl || isJunkImage(person.imageUrl))) patch.imageUrl = photos[0];
    if (extractedBio && (!person.bio || promoBio(person.bio))) patch.bio = extractedBio;
    else if (!extractedBio && promoBio(person.bio)) patch.bio = null;
    if (birthDate) patch.birthDate = birthDate;
    if (extracted && (isThinCard(person.card) || slugFilter)) {
      patch.card = slugFilter ? mergeCard(extracted, person.card) : mergeCard(person.card, extracted);
    }
    if (actress && person.profession === "actor") {
      patch.profession = "actress";
      patch.role = "Актриса";
    }

    if (Object.keys(patch).length) {
      await db.update(people).set(patch).where(eq(people.slug, person.slug));
    }
    const gallery = [...photos];
    if (person.imageUrl && !gallery.includes(person.imageUrl) && !isJunkImage(person.imageUrl)) {
      gallery.unshift(person.imageUrl);
    }
    if (gallery.length) {
      await db.delete(personPhotos).where(eq(personPhotos.personSlug, person.slug));
      await db.insert(personPhotos).values(
        gallery.slice(0, 12).map((photo, i) => ({
          id: `${person.slug}-${i}`,
          personSlug: person.slug,
          url: photo,
          sort: i,
        })),
      );
      withPhoto += 1;
    }
    ok += 1;
    if (ok % 50 === 0) console.log(`  ${ok}/${batch.length} filled=${withPhoto} fail=${fail}`);
    await sleep(40);
  });

  console.log(`enrich done: ok=${ok} withPhoto=${withPhoto} fail=${fail}`);
  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
