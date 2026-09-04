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

export const CITY_FILTERS = [
  { value: "", label: "Все" },
  { value: "Москва", label: "Москва" },
  { value: "СПб", label: "СПб" },
  { value: "Казань", label: "Казань" },
  { value: "Мурманск", label: "Мурманск" },
  { value: "Сочи", label: "Сочи" },
] as const;

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
  kinopoisk: "Кинопоиск",
  vimeo: "Vimeo",
  youtube: "YouTube",
  "kino-teatr": "Кино-театр",
  kinolift: "Kinolift",
  telegram: "Telegram",
  instagram: "Instagram",
  site: "Сайт",
};
