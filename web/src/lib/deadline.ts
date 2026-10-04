/** Дедлайны кастингов: хранится дата YYYY-MM-DD (по Москве), подпись выводится из неё. */

const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

/** Сегодняшняя дата по Москве в виде YYYY-MM-DD. */
export function todayMsk(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Moscow" }).format(now);
}

/** Срок прошёл: сам день дедлайна ещё считается открытым. */
export function isDeadlinePast(iso: string | null | undefined, now = new Date()) {
  if (!iso || !isIsoDate(iso)) return false;
  return iso < todayMsk(now);
}

export function formatDeadline(iso: string, now = new Date()) {
  const m = ISO_DATE.exec(iso);
  if (!m) return iso;
  const day = Number(m[3]);
  const month = MONTHS[Number(m[2]) - 1] ?? "";
  // Год показываем только когда дата далеко (или давно прошла): «5 января» осенью — это ближайший январь.
  const far = Math.abs(daysUntil(iso, now)) > 330;
  return far ? `${day} ${month} ${m[1]}` : `${day} ${month}`;
}

/** Дней до дедлайна (0 — сегодня, отрицательное — просрочено). */
export function daysUntil(iso: string, now = new Date()) {
  const [y, mo, d] = iso.split("-").map(Number);
  const [ty, tmo, td] = todayMsk(now).split("-").map(Number);
  return Math.round((Date.UTC(y, mo - 1, d) - Date.UTC(ty, tmo - 1, td)) / 86_400_000);
}
