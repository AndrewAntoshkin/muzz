export type KvPair = { label: string; value: string };

export type Credit = {
  year?: string;
  title: string;
  meta?: string;
  credit?: string;
  kind?: string;
};

export type CastingRow = {
  title: string;
  meta: string;
  count?: string;
  tag?: string;
  href?: string;
};

export type ClientRow = {
  name: string;
  meta?: string;
};

export type ManagerCard = {
  name: string;
  org?: string;
  email?: string;
  phone?: string;
};

export type Showreel = {
  poster: string;
  title: string;
  duration?: string;
  caption?: string;
  href?: string;
};

export type ScheduleEvent = {
  start?: string;
  end?: string;
  openFrom?: boolean;
  when?: string;
  title: string;
  meta: string;
};

export type Schedule = {
  busy: string[];
  hold: string[];
  events: ScheduleEvent[];
};

export type PersonCard = {
  height?: string;
  education?: string;
  instagram?: string;
  heroMeta?: string[];
  params?: KvPair[];
  appearance?: KvPair[];
  languages?: KvPair[];
  skills?: string[];
  credits?: Credit[];
  stats?: { value: string; label: string }[];
  castings?: CastingRow[];
  clients?: ClientRow[];
  chips?: string[];
  manager?: ManagerCard;
  terms?: KvPair[];
  showreel?: Showreel;
  schedule?: Schedule;
};

export function asCard(raw: unknown): PersonCard {
  if (!raw || typeof raw !== "object") return {};
  const card = raw as PersonCard;
  if (!card.credits?.length) return card;
  const credits = cleanCredits(card.credits);
  return { ...card, credits: credits.length ? credits : undefined };
}

/** Drop CSS / unicode-range / URL debris that scrapers treated as films. */
export function isRealCredit(row: Credit): boolean {
  const title = (row.title || "").replace(/[«»„“"]/g, "").trim();
  if (title.length < 2 || title.length > 120) return false;
  const year = Number(String(row.year || "").replace(/[^\d]/g, ""));
  if (row.year && (!Number.isFinite(year) || year < 1920 || year > 2032)) return false;
  const blob = `${row.year || ""} ${title} ${row.meta || ""} ${row.credit || ""}`;
  if (
    /href\s*=|https?:\/\/|www\.|\.css\b|\.js\b|unicode-range|@font-face|wp-content|elementor|stylesheet|woff2?|src:\s*url|U\+[0-9A-Fa-f]{2,6}/i.test(
      blob,
    )
  ) {
    return false;
  }
  if (!/[A-Za-zА-Яа-яЁё]/.test(title)) return false;
  if (/^(css|href|url|var|rgb|rgba|html|body|none)\b/i.test(title)) return false;
  return true;
}

export function cleanCredits(rows: Credit[] | null | undefined): Credit[] {
  if (!rows?.length) return [];
  const seen = new Set<string>();
  const out: Credit[] = [];
  for (const row of rows) {
    if (!isRealCredit(row)) continue;
    const key = `${row.year || ""}|${row.title.replace(/[«»]/g, "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function kvValue(rows: KvPair[] | undefined, label: string) {
  return rows?.find((r) => r.label.toLowerCase() === label.toLowerCase())?.value;
}

export function ageYears(iso: string | null | undefined) {
  if (!iso) return null;
  const born = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const md = now.getUTCMonth() - born.getUTCMonth();
  if (md < 0 || (md === 0 && now.getUTCDate() < born.getUTCDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

export function ageLabel(iso: string | null | undefined) {
  return yearsLabel(ageYears(iso));
}

/** "34 года" from an already computed age (the server sends `age`, not the birth date). */
export function yearsLabel(n: number | null | undefined) {
  if (n == null) return null;
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "год"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "года"
        : "лет";
  return `${n} ${word}`;
}
