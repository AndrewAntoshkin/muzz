import { eq } from "drizzle-orm";
import { db } from "@/db";
import { asCard, kvValue, type Credit, type KvPair, type PersonCard, type Schedule, type Showreel } from "@/lib/person-card";
import type { ProfileLink, ProfilePatch, ProfilePhoto } from "@/lib/workspace";
import { badRequest } from "./http";
import { T, cleanJson, newId } from "./common";
import { optStr } from "./validate";
import type { Viewer } from "./viewer";

const URL_OK = (u: string) => u.startsWith("/") ? !u.startsWith("//") : /^https?:\/\//i.test(u);

function kvList(value: unknown, label: string): KvPair[] | undefined {
  if (value === undefined) return undefined;
  const clean = cleanJson(value);
  if (!Array.isArray(clean) || clean.length > 60) throw badRequest(`${label}: неверный формат`);
  return clean.map((row) => {
    const r = row as Record<string, unknown>;
    if (typeof r?.label !== "string" || typeof r?.value !== "string") throw badRequest(`${label}: неверный формат`);
    return { label: r.label.slice(0, 80), value: r.value.slice(0, 300) };
  });
}

/** Валидация патча профиля: только известные поля, никаких data:/javascript: ссылок. */
export function parsePatch(body: Record<string, unknown>): ProfilePatch {
  const patch: ProfilePatch = {};
  const bio = optStr(body.bio, { label: "О себе", max: 6000 });
  if (bio !== undefined) patch.bio = bio;
  const city = optStr(body.city, { label: "Город", max: 80 });
  if (city !== undefined) patch.city = city;
  const education = optStr(body.education, { label: "Образование", max: 600 });
  if (education !== undefined) patch.education = education;

  const params = kvList(body.params, "Параметры");
  if (params) patch.params = params;
  const appearance = kvList(body.appearance, "Внешность");
  if (appearance) patch.appearance = appearance;
  const languages = kvList(body.languages, "Языки");
  if (languages) patch.languages = languages;

  if (body.skills !== undefined) {
    const skills = cleanJson(body.skills);
    if (!Array.isArray(skills) || skills.length > 80 || skills.some((s) => typeof s !== "string")) throw badRequest("Навыки: неверный формат");
    patch.skills = (skills as string[]).map((s) => s.slice(0, 80));
  }
  if (body.credits !== undefined) {
    const credits = cleanJson(body.credits);
    if (!Array.isArray(credits) || credits.length > 200) throw badRequest("Фильмография: неверный формат");
    patch.credits = credits as Credit[];
  }
  if (body.showreel !== undefined) {
    const reel = cleanJson(body.showreel) as Showreel | null;
    if (reel && (typeof reel !== "object" || (reel.href && !URL_OK(reel.href)) || (reel.poster && !URL_OK(reel.poster)))) {
      throw badRequest("Шоурил: неверная ссылка");
    }
    patch.showreel = reel;
  }
  if (body.schedule !== undefined) patch.schedule = cleanJson(body.schedule) as Schedule | null;

  if (body.links !== undefined) {
    const links = cleanJson(body.links);
    if (!Array.isArray(links) || links.length > 30) throw badRequest("Ссылки: неверный формат");
    patch.links = (links as ProfileLink[]).map((l) => {
      if (typeof l?.url !== "string" || !/^https?:\/\//i.test(l.url)) throw badRequest("Ссылки: нужен адрес http(s)");
      return { id: String(l.id || newId("lnk")), kind: String(l.kind || "other").slice(0, 30), url: l.url.slice(0, 500) };
    });
  }
  if (body.photos !== undefined) {
    const photos = cleanJson(body.photos);
    if (!Array.isArray(photos) || photos.length > 40) throw badRequest("Фото: неверный формат");
    patch.photos = (photos as ProfilePhoto[]).map((p) => {
      if (typeof p?.url !== "string" || !URL_OK(p.url)) throw badRequest("Фото нужно загружать, а не вставлять как данные");
      return { id: String(p.id || newId("pho")), url: p.url };
    });
  }
  return patch;
}

/** Применить патч к людям из каталога (реальный пользователь правит только себя). */
async function materialize(slug: string, patch: ProfilePatch) {
  const [row] = await db.select().from(T.people).where(eq(T.people.slug, slug)).limit(1);
  if (!row) throw badRequest("Анкета не найдена");

  await db.transaction(async (tx) => {
    const card: PersonCard = { ...asCard(row.card) };
    if (patch.params) {
      card.params = patch.params;
      card.height = kvValue(patch.params, "Рост") || card.height;
    }
    if (patch.appearance) card.appearance = patch.appearance;
    if (patch.languages) card.languages = patch.languages;
    if (patch.skills) card.skills = patch.skills;
    if (patch.education !== undefined) card.education = patch.education;
    if (patch.credits) card.credits = patch.credits;
    if (patch.showreel !== undefined) card.showreel = patch.showreel ?? undefined;
    if (patch.schedule !== undefined) card.schedule = patch.schedule ?? undefined;

    const set: Partial<typeof T.people.$inferInsert> = { card };
    if (patch.bio !== undefined) set.bio = patch.bio;
    if (patch.city !== undefined) set.city = patch.city;
    if (patch.photos?.length && !row.imageUrl) set.imageUrl = patch.photos[0].url;
    await tx.update(T.people).set(set).where(eq(T.people.slug, slug));

    if (patch.links) {
      await tx.delete(T.personLinks).where(eq(T.personLinks.personSlug, slug));
      if (patch.links.length) {
        await tx.insert(T.personLinks).values(patch.links.map((l) => ({ id: `${slug}:${l.id}`, personSlug: slug, kind: l.kind, url: l.url })));
      }
    }
    if (patch.photos) {
      await tx.delete(T.personPhotos).where(eq(T.personPhotos.personSlug, slug));
      if (patch.photos.length) {
        await tx.insert(T.personPhotos).values(patch.photos.map((p, i) => ({ id: `${slug}:${p.id}`, personSlug: slug, url: p.url, sort: i })));
      }
    }
  });
}

export async function saveProfile(v: Viewer, body: Record<string, unknown>) {
  const patch = parsePatch(body);
  if (!Object.keys(patch).length) throw badRequest("Нечего сохранять");

  if (v.demo) {
    const [current] = await db.select().from(T.profilePatches).where(eq(T.profilePatches.personSlug, v.slug)).limit(1);
    const merged = { ...(current?.patch ?? {}), ...patch };
    await db
      .insert(T.profilePatches)
      .values({ personSlug: v.slug, patch: merged })
      .onConflictDoUpdate({ target: T.profilePatches.personSlug, set: { patch: merged, updatedAt: new Date() } });
    return { patch: merged, demo: true };
  }
  await materialize(v.slug, patch);
  return { patch, demo: false };
}
