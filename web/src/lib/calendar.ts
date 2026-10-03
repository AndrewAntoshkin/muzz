import type { Schedule, ScheduleEvent } from "./person-card";

export const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export const MONTH_TITLE = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const MONTH_GENITIVE = [
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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type CalCell = {
  iso: string;
  n: number;
  off: boolean;
  today: boolean;
};

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function isoRange(start: Date, days: number): string[] {
  return Array.from({ length: days }, (_, i) => toISODate(addDays(start, i)));
}

export function monthCells(year: number, month: number, today = new Date()): CalCell[] {
  const first = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  let pad = first.getDay() - 1;
  if (pad < 0) pad = 6;
  const todayIso = toISODate(today);
  const cells: CalCell[] = [];

  for (let i = pad; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    const iso = toISODate(d);
    cells.push({ iso, n: d.getDate(), off: true, today: iso === todayIso });
  }
  for (let n = 1; n <= lastDate; n++) {
    const iso = toISODate(new Date(year, month, n));
    cells.push({ iso, n, off: false, today: iso === todayIso });
  }
  const trailing = (7 - (cells.length % 7)) % 7;
  for (let n = 1; n <= trailing; n++) {
    const d = new Date(year, month + 1, n);
    const iso = toISODate(d);
    cells.push({ iso, n, off: true, today: iso === todayIso });
  }
  return cells;
}

function asIsoList(raw: unknown, fallbackYear: number, fallbackMonth: number): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item === "string" && ISO_DATE.test(item)) return [item];
    if (typeof item === "number" && item >= 1 && item <= 31) {
      const last = new Date(fallbackYear, fallbackMonth + 1, 0).getDate();
      const n = Math.min(item, last);
      return [toISODate(new Date(fallbackYear, fallbackMonth, n))];
    }
    return [];
  });
}

function parseWhen(when: string, year: number): Pick<ScheduleEvent, "start" | "end" | "openFrom"> | null {
  const trimmed = when.trim();
  if (!trimmed) return null;
  const openFrom = /^с\s+/i.test(trimmed);
  const text = trimmed.replace(/^с\s+/i, "");
  const monthOf = (name: string) => {
    const i = MONTH_GENITIVE.indexOf(name.toLowerCase());
    return i >= 0 ? i : -1;
  };
  const range = text.match(/^(\d{1,2})\s*[–—-]\s*(\d{1,2})\s+([а-яё]+)/i);
  if (range) {
    const month = monthOf(range[3]);
    if (month < 0) return null;
    return {
      start: toISODate(new Date(year, month, Number(range[1]))),
      end: toISODate(new Date(year, month, Number(range[2]))),
    };
  }
  const single = text.match(/^(\d{1,2})\s+([а-яё]+)/i);
  if (single) {
    const month = monthOf(single[2]);
    if (month < 0) return null;
    return {
      start: toISODate(new Date(year, month, Number(single[1]))),
      ...(openFrom ? { openFrom: true } : {}),
    };
  }
  return null;
}

function asEvent(raw: unknown, year: number): ScheduleEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const title = typeof row.title === "string" ? row.title : "";
  const meta = typeof row.meta === "string" ? row.meta : "";
  const when = typeof row.when === "string" ? row.when : undefined;
  const parsed = when ? parseWhen(when, year) : null;
  const start =
    typeof row.start === "string" && ISO_DATE.test(row.start) ? row.start : parsed?.start;
  const end = typeof row.end === "string" && ISO_DATE.test(row.end) ? row.end : parsed?.end;
  if (!title && !meta && !when && !start) return null;
  return {
    title,
    meta,
    ...(when ? { when } : {}),
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
    ...(row.openFrom || parsed?.openFrom ? { openFrom: true } : {}),
  };
}

export function emptySchedule(): Schedule {
  return { busy: [], hold: [], events: [] };
}

export function normalizeSchedule(raw: unknown, now = new Date()): Schedule {
  if (!raw || typeof raw !== "object") return emptySchedule();
  const row = raw as Record<string, unknown>;
  const year = now.getFullYear();
  const events = Array.isArray(row.events) ? row.events.flatMap((e) => asEvent(e, year) ?? []) : [];
  const anchor = events.find((e) => e.start);
  const fallback = anchor ? parseISODate(anchor.start as string) : now;
  return {
    busy: asIsoList(row.busy, fallback.getFullYear(), fallback.getMonth()),
    hold: asIsoList(row.hold, fallback.getFullYear(), fallback.getMonth()),
    events,
  };
}

export function cellClass(cell: CalCell, schedule?: Schedule) {
  const bits: string[] = [];
  if (cell.off) bits.push("off");
  if (schedule?.busy.includes(cell.iso)) bits.push("busy");
  if (schedule?.hold.includes(cell.iso)) bits.push("hold");
  if (cell.today) bits.push("today");
  return bits.join(" ");
}

function formatDayMonth(date: Date) {
  return `${date.getDate()} ${MONTH_GENITIVE[date.getMonth()]}`;
}

export function formatEventWhen(event: ScheduleEvent): string {
  if (event.when) return event.when;
  if (!event.start) return "";
  const start = parseISODate(event.start);
  if (event.openFrom) return `с ${formatDayMonth(start)}`;
  if (!event.end || event.end === event.start) return formatDayMonth(start);
  const end = parseISODate(event.end);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${end.getDate()} ${MONTH_GENITIVE[start.getMonth()]}`;
  }
  return `${formatDayMonth(start)} – ${formatDayMonth(end)}`;
}

export function eventVisibleInMonth(event: ScheduleEvent, year: number, month: number): boolean {
  if (!event.start) return true;
  const start = parseISODate(event.start);
  const end = event.end ? parseISODate(event.end) : start;
  const visStart = new Date(year, month, 1);
  const visEnd = new Date(year, month + 1, 0);
  if (start <= visEnd && end >= visStart) return true;
  if (event.openFrom) {
    const nextStart = new Date(year, month + 1, 1);
    const nextEnd = new Date(year, month + 2, 0);
    return start >= nextStart && start <= nextEnd;
  }
  return false;
}
