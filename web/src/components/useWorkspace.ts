"use client";

import { createContext, createElement, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { FaceCard } from "@/lib/people";
import type { Casting, Project, ProjectKv, ProjectPartner } from "@/lib/productions";
import { profileSlug, type RoleId } from "@/lib/roles";
import {
  allCastings,
  allProjects,
  castingsOfCd,
  castingsOfProject,
  cloneSeed,
  coverFor,
  findCasting,
  findProject,
  loadWorkspace,
  nowTime,
  projectsOfCd,
  responseCount,
  saveWorkspace,
  slugify,
  threadsFor,
  unreadCount,
  type AppKind,
  type AppStatus,
  type Application,
  type ChatLine,
  type WorkspaceState,
} from "@/lib/workspace";
import { useDemoRole } from "./useDemoRole";

const CD = {
  slug: "lebedeva",
  name: "Анна Лебедева",
  avatar: "/assets/figma/avatar-02.png",
};

const STATUS_FLASH: Record<AppStatus, string> = {
  sent: "Статус обновлён",
  shortlist: "В шорт-листе",
  invited: "Приглашение отправлено",
  declined: "Отклонено",
};

function useWorkspaceValue() {
  const { role, cfg } = useDemoRole();
  const actorSlug = profileSlug(cfg);
  const cdSlug = role === "casting" ? profileSlug(cfg) : CD.slug;
  const [state, setState] = useState<WorkspaceState>(cloneSeed);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useLayoutEffect(() => {
    const loaded = loadWorkspace();
    stateRef.current = loaded;
    setState(loaded);
    setReady(true);
    const sync = () => {
      const next = loadWorkspace();
      stateRef.current = next;
      setState(next);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2800);
  }, []);

  const update = useCallback((fn: (prev: WorkspaceState) => WorkspaceState) => {
    const next = fn(stateRef.current);
    if (next === stateRef.current) return;
    stateRef.current = next;
    saveWorkspace(next);
    setState(next);
  }, []);

  const projects = useMemo(() => allProjects(state), [state]);
  const castings = useMemo(() => allCastings(state), [state]);
  const threads = useMemo(() => threadsFor(state, role), [state, role]);
  const unread = useMemo(() => unreadCount(state, role), [state, role]);

  const myApplications = useMemo(() => {
    if (role === "actor") return state.applications.filter((a) => a.actorSlug === actorSlug);
    if (role === "agent") return state.applications.filter((a) => a.source === "agent");
    return state.applications;
  }, [state.applications, role, actorSlug]);

  const applyToCasting = useCallback(
    (castingSlug: string, kind: AppKind = "selftape") => {
      const exists = state.applications.some(
        (a) => a.castingSlug === castingSlug && a.actorSlug === actorSlug && a.source === "actor",
      );
      if (exists) {
        flash("Вы уже откликнулись на этот кастинг");
        return false;
      }
      const app: Application = {
        id: `app-${Date.now().toString(36)}`,
        castingSlug,
        actorSlug,
        actorName: cfg.name,
        actorAvatar: cfg.avatar,
        kind,
        note: kind === "selftape" ? "Самопроба отправлена из «Кадра»." : "",
        status: "sent",
        source: "actor",
        createdAt: Date.now(),
      };
      const casting = findCasting(state, castingSlug);
      update((prev) => ({
        ...prev,
        applications: [app, ...prev.applications],
        threads: prev.threads.map((t) =>
          t.id !== "lebedeva-vzmetnev"
            ? t
            : {
                ...t,
                unreadFor: Array.from(new Set([...t.unreadFor, "casting" as RoleId])),
                messages: [
                  ...t.messages,
                  {
                    id: `m-${Date.now().toString(36)}`,
                    authorRole: "actor" as const,
                    text:
                      kind === "selftape"
                        ? `Отправил самопробу на «${casting?.title ?? "кастинг"}».`
                        : `Откликнулся на «${casting?.title ?? "кастинг"}».`,
                    time: nowTime(),
                    createdAt: Date.now(),
                    card: casting
                      ? {
                          title: casting.title,
                          meta: `до ${casting.deadline}`,
                          href: `/castings/${casting.slug}`,
                        }
                      : undefined,
                  },
                ],
              },
        ),
      }));
      flash(kind === "selftape" ? "Самопроба отправлена" : "Отклик отправлен");
      return true;
    },
    [state, actorSlug, cfg.name, cfg.avatar, flash, update],
  );

  const proposeActor = useCallback(
    (castingSlug: string, person: Pick<FaceCard, "slug" | "name" | "imageUrl">, note: string) => {
      const exists = state.applications.some(
        (a) => a.castingSlug === castingSlug && a.actorSlug === person.slug && a.source === "agent",
      );
      if (exists) {
        flash("Этого актёра уже предлагали на роль");
        return false;
      }
      const app: Application = {
        id: `app-${Date.now().toString(36)}`,
        castingSlug,
        actorSlug: person.slug,
        actorName: person.name,
        actorAvatar: person.imageUrl,
        kind: "propose",
        note,
        status: "sent",
        source: "agent",
        createdAt: Date.now(),
      };
      const casting = findCasting(state, castingSlug);
      const msg: ChatLine = {
        id: `m-${Date.now().toString(36)}`,
        authorRole: "agent",
        text: `Предлагаю ${person.name} на «${casting?.title ?? "кастинг"}».${note ? ` ${note}` : ""}`,
        time: nowTime(),
        createdAt: Date.now(),
        card: casting
          ? { title: casting.title, meta: person.name, href: `/castings/${casting.slug}` }
          : undefined,
      };
      update((prev) => ({
        ...prev,
        applications: [app, ...prev.applications],
        threads: prev.threads.map((t) =>
          t.id !== "kevorkova-lebedeva"
            ? t
            : {
                ...t,
                unreadFor: Array.from(new Set([...t.unreadFor, "casting" as RoleId])),
                messages: [...t.messages, msg],
              },
        ),
      }));
      flash(`${person.name} предложен(а) на роль`);
      return true;
    },
    [state, flash, update],
  );

  const setAppStatus = useCallback(
    (id: string, status: AppStatus) => {
      update((prev) => ({
        ...prev,
        applications: prev.applications.map((a) => (a.id === id ? { ...a, status } : a)),
      }));
      flash(status === "invited" ? "Приглашение отправлено" : STATUS_FLASH[status]);
    },
    [flash, update],
  );

  const addProject = useCallback(
    (draft: {
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
    }) => {
      const slug = slugify(draft.title);
      const project: Project = {
        slug,
        title: draft.title.startsWith("«") ? draft.title : `«${draft.title}»`,
        studio: draft.studio || "Анна Лебедева",
        studioAvatar: CD.avatar,
        platform: draft.platform || "открытый",
        kind: draft.kind || "Полный метр",
        status: draft.status || "Кастинг",
        city: draft.city || "Москва",
        cover: coverFor(state.projects.length),
        logline: draft.logline,
        text: draft.text?.trim() || "",
        year: draft.year || "2026",
        shifts: draft.shifts,
        cdSlug,
        client: draft.client,
        budget: draft.budget,
        nature: draft.nature,
        pavilion: draft.pavilion,
        cdName: draft.cdName || cfg.name,
        shiftsDone: draft.shiftsDone,
        scenesDone: draft.scenesDone,
        spent: draft.spent,
        schedule: draft.schedule,
        financing: draft.financing,
        distribution: draft.distribution,
        partners: draft.partners,
      };
      update((prev) => ({ ...prev, projects: [project, ...prev.projects] }));
      flash("Проект создан");
      return slug;
    },
    [state.projects.length, cfg.name, cdSlug, flash, update],
  );

  const updateProject = useCallback(
    (projectSlug: string, patch: Partial<Project>) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.slug === projectSlug ? { ...p, ...patch } : p)),
      }));
      flash("Проект обновлён");
    },
    [flash, update],
  );

  const addCasting = useCallback(
    (draft: {
      projectSlug: string;
      title: string;
      roleLabel: string;
      text: string;
      deadline: string;
      age?: string;
    }) => {
      const project = findProject(state, draft.projectSlug);
      const slug = slugify(draft.title);
      const facts: [string, string][] = [
        ["Роль", draft.roleLabel],
        ["Проект", project?.title ?? ""],
        ["Дедлайн", draft.deadline],
      ];
      if (draft.age) facts.splice(1, 0, ["Возраст", draft.age]);
      const casting: Casting = {
        slug,
        projectSlug: draft.projectSlug,
        title: draft.title,
        roleLabel: draft.roleLabel,
        text: draft.text,
        meta: [project?.kind, project?.platform].filter(Boolean).join(" · ") || "Кастинг",
        deadline: draft.deadline,
        responses: 0,
        media: project?.cover || coverFor(state.castings.length),
        facts,
        cdSlug,
        cdName: cfg.name,
      };
      update((prev) => ({ ...prev, castings: [casting, ...prev.castings] }));
      flash("Кастинг опубликован");
      return slug;
    },
    [state, cfg.name, cdSlug, flash, update],
  );

  const addPost = useCallback(
    (text: string) => {
      update((prev) => ({
        ...prev,
        posts: [
          {
            id: `post-${Date.now().toString(36)}`,
            authorRole: role,
            authorName: cfg.name,
            authorAvatar: cfg.avatar,
            text,
            createdAt: Date.now(),
          },
          ...prev.posts,
        ],
      }));
      flash("Пост опубликован в ленте");
    },
    [role, cfg.name, cfg.avatar, flash, update],
  );

  const sendMessage = useCallback(
    (threadId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const msg: ChatLine = {
        id: `m-${Date.now().toString(36)}`,
        authorRole: role,
        text: trimmed,
        time: nowTime(),
        createdAt: Date.now(),
      };
      update((prev) => ({
        ...prev,
        threads: prev.threads.map((t) => {
          if (t.id !== threadId) return t;
          const others = t.roles.filter((r) => r !== role);
          return {
            ...t,
            unreadFor: Array.from(new Set([...t.unreadFor.filter((r) => r !== role), ...others])),
            messages: [...t.messages, msg],
          };
        }),
      }));
    },
    [role, update],
  );

  const markRead = useCallback(
    (threadId: string) => {
      update((prev) => {
        const t = prev.threads.find((x) => x.id === threadId);
        if (!t?.unreadFor.includes(role)) return prev;
        return {
          ...prev,
          threads: prev.threads.map((x) =>
            x.id === threadId ? { ...x, unreadFor: x.unreadFor.filter((r) => r !== role) } : x,
          ),
        };
      });
    },
    [role, update],
  );

  const toggleSaved = useCallback(
    (key: string) => {
      update((prev) => ({
        ...prev,
        saved: prev.saved.includes(key) ? prev.saved.filter((k) => k !== key) : [...prev.saved, key],
      }));
    },
    [update],
  );

  const setSettings = useCallback(
    (patch: Partial<WorkspaceState["settings"]>) => {
      update((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
    },
    [update],
  );

  const resetDemo = useCallback(() => {
    const seed = cloneSeed();
    saveWorkspace(seed);
    setState(seed);
    flash("Демо-данные сброшены");
  }, [flash]);

  const publishStatus = useCallback(
    (text: string, availability: import("@/lib/workspace").Availability) => {
      const slug = actorSlug;
      update((prev) => {
        const pulse = {
          id: `pulse-${slug}-${Date.now()}`,
          personSlug: slug,
          name: cfg.name,
          avatar: cfg.avatar,
          text,
          availability,
          updatedAt: Date.now(),
        };
        const rest = (prev.pulses || []).filter((p) => p.personSlug !== slug);
        return { ...prev, pulses: [pulse, ...rest] };
      });
      flash("Статус обновлён — виден CD и агентам");
    },
    [actorSlug, cfg.avatar, cfg.name, flash, update],
  );

  const saveProfilePatch = useCallback(
    (slug: string, patch: import("@/lib/workspace").ProfilePatch) => {
      update((prev) => ({
        ...prev,
        profilePatches: {
          ...(prev.profilePatches || {}),
          [slug]: { ...(prev.profilePatches || {})[slug], ...patch },
        },
      }));
      flash("Профиль обновлён");
    },
    [flash, update],
  );

  return {
    ready,
    notice,
    role,
    cfg,
    state,
    projects,
    castings,
    applications: state.applications,
    myApplications,
    posts: state.posts,
    pulses: state.pulses ?? [],
    profilePatches: state.profilePatches ?? {},
    threads,
    unread,
    saved: state.saved,
    settings: state.settings,
    getProject: (slug: string) => findProject(state, slug),
    getCasting: (slug: string) => findCasting(state, slug),
    castingsForProject: (slug: string) => castingsOfProject(state, slug),
    projectsForCd: (slug: string) => projectsOfCd(state, slug),
    castingsForCd: (slug: string) => castingsOfCd(state, slug),
    responseCount: (c: Casting) => responseCount(state, c),
    alreadyApplied: (castingSlug: string) =>
      state.applications.some(
        (a) => a.castingSlug === castingSlug && a.actorSlug === actorSlug && a.source === "actor",
      ),
    applyToCasting,
    proposeActor,
    setAppStatus,
    addProject,
    updateProject,
    addCasting,
    addPost,
    publishStatus,
    saveProfilePatch,
    sendMessage,
    markRead,
    toggleSaved,
    setSettings,
    resetDemo,
    flash,
  };
}

type WorkspaceApi = ReturnType<typeof useWorkspaceValue>;
const WorkspaceContext = createContext<WorkspaceApi | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const value = useWorkspaceValue();
  return createElement(WorkspaceContext.Provider, { value }, children);
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
