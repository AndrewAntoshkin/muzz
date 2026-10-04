import type { Casting, Project } from "@/lib/productions";
import type { Credit, KvPair, Schedule, Showreel } from "@/lib/person-card";
import type { RoleId } from "@/lib/roles";


export type Availability = "open" | "busy" | "hold";

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  open: "Открыт к предложениям",
  busy: "Занят на проекте",
  hold: "Hold · ограниченно",
};

export const AVAILABILITY_LABEL_F: Record<Availability, string> = {
  open: "Открыта к предложениям",
  busy: "Занята на проекте",
  hold: "Hold · ограниченно",
};

export function availabilityLabel(kind: Availability, feminine = false) {
  return feminine ? AVAILABILITY_LABEL_F[kind] : AVAILABILITY_LABEL[kind];
}

export type ActorPulse = {
  id: string;
  personSlug: string;
  name: string;
  avatar: string;
  text: string;
  availability: Availability;
  updatedAt: number;
};

/** Статус занятости из опубликованного «пульса». Если актёр ничего не публиковал — null (мы не выдумываем занятость). */
export function personAvailability(slug: string, pulses: ActorPulse[]): Availability | null {
  return pulses.find((p) => p.personSlug === slug)?.availability ?? null;
}

export type ProfileLink = { id: string; kind: string; url: string };
export type ProfilePhoto = { id: string; url: string };

export type ProfilePatch = {
  bio?: string;
  city?: string;
  params?: KvPair[];
  appearance?: KvPair[];
  languages?: KvPair[];
  skills?: string[];
  education?: string;
  showreel?: Showreel | null;
  photos?: ProfilePhoto[];
  schedule?: Schedule | null;
  credits?: Credit[];
  links?: ProfileLink[];
};

export type AppStatus = "sent" | "shortlist" | "invited" | "declined";
export type AppKind = "apply" | "selftape" | "propose" | "invite";

export type AppTape = {
  title: string;
  poster: string;
  duration?: string;
  href?: string;
  caption?: string;
};

export type Application = {
  id: string;
  castingSlug: string;
  actorSlug: string;
  actorName: string;
  actorAvatar: string | null;
  kind: AppKind;
  note: string;
  status: AppStatus;
  /** actor — откликнулся сам, agent — предложил агент, casting — пригласил кастинг-директор. */
  source: "actor" | "agent" | "casting";
  createdAt: number;
  updatedAt: number;
  match?: string;
  actorMeta?: string;
  tape?: AppTape;
};

export type FeedPost = {
  id: string;
  authorRole: RoleId;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: number;
};

export type ChatPeer = {
  name: string;
  roleLabel: string;
  avatar?: string;
  initials?: string;
  bg?: string;
  profileHref?: string;
  extraHref?: string;
  extraLabel?: string;
};

export type ChatLine = {
  id: string;
  authorRole: RoleId | "studio";
  text: string;
  time: string;
  createdAt: number;
  card?: { title: string; meta: string; href: string };
  tape?: { title: string; duration?: string; href?: string };
};

export type CastingPin = {
  id: string;
  projectSlug: string;
  actorSlug: string;
  actorName: string;
  photo: string;
  character: string;
  rotation: number;
  x?: number;
  y?: number;
  chosen?: boolean;
};

export type ShortlistPerson = {
  slug: string;
  name: string;
  photo: string;
  meta?: string;
};


export type RoleLayout = {
  projectSlug: string;
  castingSlug: string;
  x: number;
  y: number;
};

export type ChatThread = {
  id: string;
  roles: RoleId[];
  views: Partial<Record<RoleId, ChatPeer>>;
  unreadFor: RoleId[];
  messages: ChatLine[];
};

export type WorkspaceSettings = {
  notifyEmail: boolean;
  notifyPush: boolean;
  plan: import("./plans").PlanId;
  rehearsalsUsed?: number;
  rehearsalsMonth?: string;
};

export type WorkspaceViewer = {
  /** Чьими глазами смотрим: slug реальной анкеты или демо-персоны. */
  slug: string;
  role: RoleId;
  /** Демо-режим: показываем демо-контент, настоящие пользователи его не видят. */
  demo: boolean;
};

export type WorkspaceState = {
  me: WorkspaceViewer;
  /** Всё, что новее этой отметки в «уведомлениях», считается непрочитанным. */
  inboxSeenAt: number;
  projects: Project[];
  castings: Casting[];
  applications: Application[];
  posts: FeedPost[];
  threads: ChatThread[];
  saved: string[];
  settings: WorkspaceSettings;
  pulses: ActorPulse[];
  profilePatches: Record<string, ProfilePatch>;
  boards: CastingPin[];
  shortlist: ShortlistPerson[];
  roleLayout: RoleLayout[];
};

const COVERS = [
  "/assets/projects/tihiy-yanvar.jpg",
  "/assets/projects/komnata-14.jpg",
  "/assets/projects/okno.jpg",
  "/assets/projects/posle-shtorma.jpg",
];

export const STATUS_LABEL: Record<AppStatus, string> = {
  sent: "Отправлено",
  shortlist: "Шорт-лист",
  invited: "Приглашение на очные",
  declined: "Отклонено",
};

export const KIND_LABEL: Record<AppKind, string> = {
  apply: "Отклик",
  selftape: "Самопроба",
  propose: "Предложение агента",
  invite: "Приглашение",
};


export function allProjects(state: WorkspaceState): Project[] {
  return state.projects;
}

export function allCastings(state: WorkspaceState): Casting[] {
  return state.castings;
}

export function findProject(state: WorkspaceState, slug: string) {
  return state.projects.find((p) => p.slug === slug) ?? null;
}

export function findCasting(state: WorkspaceState, slug: string) {
  return state.castings.find((c) => c.slug === slug) ?? null;
}

export function castingsOfProject(state: WorkspaceState, projectSlug: string) {
  return state.castings.filter((c) => c.projectSlug === projectSlug);
}

export function projectsOfCd(state: WorkspaceState, cdSlug: string) {
  const fromCastings = new Set(state.castings.filter((c) => c.cdSlug === cdSlug).map((c) => c.projectSlug));
  return state.projects.filter((p) => p.cdSlug === cdSlug || fromCastings.has(p.slug));
}

export function castingsOfCd(state: WorkspaceState, cdSlug: string) {
  return state.castings.filter((c) => c.cdSlug === cdSlug);
}

/** Число откликов считает сервер (видно всем); владельцу кастинга оно совпадает с длиной его списка откликов. */
export function responseCount(_state: WorkspaceState, casting: Casting) {
  return casting.responses;
}

export function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function slugify(text: string) {
  const base = text
    .toLowerCase()
    .replace(/[«»"']/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "item"}-${Date.now().toString(36)}`;
}

export function nowTime() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function coverFor(index: number) {
  return COVERS[index % COVERS.length];
}

export function lastLine(thread: ChatThread) {
  const last = thread.messages[thread.messages.length - 1] ?? null;
  if (!last) return null;
  if (last.tape && (!last.text || last.text === last.tape.title)) {
    return { ...last, text: last.tape.title };
  }
  return last;
}

export function threadsFor(state: WorkspaceState, role: RoleId) {
  return state.threads
    .filter((t) => t.roles.includes(role) && t.views[role])
    .slice()
    .sort((a, b) => (lastLine(b)?.createdAt ?? 0) - (lastLine(a)?.createdAt ?? 0));
}

export function unreadCount(state: WorkspaceState, role: RoleId) {
  return threadsFor(state, role).filter((t) => t.unreadFor.includes(role)).length;
}
