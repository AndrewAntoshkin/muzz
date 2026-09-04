/**
 * Pull public Kinolift catalog via JSON-RPC and merge onto existing people.
 *
 *   npm run db:scrape-kinolift
 *   npx tsx scripts/scrape-kinolift.ts --match-only
 *   npx tsx scripts/scrape-kinolift.ts --deep-new --concurrency 4
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { agencies, people, personLinks, personPhotos } from "../src/db/schema";
import type { Credit, KvPair, PersonCard } from "../src/lib/person-card";
import { isAllowedGeo } from "../src/lib/geo-allowed";

config({ path: ".env.local" });
config({ path: ".env" });

const RPC = "https://kinolift.com/ru/api/";
const PHOTO = "https://kinolift.com/media/users";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const ENUM_RU: Record<string, string> = {
  lightBrown: "русый",
  blond: "блондин",
  brunette: "брюнет",
  shaten: "шатен",
  red: "рыжий",
  greyhair: "седой",
  bald: "отсутствуют",
  hazel: "карие",
  green: "зеленые",
  blue: "синие",
  grey: "серые",
  european: "европейский",
  slavic: "славянский",
  caucasian: "кавказский",
  asian: "азиатский",
  african: "африканский",
  jewish: "еврейский",
  latino: "латино",
  indian: "индийский",
  arabic: "арабский",
  metis: "метис",
  mulat: "мулат",
  other: "другой",
  fit: "стройное",
  athletic: "атлетичное",
  average: "среднее",
  skinny: "худое",
  chubby: "полное",
  built: "бодибилдер",
  overweight: "лишний вес",
  short: "короткие",
  long: "длинные",
  middle: "средние",
  bariton: "баритон",
  bass: "бас",
  tenor: "тенор",
  soprano: "сопрано",
  "mezzo-soprano": "меццо-сопрано",
  contralto: "контральто",
  advanced: "родной",
  intermediate: "свободно",
  basic: "со словарём",
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

type ListActor = {
  userId: number;
  mainPhoto: number | null;
  card: {
    firstName?: string;
    lastName?: string;
    pubName?: string;
    height?: number;
    roles?: { year?: number; title?: string }[];
    rolesTotal?: number;
    education?: { title?: string; yearStart?: number; yearEnd?: number } | null;
    skills?: string[];
  };
  age?: number;
  geo?: { city?: string; country?: string };
  status?: string;
};

type KlProfile = {
  userId: number;
  userType?: string;
  overview?: {
    gender?: string;
    lastName?: string;
    firstName?: string;
    birthDay?: number;
    birthMonth?: number;
    birthYear?: number;
    geo?: { city?: string };
  };
  educationAndSkills?: {
    education?: { main?: { title?: string; yearStart?: number; yearEnd?: number }[] };
    languages?: { common?: { name?: string; level?: string | null; selected?: boolean }[] };
    voiceType?: string;
    skills?: Record<string, unknown>;
  };
  appearance?: {
    height?: number;
    weight?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    sizeCode?: string;
    bodyType?: string;
    hairColor?: string;
    hairLength?: string;
    eyeColor?: string;
    ethnicity?: string;
  };
  media?: {
    photos?: { main?: number; album?: { id: number; ext?: string }[] };
    video?: { reel?: { url?: string; thumb?: string; title?: string } };
  };
  rolesAndAwards?: {
    roles?: Record<string, { groupName?: string; items?: RoleItem[] }>;
  };
  contact?: { links?: { instagram?: string | null; vk?: string | null; youtube?: string | null } };
  card?: { pubName?: string; bio?: string | null };
};

type RoleItem = {
  year?: number;
  title?: string;
  role?: string;
  director?: string | null;
  projectType?: string;
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

function ru(key: string | null | undefined) {
  if (!key) return null;
  return ENUM_RU[key] || key;
}

function coreTokens(name: string) {
  return name
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1 && !/(вич|вна|чна|ична)$/.test(t));
}

function nameKey(name: string) {
  return coreTokens(name).sort().join(" ");
}

function displayName(item: ListActor) {
  return item.card.pubName || [item.card.lastName, item.card.firstName].filter(Boolean).join(" ") || `id ${item.userId}`;
}

function guessProfession(name: string, gender?: string): { profession: "actor" | "actress"; role: string } {
  if (gender === "female") return { profession: "actress", role: "Актриса" };
  if (gender === "male") return { profession: "actor", role: "Актёр" };
  const first = name.split(/\s+/).find((w) => FEMALE_FIRST.has(w.toLowerCase()) || MALE_FIRST.has(w.toLowerCase()));
  const low = (first || name.split(/\s+/)[0] || "").toLowerCase();
  if (FEMALE_FIRST.has(low)) return { profession: "actress", role: "Актриса" };
  return { profession: "actor", role: "Актёр" };
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

function photoUrl(userId: number, photoId: number, size: "l" | "s" = "l") {
  return `${PHOTO}/${userId}/${photoId}_${size}.jpg`;
}

function kv(label: string, value: string | number | null | undefined): KvPair | null {
  if (value == null || value === "") return null;
  return { label, value: String(value) };
}

function listCard(item: ListActor): PersonCard {
  const params: KvPair[] = [];
  if (item.card.height) params.push({ label: "Рост", value: `${item.card.height} см` });
  const edu = item.card.education;
  const education = edu?.title
    ? [edu.title, edu.yearStart && edu.yearEnd ? `${edu.yearStart}–${edu.yearEnd}` : null].filter(Boolean).join(", ")
    : undefined;
  if (education) params.push({ label: "Образование", value: education });
  if (item.geo?.city) params.push({ label: "Город", value: item.geo.city });
  const credits: Credit[] = (item.card.roles || [])
    .filter((r) => r.title)
    .map((r) => ({
      year: r.year ? String(r.year) : undefined,
      title: r.title!.startsWith("«") ? r.title! : `«${r.title}»`,
    }));
  const skills = (item.card.skills || []).map((s) => s.trim()).filter(Boolean).slice(0, 24);
  return {
    height: item.card.height ? `${item.card.height} см` : undefined,
    education,
    params: params.length ? params : undefined,
    skills: skills.length ? skills : undefined,
    credits: credits.length ? credits : undefined,
  };
}

function collectSkills(profile: KlProfile): string[] {
  const out: string[] = [];
  const skills = profile.educationAndSkills?.skills;
  if (!skills || typeof skills !== "object") return out;
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const rec = node as Record<string, unknown>;
    if (Array.isArray(rec.items)) {
      for (const it of rec.items as { name?: string; selected?: boolean }[]) {
        if (it.selected && it.name) out.push(it.name);
      }
    }
    if (Array.isArray(rec.extra)) {
      for (const it of rec.extra as { name?: string }[]) {
        if (it.name) out.push(it.name);
      }
    }
    for (const v of Object.values(rec)) {
      if (v && typeof v === "object" && ("items" in (v as object) || "extra" in (v as object))) walk(v);
    }
  };
  walk(skills);
  return [...new Set(out.map((s) => s.trim()).filter(Boolean))].slice(0, 30);
}

function profileToCard(p: KlProfile): PersonCard {
  const a = p.appearance || {};
  const params: KvPair[] = [];
  const appearance: KvPair[] = [];
  const height = a.height ? `${a.height} см` : undefined;
  if (height) params.push({ label: "Рост", value: height });
  if (a.weight) params.push({ label: "Вес", value: `${a.weight} кг` });
  if (a.sizeCode) params.push({ label: "Одежда", value: a.sizeCode });
  if (a.chest) params.push({ label: "Грудь", value: String(a.chest) });
  if (a.waist) params.push({ label: "Талия", value: String(a.waist) });
  if (a.hips) params.push({ label: "Бёдра", value: String(a.hips) });
  const eduRows = p.educationAndSkills?.education?.main || [];
  const education = eduRows
    .map((e) => [e.title, e.yearStart && e.yearEnd ? `${e.yearStart}–${e.yearEnd}` : null].filter(Boolean).join(", "))
    .filter(Boolean)
    .join("; ");
  if (education) params.push({ label: "Образование", value: education });
  if (p.overview?.geo?.city) params.push({ label: "Город", value: p.overview.geo.city });
  const hair = ru(a.hairColor);
  const hairLen = ru(a.hairLength);
  const eyes = ru(a.eyeColor);
  const look = ru(a.ethnicity);
  const body = ru(a.bodyType);
  if (hair) appearance.push({ label: "Волосы", value: hairLen ? `${hair}, ${hairLen}` : hair });
  if (eyes) appearance.push({ label: "Глаза", value: eyes });
  if (look) appearance.push({ label: "Тип внешности", value: look });
  if (body) appearance.push({ label: "Телосложение", value: body });
  const voice = ru(p.educationAndSkills?.voiceType);
  if (voice) appearance.push({ label: "Голос", value: voice });

  const languages: KvPair[] = (p.educationAndSkills?.languages?.common || [])
    .filter((l) => l.selected && l.name)
    .map((l) => ({ label: l.name!, value: ru(l.level) || "есть" }));

  const credits: Credit[] = [];
  const groups = p.rolesAndAwards?.roles || {};
  for (const g of Object.values(groups)) {
    const kind = g.groupName || undefined;
    for (const item of g.items || []) {
      if (!item.title) continue;
      const meta = [item.director ? `реж. ${item.director}` : null].filter(Boolean).join(" · ");
      credits.push({
        year: item.year ? String(item.year) : undefined,
        title: item.title.startsWith("«") ? item.title : `«${item.title}»`,
        credit: item.role || undefined,
        meta: meta || undefined,
        kind,
      });
    }
  }

  const reel = p.media?.video?.reel;
  const instagram = p.contact?.links?.instagram || undefined;
  const skills = collectSkills(p);

  return {
    height,
    education: education || undefined,
    instagram: instagram || undefined,
    params: params.length ? params : undefined,
    appearance: appearance.length ? appearance : undefined,
    languages: languages.length ? languages : undefined,
    skills: skills.length ? skills : undefined,
    credits: credits.length ? credits : undefined,
    showreel: reel?.url
      ? { poster: reel.thumb || "", title: reel.title || "Шоурил", href: reel.url }
      : undefined,
  };
}

function mergeCards(base: PersonCard | null | undefined, extra: PersonCard): PersonCard {
  const pick = <T,>(a: T[] | undefined, b: T[] | undefined) => ((b?.length || 0) >= (a?.length || 0) ? b : a);
  const byLabel = (a?: KvPair[], b?: KvPair[]) => {
    const map = new Map<string, KvPair>();
    for (const row of a || []) map.set(row.label, row);
    for (const row of b || []) map.set(row.label, row);
    return map.size ? [...map.values()] : undefined;
  };
  return {
    ...(base || {}),
    ...extra,
    height: extra.height || base?.height,
    education: extra.education || base?.education,
    instagram: extra.instagram || base?.instagram,
    params: byLabel(base?.params, extra.params),
    appearance: byLabel(base?.appearance, extra.appearance),
    languages: pick(base?.languages, extra.languages),
    skills: (() => {
      const all = [...new Set([...(base?.skills || []), ...(extra.skills || [])])].slice(0, 30);
      return all.length ? all : undefined;
    })(),
    credits: pick(base?.credits, extra.credits),
    showreel: extra.showreel || base?.showreel,
  };
}

function birthIso(p: KlProfile): string | null {
  const y = p.overview?.birthYear;
  const m = p.overview?.birthMonth;
  const d = p.overview?.birthDay;
  if (!y || y < 1920 || y > 2020) return null;
  const month = typeof m === "number" ? m + 1 : 1;
  const day = d || 1;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function photosOf(p: KlProfile, fallback?: ListActor): string[] {
  const uid = p.userId;
  const ids: number[] = [];
  if (p.media?.photos?.main) ids.push(p.media.photos.main);
  for (const ph of p.media?.photos?.album || []) {
    if (ph.id && !ids.includes(ph.id)) ids.push(ph.id);
  }
  if (!ids.length && fallback?.mainPhoto) ids.push(fallback.mainPhoto);
  return ids.slice(0, 16).map((id) => photoUrl(uid, id, "l"));
}

async function rpc<T>(method: string, params: unknown, retries = 3, timeoutMs = 20000): Promise<T> {
  let last = "rpc failed";
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: "https://kinolift.com",
          Referer: "https://kinolift.com/ru/",
          "User-Agent": UA,
        },
        body: JSON.stringify({ jsonrpc: "2.0", method, params, id: String(Date.now()) }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const data = (await res.json()) as { result?: T; error?: { message?: string } };
      if (data.error) throw new Error(data.error.message || "rpc error");
      if (data.result === undefined) throw new Error("empty rpc result");
      return data.result;
    } catch (err) {
      last = err instanceof Error ? err.message : String(err);
      await sleep(400 * (i + 1));
    }
  }
  throw new Error(last);
}

async function listAll(limit = 25000) {
  return rpc<{ list: ListActor[]; total: number }>(
    "listActors",
    {
      type: "search",
      order: "approved",
      offset: 0,
      limit,
      filters: {},
      text: "",
    },
    3,
    120000,
  );
}

async function getProfile(userId: number) {
  return rpc<KlProfile>("getProfile", { userId });
}

async function upsertPhotos(
  db: ReturnType<typeof drizzle>,
  slug: string,
  urls: string[],
  prefix: string,
) {
  if (!urls.length) return;
  const existing = await db.select().from(personPhotos).where(eq(personPhotos.personSlug, slug));
  const have = new Set(existing.map((p) => p.url));
  const add = urls.filter((u) => !have.has(u));
  if (!add.length) return;
  const start = existing.length;
  await db
    .insert(personPhotos)
    .values(
      add.map((url, i) => ({
        id: `${slug}-${prefix}-${start + i}`,
        personSlug: slug,
        url,
        sort: start + i,
      })),
    )
    .onConflictDoNothing();
}

async function upsertLink(
  db: ReturnType<typeof drizzle>,
  slug: string,
  kind: string,
  url: string,
) {
  const existing = await db.select().from(personLinks).where(eq(personLinks.personSlug, slug));
  if (existing.some((l) => l.kind === kind && l.url === url)) return;
  await db
    .insert(personLinks)
    .values({
      id: `${slug}-${kind}`,
      personSlug: slug,
      kind,
      url,
    })
    .onConflictDoNothing();
}

function pickMatch<T extends { city?: string | null }>(locals: T[], remoteCity?: string | null): T | null {
  if (locals.length === 1) return locals[0];
  if (!locals.length) return null;
  const city = (remoteCity || "").toLowerCase();
  if (!city) return null;
  const hits = locals.filter((p) => (p.city || "").toLowerCase() === city);
  return hits.length === 1 ? hits[0] : null;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const matchOnly = hasFlag("match-only");
  const deepNew = hasFlag("deep-new");
  const deepOnly = hasFlag("deep-only");
  const concurrency = Number(arg("concurrency", "5"));
  const listLimit = Number(arg("list-limit", "25000"));

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  await db
    .insert(agencies)
    .values({ id: "kinolift", name: "Kinolift", website: "https://kinolift.com" })
    .onConflictDoUpdate({
      target: agencies.id,
      set: { name: "Kinolift", website: "https://kinolift.com" },
    });

  if (deepOnly) {
    const rows = await db
      .select({ slug: people.slug, card: people.card, imageUrl: people.imageUrl })
      .from(people)
      .where(eq(people.agencyId, "kinolift"));
    const thin = rows
      .filter((r) => {
        const n = (r.card as PersonCard | null)?.credits?.length || 0;
        return n < 8;
      })
      .slice(0, Number(arg("deep-limit", "20000")));
    console.log(`kinolift deep-only: ${thin.length}`);
    let nOk = 0;
    let nFail = 0;
    await pool(thin, concurrency, async (row) => {
      const userId = Number(row.slug.replace(/^kl-/, ""));
      if (!userId) {
        nFail += 1;
        return;
      }
      try {
        const profile = await getProfile(userId);
        const card = profileToCard(profile);
        const photos = photosOf(profile);
        const born = birthIso(profile);
        const name = profile.card?.pubName || [profile.overview?.lastName, profile.overview?.firstName].filter(Boolean).join(" ");
        const { profession, role } = guessProfession(name, profile.overview?.gender);
        await db
          .update(people)
          .set({
            card,
            bio: profile.card?.bio || undefined,
            birthDate: born || undefined,
            city: profile.overview?.geo?.city || undefined,
            imageUrl: photos[0] || row.imageUrl || undefined,
            profession,
            role,
          })
          .where(eq(people.slug, row.slug));
        await upsertPhotos(db, row.slug, photos, "p");
        nOk += 1;
      } catch {
        nFail += 1;
      }
      if ((nOk + nFail) % 100 === 0) console.log(`  deep-only ${nOk + nFail}/${thin.length} fail=${nFail}`);
      await sleep(40);
    });
    console.log(`kinolift deep-only done: ok=${nOk} fail=${nFail}`);
    await client.end({ timeout: 5 });
    return;
  }

  console.log("kinolift: listing catalog…");
  const listed = await listAll(listLimit);
  const catalog: ListActor[] = listed.list || [];
  console.log(`  total ${listed.total}, fetched ${catalog.length}`);

  const byId = new Map<number, ListActor>();
  for (const item of catalog) {
    if (item?.userId) byId.set(item.userId, item);
  }
  const uniqueAll = [...byId.values()];
  const unique = uniqueAll.filter((item) => isAllowedGeo(item.geo?.city, item.geo?.country));
  const skippedGeo = uniqueAll.length - unique.length;
  console.log(`kinolift: ${uniqueAll.length} unique approved actors (${skippedGeo} skipped — not RF/BY)`);

  const existing = await db
    .select({
      slug: people.slug,
      name: people.name,
      city: people.city,
      bio: people.bio,
      imageUrl: people.imageUrl,
      birthDate: people.birthDate,
      card: people.card,
      profession: people.profession,
      agencyId: people.agencyId,
    })
    .from(people);

  const byKey = new Map<string, typeof existing>();
  for (const row of existing) {
    const key = nameKey(row.name);
    if (!key) continue;
    const list = byKey.get(key) || [];
    list.push(row);
    byKey.set(key, list);
  }

  type Pair = { local: (typeof existing)[number]; remote: ListActor };
  const matches: Pair[] = [];
  const unmatched: ListActor[] = [];

  for (const remote of unique) {
    if (!isAllowedGeo(remote.geo?.city, remote.geo?.country)) continue;
    const key = nameKey(displayName(remote));
    const locals = (key && byKey.get(key)) || [];
    const local = pickMatch(locals, remote.geo?.city);
    if (local) matches.push({ local, remote });
    else unmatched.push(remote);
  }
  console.log(`  matches ${matches.length}, new ${unmatched.length}`);

  let deepOk = 0;
  let deepFail = 0;

  await pool(matches, concurrency, async ({ local, remote }) => {
    try {
      const profile = await getProfile(remote.userId);
      const extra = profileToCard(profile);
      const card = mergeCards(local.card, extra);
      const photos = photosOf(profile, remote);
      const born = birthIso(profile);
      const patch: Record<string, unknown> = { card };
      if (!local.imageUrl && photos[0]) patch.imageUrl = photos[0];
      if (!local.bio && profile.card?.bio) patch.bio = profile.card.bio;
      if (!local.birthDate && born) patch.birthDate = born;
      if (!local.city && profile.overview?.geo?.city) patch.city = profile.overview.geo.city;
      const gender = profile.overview?.gender;
      if (gender === "female" && local.profession === "actor") {
        patch.profession = "actress";
        patch.role = "Актриса";
      }
      if (gender === "male" && local.profession === "actress") {
        patch.profession = "actor";
        patch.role = "Актёр";
      }
      await db.update(people).set(patch).where(eq(people.slug, local.slug));
      await upsertPhotos(db, local.slug, photos, "kl");
      await upsertLink(db, local.slug, "kinolift", `https://kinolift.com/ru/${remote.userId}`);
      const ig = profile.contact?.links?.instagram;
      if (ig) await upsertLink(db, local.slug, "instagram", ig);
      deepOk += 1;
    } catch {
      const card = mergeCards(local.card, listCard(remote));
      await db.update(people).set({ card }).where(eq(people.slug, local.slug));
      if (remote.mainPhoto) {
        await upsertPhotos(db, local.slug, [photoUrl(remote.userId, remote.mainPhoto)], "kl");
      }
      await upsertLink(db, local.slug, "kinolift", `https://kinolift.com/ru/${remote.userId}`);
      deepFail += 1;
    }
    if ((deepOk + deepFail) % 50 === 0) {
      console.log(`  matched ${deepOk + deepFail}/${matches.length} fail=${deepFail}`);
    }
    await sleep(50);
  });
  console.log(`kinolift match done: ok=${deepOk} fallback=${deepFail}`);

  let inserted = 0;
  if (!matchOnly) {
    const rows = unmatched.map((item) => {
      const name = displayName(item);
      const { profession, role } = guessProfession(name);
      const card = listCard(item);
      const imageUrl = item.mainPhoto ? photoUrl(item.userId, item.mainPhoto) : null;
      return {
        slug: `kl-${item.userId}`,
        name,
        role,
        profession,
        city: item.geo?.city || null,
        bio: null as string | null,
        imageUrl,
        coverUrl: null as string | null,
        verified: item.status === "approved",
        sourceUrl: `https://kinolift.com/ru/${item.userId}`,
        birthDate: null as string | null,
        agencyId: "kinolift",
        agentId: null as string | null,
        hint: "Kinolift",
        initials: initialsOf(name),
        bg: null as string | null,
        card,
      };
    });

    const chunk = 80;
    for (let i = 0; i < rows.length; i += chunk) {
      const part = rows.slice(i, i + chunk);
      const result = await db.insert(people).values(part).onConflictDoNothing().returning({ slug: people.slug });
      inserted += result.length;
      const photoRows = part
        .filter((r) => r.imageUrl)
        .map((r) => ({
          id: `${r.slug}-0`,
          personSlug: r.slug,
          url: r.imageUrl as string,
          sort: 0,
        }));
      if (photoRows.length) {
        await db.insert(personPhotos).values(photoRows).onConflictDoNothing();
      }
      const links = part.map((r) => ({
        id: `${r.slug}-kinolift`,
        personSlug: r.slug,
        kind: "kinolift",
        url: r.sourceUrl!,
      }));
      if (links.length) await db.insert(personLinks).values(links).onConflictDoNothing();
      if (i % 800 === 0) console.log(`  inserted ${Math.min(i + chunk, rows.length)}/${rows.length}`);
    }
    console.log(`kinolift insert: ${inserted} new people`);
  }

  if (deepNew && !matchOnly) {
    const newcomers = unmatched.slice(0, Number(arg("deep-limit", String(unmatched.length))));
    console.log(`kinolift deep-new: ${newcomers.length}`);
    let nOk = 0;
    let nFail = 0;
    await pool(newcomers, concurrency, async (item) => {
      const slug = `kl-${item.userId}`;
      try {
        const profile = await getProfile(item.userId);
        const card = profileToCard(profile);
        const photos = photosOf(profile, item);
        const born = birthIso(profile);
        const { profession, role } = guessProfession(displayName(item), profile.overview?.gender);
        await db
          .update(people)
          .set({
            card,
            bio: profile.card?.bio || undefined,
            birthDate: born || undefined,
            city: profile.overview?.geo?.city || item.geo?.city || undefined,
            imageUrl: photos[0] || undefined,
            profession,
            role,
          })
          .where(eq(people.slug, slug));
        await upsertPhotos(db, slug, photos, "p");
        nOk += 1;
      } catch {
        nFail += 1;
      }
      if ((nOk + nFail) % 100 === 0) console.log(`  deep-new ${nOk + nFail}/${newcomers.length} fail=${nFail}`);
      await sleep(40);
    });
    console.log(`kinolift deep-new done: ok=${nOk} fail=${nFail}`);
  }

  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
