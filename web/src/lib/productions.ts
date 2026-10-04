export type ProjectKv = { label: string; value: string };

export type ProjectPartner = {
  name: string;
  meta: string;
  initials?: string;
  bg?: string;
};

export type ProjectTeamMember = {
  name: string;
  role: string;
  avatar?: string;
  initials?: string;
  bg?: string;
  href?: string;
};

export type ProjectDoc = {
  label: string;
  value: string;
  href?: string;
};

export type TimelineState = "done" | "current" | "future";

export type TimelineItem = {
  date: string;
  title: string;
  meta?: string;
  state?: TimelineState;
};

export type ProjectOpening = {
  title: string;
  meta: string;
  initials: string;
  bg: string;
  responses: number;
  tag: "urgent" | "open" | "soon";
  href?: string;
};

export type ProjectUpdate = {
  author: string;
  time: string;
  text: string;
  avatar?: string;
  initials?: string;
  bg?: string;
  image?: string;
};

export type CastingScene = {
  num: string;
  title: string;
  meta: string;
  duration: string;
  href?: string;
};

export type CastingApplicant = {
  name: string;
  meta: string;
  match: string;
  tag: string;
  tagKind: "green" | "blue" | "gray" | "orange";
  avatar?: string;
  href?: string;
};

export function timelineClass(state?: TimelineState) {
  if (state === "done") return "timeline-item done";
  if (state === "future") return "timeline-item future";
  return "timeline-item";
}

export function scheduleTimeline(project: Project): TimelineItem[] {
  const rows = project.schedule?.filter((r) => r.value) ?? [];
  if (!rows.length) return [];
  const current =
    project.status === "Релиз"
      ? rows.length - 1
      : project.status === "Постпродакшн"
        ? Math.min(2, rows.length - 1)
        : project.status === "В производстве"
          ? Math.min(1, rows.length - 1)
          : 0;
  return rows.map((row, i) => ({
    date: row.value,
    title: row.label,
    state: (i < current ? "done" : i > current ? "future" : "current") as TimelineState,
  }));
}

export type ProjectBlockId =
  | "facts"
  | "team"
  | "status"
  | "budget"
  | "distribution"
  | "partners"
  | "docs";

export type ProjectBlocks = Partial<Record<ProjectBlockId, boolean>>;

export const PROJECT_BLOCK_META: { id: ProjectBlockId; label: string }[] = [
  { id: "facts", label: "Сводка под логлайном" },
  { id: "team", label: "Команда" },
  { id: "status", label: "Статус производства" },
  { id: "budget", label: "Бюджет и финансирование" },
  { id: "distribution", label: "Прокат и платформа" },
  { id: "partners", label: "Партнёры производства" },
  { id: "docs", label: "Документы и юр." },
];

export const DEFAULT_PROJECT_BLOCKS: Record<ProjectBlockId, boolean> = {
  facts: true,
  team: false,
  status: true,
  budget: false,
  distribution: false,
  partners: false,
  docs: false,
};


export function projectBlocks(project: Project): Record<ProjectBlockId, boolean> {
  return { ...DEFAULT_PROJECT_BLOCKS, ...project.blocks };
}

export type ProjectDraft = {
  title: string;
  studio: string;
  platform: string;
  kind: string;
  city: string;
  logline: string;
  text: string;
  status?: string;
  year?: string;
  shifts?: string;
  client?: string;
  budget?: string;
  nature?: string;
  pavilion?: string;
  cdName?: string;
  shiftsDone?: string;
  scenesDone?: string;
  spent?: string;
  schedule?: ProjectKv[];
  financing?: ProjectKv[];
  distribution?: ProjectKv[];
  partners?: ProjectPartner[];
  docs?: ProjectDoc[];
  team?: ProjectTeamMember[];
  openings?: ProjectOpening[];
  updates?: ProjectUpdate[];
  blocks?: ProjectBlocks;
};

export type Project = {
  slug: string;
  title: string;
  studio: string;
  studioAvatar: string;
  platform: string;
  kind: string;
  status: string;
  city: string;
  cover: string;
  logline: string;
  text: string;
  year: string;
  shifts?: string;
  cdSlug?: string;
  client?: string;
  budget?: string;
  nature?: string;
  pavilion?: string;
  cdName?: string;
  shiftsDone?: string;
  scenesDone?: string;
  spent?: string;
  schedule?: ProjectKv[];
  financing?: ProjectKv[];
  distribution?: ProjectKv[];
  partners?: ProjectPartner[];
  docs?: ProjectDoc[];
  team?: ProjectTeamMember[];
  openings?: ProjectOpening[];
  updates?: ProjectUpdate[];
  blocks?: ProjectBlocks;
};

const KV_SPLIT = /\s+[—–-]\s+|:\s+/;

export function parseKvLines(raw: string): ProjectKv[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(KV_SPLIT);
      if (parts.length >= 2) {
        return { label: parts[0].trim(), value: parts.slice(1).join(" — ").trim() };
      }
      return { label: line, value: "" };
    })
    .filter((row) => row.label);
}

export function parsePartners(raw: string): ProjectPartner[] {
  return parseKvLines(raw)
    .filter((row) => row.value)
    .map((row) => ({ name: row.label, meta: row.value }));
}

export function kvToLines(rows?: ProjectKv[]) {
  return rows?.map((row) => `${row.label} — ${row.value}`).join("\n") ?? "";
}

export function kvValue(rows: ProjectKv[] | undefined, label: string) {
  return rows?.find((row) => row.label === label)?.value ?? "";
}

export function mergeNamed<T extends { name: string }>(raw: string, prev: T[] | undefined, map: (name: string, meta: string, old?: T) => T): T[] {
  return parseKvLines(raw)
    .filter((row) => row.value)
    .map((row) => map(row.label, row.value, prev?.find((item) => item.name === row.label)));
}

export function parseFraction(s?: string) {
  if (!s) return null;
  const m = s.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  const done = Number(m[1]);
  const total = Number(m[2]);
  if (!total) return null;
  return { done, total, pct: Math.min(100, Math.round((done / total) * 100)) };
}

export const PROJECT_STATUSES = [
  "Препродакшн",
  "Кастинг",
  "В производстве",
  "Постпродакшн",
  "Релиз",
] as const;

export type CastingStatus = "open" | "closed";

export type Casting = {
  slug: string;
  projectSlug: string;
  title: string;
  roleLabel: string;
  text: string;
  meta: string;
  /** Подпись дедлайна для показа («20 июня», «закрыт»). Источник истины — deadlineOn + status. */
  deadline: string;
  /** Дата дедлайна YYYY-MM-DD; null — без срока. */
  deadlineOn?: string | null;
  status?: CastingStatus;
  responses: number;
  /** Когда кастинг создан (мс). */
  createdAt?: number;
  urgent?: boolean;
  media: string;
  facts: [string, string][];
  cdSlug: string;
  cdName: string;
  published?: string;
  timeline?: TimelineItem[];
  scenes?: CastingScene[];
  scenesPdf?: string;
  applicants?: CastingApplicant[];
  docs?: ProjectDoc[];
};
