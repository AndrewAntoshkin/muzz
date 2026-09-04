import type { RoleId } from "@/lib/roles";
import {
  KIND_LABEL,
  STATUS_LABEL,
  allCastings,
  findCasting,
  findProject,
  lastLine,
  threadsFor,
  type WorkspaceState,
} from "@/lib/workspace";

export type InboxKind = "message" | "casting" | "project";

export type InboxEvent = {
  id: string;
  kind: InboxKind;
  kindLabel: string;
  title: string;
  text: string;
  href: string;
  createdAt: number;
  timeLabel?: string;
};

function relFromAgo(label: string, fallbackDays: number) {
  const n = Number(label.match(/\d+/)?.[0] ?? fallbackDays);
  if (/час/.test(label)) return Date.now() - n * 3600000;
  if (/мин/.test(label)) return Date.now() - n * 60000;
  return Date.now() - n * 86400000;
}

export function relTime(ts: number) {
  const delta = Math.max(0, Date.now() - ts);
  const mins = Math.round(delta / 60000);
  if (mins < 1) return "сейчас";
  if (mins < 60) return `${mins} мин`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ч`;
  const days = Math.round(hours / 24);
  return `${days} д`;
}

export function collectInbox(state: WorkspaceState, role: RoleId, meSlug: string): InboxEvent[] {
  const events: InboxEvent[] = [];

  for (const thread of threadsFor(state, role)) {
    const last = lastLine(thread);
    if (!last) continue;
    const peer = thread.views[role];
    events.push({
      id: `msg:${thread.id}:${last.id}`,
      kind: "message",
      kindLabel: "Сообщение",
      title: peer?.name || "Диалог",
      text: last.text,
      href: `/messages?thread=${encodeURIComponent(thread.id)}`,
      createdAt: last.createdAt,
      timeLabel: last.time,
    });
  }

  if (role === "actor") {
    for (const app of state.applications) {
      if (app.actorSlug !== meSlug) continue;
      if (app.status === "sent") continue;
      const casting = findCasting(state, app.castingSlug);
      const title = casting?.title || "Кастинг";
      events.push({
        id: `cast:${app.id}:${app.status}`,
        kind: "casting",
        kindLabel: "Кастинг",
        title,
        text:
          app.status === "shortlist"
            ? `Вы в шорт-листе · ${STATUS_LABEL[app.status]}`
            : app.status === "invited"
              ? `Приглашение на очные · ${STATUS_LABEL[app.status]}`
              : `Отклик: ${STATUS_LABEL[app.status]}`,
        href: `/responses/${app.id}`,
        createdAt: app.createdAt + 1,
      });
    }
  } else if (role === "casting") {
    const mine = new Set(allCastings(state).filter((c) => c.cdSlug === meSlug).map((c) => c.slug));
    for (const app of state.applications) {
      if (!mine.has(app.castingSlug)) continue;
      const casting = findCasting(state, app.castingSlug);
      events.push({
        id: `cast:${app.id}:${app.status}`,
        kind: "casting",
        kindLabel: "Кастинг",
        title: casting?.title || "Кастинг",
        text: `${app.actorName} · ${KIND_LABEL[app.kind]} · ${STATUS_LABEL[app.status]}`,
        href: `/responses/${app.id}`,
        createdAt: app.createdAt,
      });
    }
  } else if (role === "agent") {
    for (const app of state.applications) {
      if (app.source !== "agent") continue;
      const casting = findCasting(state, app.castingSlug);
      events.push({
        id: `cast:${app.id}:${app.status}`,
        kind: "casting",
        kindLabel: "Кастинг",
        title: app.actorName,
        text: `${casting?.title || "Кастинг"} · ${STATUS_LABEL[app.status]}`,
        href: `/responses/${app.id}`,
        createdAt: app.createdAt,
      });
    }
  }

  for (const key of state.saved) {
    if (!key.startsWith("project:")) continue;
    const slug = key.slice("project:".length);
    const project = findProject(state, slug);
    if (!project) continue;
    (project.updates ?? []).forEach((update, i) => {
      events.push({
        id: `proj:${slug}:${i}`,
        kind: "project",
        kindLabel: "Проект",
        title: project.title,
        text: update.text,
        href: `/projects/${slug}`,
        createdAt: relFromAgo(update.time, i + 1),
        timeLabel: update.time,
      });
    });
    for (const casting of state.castings.filter((c) => c.projectSlug === slug)) {
      events.push({
        id: `proj-cast:${casting.slug}`,
        kind: "project",
        kindLabel: "Проект",
        title: project.title,
        text: `Открыт кастинг: ${casting.title}`,
        href: `/castings/${casting.slug}`,
        createdAt: Date.now(),
      });
    }
  }

  events.sort((a, b) => b.createdAt - a.createdAt);
  return events.slice(0, 24);
}
