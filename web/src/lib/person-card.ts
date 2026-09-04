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
  when: string;
  title: string;
  meta: string;
};

export type Schedule = {
  busy: number[];
  hold: number[];
  today: number;
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
  return raw as PersonCard;
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
  const n = ageYears(iso);
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
