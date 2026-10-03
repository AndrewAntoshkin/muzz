import { personIsMedia, personPlan, type PlanId } from "./plans";

export const PROFESSION_LABELS: Record<string, string> = {
  actor: "Актёр",
  actress: "Актриса",
  director: "Режиссёр",
  producer: "Продюсер",
  dop: "Оператор-постановщик",
  operator: "Оператор",
  screenwriter: "Сценарист",
  editor: "Монтажёр",
  sound: "Звукорежиссёр",
  casting: "Кастинг-директор",
  agent: "Агент",
  gaffer: "Гафер",
  costume: "Костюмер",
};

export const PROFESSION_FILTERS = [
  { value: "", label: "Все" },
  { value: "actor", label: "Актёр" },
  { value: "actress", label: "Актриса" },
  { value: "director", label: "Режиссёр" },
  { value: "producer", label: "Продюсер" },
  { value: "dop", label: "Оператор-пост." },
  { value: "casting", label: "Кастинг" },
  { value: "agent", label: "Агент" },
  { value: "screenwriter", label: "Сценарист" },
  { value: "editor", label: "Монтаж" },
  { value: "sound", label: "Звук" },
  { value: "gaffer", label: "Гафер" },
  { value: "costume", label: "Костюм" },
] as const;

export const ACTOR_PROFESSION_FILTERS = [
  { value: "", label: "Все" },
  { value: "actor", label: "Актёр" },
  { value: "actress", label: "Актриса" },
] as const;

export const CITY_FILTERS = [
  { value: "", label: "Все" },
  { value: "Москва", label: "Москва" },
  { value: "СПб", label: "СПб" },
  { value: "Казань", label: "Казань" },
  { value: "Мурманск", label: "Мурманск" },
  { value: "Сочи", label: "Сочи" },
] as const;

export const FORMAT_FILTERS = [
  { value: "", label: "Все" },
  { value: "feature", label: "Полный метр" },
  { value: "series", label: "Сериал" },
  { value: "doc", label: "Документальный" },
  { value: "short", label: "Короткий метр" },
] as const;

export const PLATFORM_FILTERS = [
  { value: "", label: "Все" },
  { value: "Кинопоиск", label: "Кинопоиск" },
  { value: "Okko", label: "Okko" },
  { value: "KION", label: "KION" },
  { value: "START", label: "START" },
  { value: "Wink", label: "Wink" },
  { value: "Premier", label: "Premier" },
  { value: "IVI", label: "IVI" },
  { value: "кинотеатры", label: "Кинотеатры" },
  { value: "фестиваль", label: "Фестиваль" },
] as const;

const PLATFORM_LOGOS: { match: string; src: string; invert?: boolean }[] = [
  { match: "кинопоиск", src: "/assets/logos/kinopoisk.svg" },
  { match: "okko", src: "/assets/logos/okko.svg", invert: true },
  { match: "kion", src: "/assets/logos/kion.webp" },
  { match: "start", src: "/assets/logos/start.svg" },
  { match: "wink", src: "/assets/logos/wink.svg" },
  { match: "premier", src: "/assets/logos/premier.svg" },
  { match: "ivi", src: "/assets/logos/ivi.svg" },
];

export function platformLogo(platform: string) {
  const key = platform.trim().toLowerCase();
  if (!key) return null;
  return PLATFORM_LOGOS.find((item) => key.includes(item.match)) ?? null;
}

export const CASTING_ROLE_FILTERS = [
  { value: "", label: "Все" },
  { value: "lead", label: "Главная" },
  { value: "second", label: "Вторая" },
  { value: "episode", label: "Эпизод" },
  { value: "host", label: "Ведущие" },
] as const;

export const PROJECT_STATUS_FILTERS = [
  { value: "", label: "Все" },
  { value: "Препродакшн", label: "Препродакшн" },
  { value: "Кастинг", label: "Кастинг" },
  { value: "В производстве", label: "В производстве" },
  { value: "Постпродакшн", label: "Постпродакшн" },
  { value: "Релиз", label: "Релиз" },
] as const;

export function ruPlural(n: number, one: string, few: string, many: string) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

export function ruCount(n: number, one: string, few: string, many: string) {
  return `${n} ${ruPlural(n, one, few, many)}`;
}

export function personIsPro(person: { slug: string; profession?: string | null }) {
  return personPlan(person.slug, person.profession) !== "standard";
}

const PLAN_SORT_RANK: Record<PlanId, number> = {
  standard: 0,
  pro: 1,
  premium: 2,
};

/** Media first, then premium → pro → standard, then name. */
export function compareFacesByPlan(
  a: { slug: string; name: string; profession?: string | null },
  b: { slug: string; name: string; profession?: string | null },
) {
  const media = Number(personIsMedia(b.slug)) - Number(personIsMedia(a.slug));
  if (media) return media;
  const plan =
    PLAN_SORT_RANK[personPlan(b.slug, b.profession)] - PLAN_SORT_RANK[personPlan(a.slug, a.profession)];
  if (plan) return plan;
  return a.name.localeCompare(b.name, "ru");
}

export function projectFormats(kind: string) {
  const k = kind.toLowerCase();
  const out: string[] = [];
  if (k.includes("сериал")) out.push("series");
  if (k.includes("документ")) out.push("doc");
  if (k.includes("коротк")) out.push("short");
  if (k.includes("полный")) out.push("feature");
  if (!out.length) out.push("feature");
  return out;
}

export function matchesCity(hay: string, city: string) {
  if (!city) return true;
  return hay.toLowerCase().includes(city.toLowerCase());
}

export function matchesPlatform(platform: string, filter: string) {
  if (!filter) return true;
  return platform.toLowerCase().includes(filter.toLowerCase());
}

export function castingRoleKind(roleLabel: string) {
  const r = roleLabel.toLowerCase();
  if (r.includes("ведущ")) return "host";
  if (r.includes("эпизод")) return "episode";
  if (r.includes("втор")) return "second";
  if (r.includes("главн")) return "lead";
  return "episode";
}

/** Title without repeating the role chip, e.g. "Вторая мужская · 30–40" → "30–40". */
export function castingCardTitle(title: string, roleLabel: string) {
  const t = title.trim();
  const role = roleLabel.trim();
  if (!role || !t || t === role) return t;
  const escaped = role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rest = t.replace(new RegExp(`^${escaped}\\s*[·•—–\\-]\\s*`), "").trim();
  return rest || t;
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function peopleCountLabel(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "человек"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "человека"
        : "человек";
  return `${n} ${word}`;
}

export function formatBirthDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function assetSrc(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

export const LINK_LABELS: Record<string, string> = {
  email: "Почта",
  phone: "Телефон",
  kinopoisk: "Кинопоиск",
  vimeo: "Vimeo",
  youtube: "YouTube",
  "kino-teatr": "Кино-театр",
  kinolift: "Kinolift",
  kinoteatr: "Кино-Театр.Ру",
  telegram: "Telegram",
  instagram: "Instagram",
  site: "Сайт",
};

export const CONTACT_KINDS = ["email", "phone"] as const;

export function contactHref(kind: string, value: string) {
  const v = value.trim();
  if (!v) return null;
  if (kind === "email") return `mailto:${v}`;
  if (kind === "phone") return `tel:${v.replace(/[^\d+]/g, "")}`;
  return v;
}

export function upsertLink(
  links: { id: string; kind: string; url: string }[],
  kind: string,
  url: string,
) {
  const rest = links.filter((l) => l.kind !== kind);
  const trimmed = url.trim();
  if (!trimmed) return rest;
  const existing = links.find((l) => l.kind === kind);
  return [...rest, { id: existing?.id ?? `link-${kind}`, kind, url: trimmed }];
}
