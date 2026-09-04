/**
 * Pull public actor catalogs from every agency in data/agency-sources.json.
 * Listing pages only: name, photo, profile URL, agency. No invented bios.
 *
 *   npx tsx scripts/scrape-listings.ts --dry-run
 *   npx tsx scripts/scrape-listings.ts --host 1choice.ru
 *   npm run db:scrape-listings
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { agencies, people } from "../src/db/schema";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

config({ path: ".env.local" });
config({ path: ".env" });

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = resolve(webRoot, "data/agency-sources.json");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const SKIP_NAME_PART = [
  "актер",
  "актёр",
  "актрис",
  "агентств",
  "команда",
  "каталог",
  "контакт",
  "главная",
  "новост",
  "кастинг",
  "подробнее",
  "смотреть",
  "портфолио",
  "менеджер",
  "руководител",
  "директор",
  "продюсер",
  "москва",
  "петербург",
  "instagram",
  "telegram",
  "whatsapp",
  "youtube",
  "vkontakte",
  "copyright",
  "cookie",
  "политика",
  "оферта",
  "вакансии",
  "услуги",
  "стоимость",
  "прайс",
  "проект",
  "заявк",
  "резюме",
  "прокрутить",
  "счетчик",
  "шахмат",
  "конфиденц",
  "театр",
  "терапи",
  "вокал",
  "коллектив",
  "партнер",
  "рассылк",
  "анкету",
];

const CATALOG_TEXT =
  /^(актёры|актеры|актрисы|каталог|наши актёры|наши актеры|наши актрисы|все актёры|все актеры|артисты|таланты|лица|база)$/i;

const LISTING_LAST =
  /^(actors?|actresses|actress|aktery|aktrisy|akteri|akter|katalog|catalog|catalogue|talents?|artists?|portfolio|faces|all|all_actors|all-actors|nashi-aktery|nashi-akteri|team|sotrudniki|men|women|male|female)$/;

const EXTRA_PATHS = [
  "/actors",
  "/actresses",
  "/actor",
  "/actress",
  "/actor.html",
  "/actress.html",
  "/actors.html",
  "/aktery",
  "/aktrisy",
  "/katalog",
  "/catalog",
  "/all",
  "/all_actors",
];

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

type SourceAgency = { host: string; url: string; status: string };
type SourcesFile = { imported: string[]; agencies: SourceAgency[] };

type Card = {
  name: string;
  url: string;
  imageUrl: string | null;
  profession: "actor" | "actress";
};

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pool<T, R>(items: T[], n: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
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
    .replace(/&laquo;|&raquo;|&ldquo;|&rdquo;/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(html: string) {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function toTitleRu(s: string) {
  const trimmed = s.replace(/\s+/g, " ").trim();
  if (!trimmed) return trimmed;
  const isUpper = trimmed === trimmed.toUpperCase() && /[А-ЯЁA-Z]/.test(trimmed);
  const base = isUpper ? trimmed.toLowerCase() : trimmed;
  return base.replace(/(^|[\s-])([а-яёa-z])/g, (_, a, b) => a + b.toUpperCase());
}

function looksLikeName(raw: string): string | null {
  let s = stripTags(raw);
  s = s.replace(/[«»""]/g, "").replace(/[.,;:!?…|/\\]+$/g, "").trim();
  if (s.length < 5 || s.length > 64) return null;
  if (/\d|[@_]|https?:/i.test(s)) return null;
  const titled = toTitleRu(s);
  const words = titled.split(/\s+/);
  if (words.length < 2 || words.length > 4) return null;
  const wordRe = /^[А-ЯЁA-Z][а-яёa-z'-]{2,24}$/;
  if (!words.every((w) => wordRe.test(w))) return null;
  if (!/[а-яё]/i.test(titled)) return null;
  const lower = titled.toLowerCase();
  if (SKIP_NAME_PART.some((p) => lower.includes(p))) return null;
  const stop = new Set(["наш", "наша", "наши", "все", "как", "для", "на", "по", "из", "от", "до", "со", "об", "или", "при"]);
  if (words.some((w) => stop.has(w.toLowerCase()))) return null;
  return titled;
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

function translit(name: string) {
  return name
    .toLowerCase()
    .replace(/ё/g, "е")
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function agencyIdFromHost(host: string) {
  let h = host.replace(/^www\./i, "").toLowerCase();
  h = h.replace(/\.tilda\.ws$/, "");
  h = h.replace(/\.(ru|com|su|tv|pro|art|org|net|info|ws|tj)$/i, "");
  h = h.replace(/^(www|casting|www2)\./, "");
  const id = h.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return id.slice(0, 40) || "agency";
}

function originOf(url: string) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url;
  }
}

function absUrl(href: string, base: string): string | null {
  const raw = decodeHtml(href).trim();
  if (!raw || raw.startsWith("javascript:") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return null;
  if (raw.startsWith("#")) return base;
  try {
    return new URL(raw, base).href;
  } catch {
    return null;
  }
}

function sameHost(a: string, b: string) {
  try {
    const ha = new URL(a).hostname.replace(/^www\./, "");
    const hb = new URL(b).hostname.replace(/^www\./, "");
    return ha === hb;
  } catch {
    return false;
  }
}

function isJunkUrl(url: string) {
  return /(?:instagram|facebook|vk\.com|youtube|t\.me|wa\.me|twitter|ok\.ru|tiktok|pinterest|linkedin|tilda\.cc|reg\.ru|favicon|mailto:|\.pdf($|\?)|\.css($|\?)|\.js($|\?))/i.test(
    url,
  );
}

function isJunkImage(url: string) {
  return /(?:logo|favicon|sprite|icon|pixel|1x1|spacer|blank|button|svg\+xml|whatsapp|telegram|instagram|facebook|vk\.com|tilda\.cc\/img)/i.test(
    url,
  );
}

function parseAttrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([:\w-]+)\s*=\s*(["'])([\s\S]*?)\2/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) out[m[1].toLowerCase()] = m[3];
  return out;
}

function pickImage(tag: string, base: string): string | null {
  const a = parseAttrs(tag);
  const srcset = a.srcset || a["data-srcset"];
  let raw =
    a["data-original"] ||
    a["data-src"] ||
    a["data-lazy-src"] ||
    a["data-lazy"] ||
    a["data-bg"] ||
    a.src ||
    "";
  if (!raw && srcset) {
    raw = srcset.split(",").pop()?.trim().split(/\s+/)[0] || "";
  }
  if (!raw || raw.startsWith("data:")) return null;
  raw = raw.replace(/\/-\/resize\/\d+x[^/]*\//, "/");
  const url = absUrl(raw, base);
  if (!url || isJunkImage(url)) return null;
  if (!/\.(jpe?g|png|webp|avif|gif|bmp)(\?|$)/i.test(url) && !/tildacdn|ucarecdn|cloudinary|wp-content\/uploads|media\/zoo/i.test(url)) {
    return null;
  }
  return url;
}

function guessProfession(name: string, html: string, href: string, pageUrl: string): "actor" | "actress" {
  const blob = `${href} ${pageUrl}`.toLowerCase();
  if (/actress|aktris|актрис/.test(blob) && !/\/actor\//.test(blob)) return "actress";
  if (/\/actors?\b|\/aktery|\/actor\//.test(blob) && !/actress|aktris/.test(blob)) return "actor";
  const first = name.split(/\s+/)[0]?.toLowerCase() || "";
  if (FEMALE_FIRST.has(first)) return "actress";
  if (MALE_FIRST.has(first)) return "actor";
  if (/актриса/i.test(html.slice(0, 2500))) return "actress";
  if (/[ая]$/i.test(first) && !/илья|никита|кузьма|фома|илья/.test(first)) return "actress";
  return "actor";
}

function decodeBody(buf: Buffer, contentType: string): string {
  const head = buf.toString("latin1").slice(0, 2500);
  const headerCs = contentType.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase();
  const metaCs = head.match(/charset=["']?([\w-]+)/i)?.[1]?.toLowerCase();
  let cs = (headerCs || metaCs || "utf-8")
    .replace("cp1251", "windows-1251")
    .replace("cp-1251", "windows-1251")
    .replace("utf8", "utf-8");
  try {
    return new TextDecoder(cs).decode(buf);
  } catch {
    return buf.toString("utf8");
  }
}

type Fetched = { url: string; html: string; status: number };

async function fetchPage(url: string): Promise<Fetched | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "ru,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/json,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 6_000_000) return null;
    const html = decodeBody(buf, res.headers.get("content-type") || "");
    return { url: res.url, html, status: res.status };
  } catch {
    return null;
  }
}

function nearestImage(html: string, index: number, base: string): string | null {
  const from = Math.max(0, index - 2800);
  const window = html.slice(from, index);
  const tags = [...window.matchAll(/<img\b[^>]*>/gi)];
  for (let i = tags.length - 1; i >= 0; i--) {
    const src = pickImage(tags[i][0], base);
    if (src) return src;
  }
  return null;
}

function extractCards(html: string, pageUrl: string): Card[] {
  const byKey = new Map<string, Card>();

  const add = (card: Card) => {
    const key = card.name.toLowerCase();
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, card);
      return;
    }
    if (!prev.imageUrl && card.imageUrl) prev.imageUrl = card.imageUrl;
    if (prev.url === pageUrl && card.url !== pageUrl) prev.url = card.url;
  };

  const aRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = aRe.exec(html))) {
    const attrs = parseAttrs(`<a ${m[1]}>`);
    const name = looksLikeName(m[2]);
    if (!name) continue;
    const href = absUrl(attrs.href || "", pageUrl);
    if (!href || isJunkUrl(href)) continue;
    if (!sameHost(href, pageUrl) && !/tildacdn/.test(href)) continue;
    add({
      name,
      url: href,
      imageUrl: nearestImage(html, m.index, pageUrl) || pickImage(`<img ${m[1]}>`, pageUrl),
      profession: guessProfession(name, html, href, pageUrl),
    });
  }

  const imgRe = /<img\b[^>]*>/gi;
  while ((m = imgRe.exec(html))) {
    const attrs = parseAttrs(m[0]);
    const name = looksLikeName(attrs.alt || "") || looksLikeName(attrs.title || "");
    if (!name) continue;
    const src = pickImage(m[0], pageUrl);
    const around = html.slice(Math.max(0, m.index - 400), m.index + m[0].length + 400);
    const hrefMatch = around.match(/<a\b[^>]*href=["']([^"']+)["']/i);
    const href = hrefMatch ? absUrl(hrefMatch[1], pageUrl) : pageUrl;
    if (!href || isJunkUrl(href)) continue;
    add({
      name,
      url: href,
      imageUrl: src,
      profession: guessProfession(name, html, href, pageUrl),
    });
  }

  return [...byKey.values()];
}

function isListingPath(href: string, text: string) {
  let path = "";
  try {
    path = new URL(href).pathname.toLowerCase();
  } catch {
    return false;
  }
  if (/\.(css|js|png|jpe?g|webp|gif|svg|woff2?|ico|xml|pdf)(\?|$)/i.test(path)) return false;
  if (/\/item\/|\/profile\/|\/person\/|\/people\//i.test(path)) return false;
  const parts = path.split("/").filter(Boolean);
  if (parts.length > 3) return false;
  const last = (parts[parts.length - 1] || "").replace(/\.html?$/, "");
  if (LISTING_LAST.test(last)) return true;
  if (parts.length <= 2 && CATALOG_TEXT.test(text.trim())) return true;
  return false;
}

function catalogLinks(html: string, pageUrl: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = absUrl(m[1], pageUrl);
    if (!href || !sameHost(href, pageUrl) || isJunkUrl(href)) continue;
    const text = stripTags(m[2]);
    if (!isListingPath(href, text)) continue;
    const key = href.replace(/#.*$/, "").replace(/\/+$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(href);
    if (out.length >= 8) break;
  }
  return out;
}

function nextPageUrls(html: string, pageUrl: string): string[] {
  const out: string[] = [];
  const rel = html.match(/<a[^>]+rel=["']next["'][^>]*href=["']([^"']+)["']/i);
  if (rel) {
    const u = absUrl(rel[1], pageUrl);
    if (u) out.push(u);
  }
  const candidates = [
    ...html.matchAll(/href=["']([^"']*(?:page\/\d+|page=\d+|pagen_\d+=\d+|start=\d+|offset=\d+)[^"']*)["']/gi),
  ];
  for (const c of candidates.slice(0, 8)) {
    const u = absUrl(c[1], pageUrl);
    if (u && sameHost(u, pageUrl)) out.push(u);
  }
  return out;
}

function cityFromHtml(html: string): string | null {
  const text = stripTags(html).slice(0, 4000);
  if (/санкт[-\s]?петербург|\bспб\b/i.test(text)) return "СПб";
  if (/москв/i.test(text)) return "Москва";
  return null;
}

function siteName(html: string, host: string) {
  const og = html.match(/property=["']og:site_name["'][^>]*content=["']([^"']+)/i)?.[1];
  if (og) return decodeHtml(og).trim();
  const title = html.match(/<title[^>]*>([^<]+)/i)?.[1];
  if (title) {
    const t = decodeHtml(title).split(/[·|—–-]/)[0].trim();
    if (t && t.length < 80) return t;
  }
  return host.replace(/^www\./, "");
}

async function scrapeWp(origin: string, pageUrl: string): Promise<Card[]> {
  const typesRes = await fetchPage(`${origin}/wp-json/wp/v2/types`);
  if (!typesRes || typesRes.status !== 200) return [];
  let types: Record<string, { slug?: string }> = {};
  try {
    types = JSON.parse(typesRes.html);
  } catch {
    return [];
  }
  const keys = Object.keys(types).filter((k) =>
    /actor|actress|artist|talent|team|person|people|portfolio|sotrud|akter|aktr|model|nashi/i.test(k),
  );
  if (!keys.length) return [];
  const cards: Card[] = [];
  for (const key of keys.slice(0, 4)) {
    for (let page = 1; page <= 15; page++) {
      const url = `${origin}/wp-json/wp/v2/${encodeURIComponent(key)}?per_page=100&page=${page}&_embed=1`;
      const res = await fetchPage(url);
      if (!res || res.status !== 200) break;
      let rows: Array<Record<string, unknown>> = [];
      try {
        rows = JSON.parse(res.html);
      } catch {
        break;
      }
      if (!Array.isArray(rows) || !rows.length) break;
      for (const row of rows) {
        const name = looksLikeName(stripTags(String((row.title as { rendered?: string })?.rendered || row.title || "")));
        if (!name) continue;
        const link = String(row.link || pageUrl);
        const media = (row._embedded as { "wp:featuredmedia"?: Array<{ source_url?: string }> })?.[
          "wp:featuredmedia"
        ]?.[0]?.source_url;
        cards.push({
          name,
          url: link,
          imageUrl: media || null,
          profession: guessProfession(name, "", link, pageUrl),
        });
      }
      if (rows.length < 100) break;
      await sleep(200);
    }
  }
  return cards;
}

async function scrapeTildaStore(html: string, pageUrl: string): Promise<Card[]> {
  const uid =
    html.match(/data-store-part-uid=["']([^"']+)/i)?.[1] ||
    html.match(/storepartuid=([a-z0-9-]+)/i)?.[1] ||
    html.match(/["']storepartuid["']\s*:\s*["']([^"']+)/i)?.[1];
  const recid = html.match(/id=["']rec(\d+)["'][^>]*t-store/i)?.[1];
  if (!uid) return [];
  const api = `https://store.tildacdn.com/api/getproductslist/?storepartuid=${encodeURIComponent(uid)}${recid ? `&recid=${recid}` : ""}&c=${Date.now()}&getparts=true`;
  const res = await fetchPage(api);
  if (!res || res.status !== 200) return [];
  try {
    const data = JSON.parse(res.html) as { products?: Array<{ title?: string; url?: string; photo?: string; editions?: Array<{ img?: string }> }> };
    const products = data.products || [];
    const cards: Card[] = [];
    for (const p of products) {
      const name = looksLikeName(p.title || "");
      if (!name) continue;
      const img = p.photo || p.editions?.[0]?.img || null;
      cards.push({
        name,
        url: p.url ? absUrl(p.url, pageUrl) || pageUrl : pageUrl,
        imageUrl: img,
        profession: guessProfession(name, html, p.url || "", pageUrl),
      });
    }
    return cards;
  } catch {
    return [];
  }
}

function mergeCards(groups: Card[][]): Card[] {
  const byKey = new Map<string, Card>();
  for (const group of groups) {
    for (const card of group) {
      const key = card.name.toLowerCase();
      const prev = byKey.get(key);
      if (!prev) byKey.set(key, { ...card });
      else if (!prev.imageUrl && card.imageUrl) prev.imageUrl = card.imageUrl;
    }
  }
  return [...byKey.values()];
}

type SiteResult = {
  host: string;
  agencyId: string;
  agencyName: string;
  website: string;
  city: string | null;
  cards: Card[];
  pages: number;
  error?: string;
};

async function scrapeAgency(src: SourceAgency): Promise<SiteResult> {
  const start = src.url.trim();
  const origin = originOf(start);
  const host = src.host;
  const agencyId = agencyIdFromHost(host);
  const visited = new Set<string>();
  const groups: Card[][] = [];
  let pages = 0;
  let homeHtml = "";
  let agencyName = host.replace(/^www\./, "");
  let city: string | null = null;

  const queue: string[] = [start];
  const originUrl = origin.endsWith("/") ? origin : `${origin}/`;
  if (originUrl !== start && originUrl !== `${start}/`) queue.push(originUrl);
  for (const path of EXTRA_PATHS) queue.push(`${origin}${path}`);

  const enqueue = (url: string) => {
    const key = url.replace(/#.*$/, "").replace(/\/+$/, "") || url;
    if (visited.has(key) || visited.size + queue.length > 22) return;
    queue.push(url);
  };

  while (queue.length) {
    const url = queue.shift()!;
    const key = url.replace(/#.*$/, "").replace(/\/+$/, "") || url;
    if (visited.has(key)) continue;
    visited.add(key);
    const fetched = await fetchPage(url);
    pages += 1;
    if (!fetched || fetched.status >= 400) continue;
    if (!homeHtml) {
      homeHtml = fetched.html;
      agencyName = siteName(fetched.html, host);
      city = cityFromHtml(fetched.html);
    }
    groups.push(extractCards(fetched.html, fetched.url));
    if (/t-store|storepartuid|js-store/i.test(fetched.html)) {
      const store = await scrapeTildaStore(fetched.html, fetched.url);
      if (store.length) groups.push(store);
    }

    for (const link of catalogLinks(fetched.html, fetched.url)) enqueue(link);
    for (const next of nextPageUrls(fetched.html, fetched.url)) enqueue(next);
    await sleep(80);
  }

  const found = mergeCards(groups);
  if (found.length < 20) {
    const wp = await scrapeWp(origin, start);
    if (wp.length) groups.push(wp);
  }

  const cards = mergeCards(groups).filter((c) => c.name);
  return { host, agencyId, agencyName, website: origin, city, cards, pages };
}

async function main() {
  const dry = hasFlag("dry-run");
  const onlyHost = arg("host")?.replace(/^www\./, "");
  const concurrency = Number(arg("concurrency", "5"));
  const raw = JSON.parse(readFileSync(SOURCES, "utf8")) as SourcesFile;
  let list = raw.agencies;
  if (onlyHost) {
    list = list.filter((a) => a.host.replace(/^www\./, "") === onlyHost || a.host.includes(onlyHost));
    if (!list.length) throw new Error(`host not found: ${onlyHost}`);
  } else if (!hasFlag("include-imported")) {
    list = list.filter((a) => a.status !== "imported");
  }

  console.log(`agencies: ${list.length} dry=${dry} concurrency=${concurrency}`);

  const results = await pool(list, concurrency, async (src) => {
    try {
      const r = await scrapeAgency(src);
      console.log(
        `  ${r.host.padEnd(28)} cards=${String(r.cards.length).padStart(4)} pages=${r.pages}  ${r.cards
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ")}`,
      );
      return r;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL ${src.host}: ${message}`);
      return {
        host: src.host,
        agencyId: agencyIdFromHost(src.host),
        agencyName: src.host,
        website: src.url,
        city: null,
        cards: [],
        pages: 0,
        error: message,
      } satisfies SiteResult;
    }
  });

  const withCards = results.filter((r) => r.cards.length);
  const totalCards = results.reduce((n, r) => n + r.cards.length, 0);
  const empty = results.filter((r) => !r.cards.length);
  console.log(`\nlisted ${totalCards} people from ${withCards.length}/${results.length} agencies`);
  if (empty.length) {
    console.log(`empty (${empty.length}): ${empty.map((e) => e.host).join(", ")}`);
  }

  const report = {
    at: new Date().toISOString(),
    totalCards,
    agenciesWithCards: withCards.length,
    empty: empty.map((e) => e.host),
    byHost: results.map((r) => ({ host: r.host, n: r.cards.length, pages: r.pages, error: r.error })),
  };
  writeFileSync(resolve(webRoot, "data/scrape-listings-report.json"), JSON.stringify(report, null, 2));

  if (dry) {
    console.log("dry-run: db not written");
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  let inserted = 0;
  let skipped = 0;

  for (const site of results) {
    if (!site.cards.length) continue;
    await db
      .insert(agencies)
      .values({ id: site.agencyId, name: site.agencyName, website: site.website })
      .onConflictDoUpdate({
        target: agencies.id,
        set: { name: site.agencyName, website: site.website },
      });

    const rows = site.cards.map((card) => {
      const base = translit(card.name) || "actor";
      const slug = site.agencyId === "akter1" ? base : `${site.agencyId}-${base}`.slice(0, 80);
      return {
        slug,
        name: card.name,
        role: card.profession === "actress" ? "Актриса" : "Актёр",
        profession: card.profession,
        city: site.city,
        bio: null as string | null,
        imageUrl: card.imageUrl,
        coverUrl: null as string | null,
        verified: true,
        sourceUrl: card.url,
        birthDate: null as string | null,
        agencyId: site.agencyId,
        agentId: null as string | null,
        hint: site.agencyName,
        initials: initialsOf(card.name),
        bg: null as string | null,
        card: null,
      };
    });

    const chunk = 80;
    for (let i = 0; i < rows.length; i += chunk) {
      const part = rows.slice(i, i + chunk);
      const result = await db.insert(people).values(part).onConflictDoNothing().returning({ slug: people.slug });
      inserted += result.length;
      skipped += part.length - result.length;
    }

    const src = raw.agencies.find((a) => a.host === site.host);
    if (src) src.status = "imported";
    if (!raw.imported.includes(site.host)) raw.imported.push(site.host);
  }

  writeFileSync(SOURCES, JSON.stringify(raw, null, 2) + "\n");
  console.log(`db: inserted=${inserted} skipped_existing=${skipped}`);
  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
