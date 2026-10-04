"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { FaceCard } from "@/lib/people";
import type { Casting, Project } from "@/lib/productions";
import { apiFetch, ApiError } from "@/lib/api-client";
import { profileSlug } from "@/lib/roles";
import {
  allCastings,
  allProjects,
  castingsOfCd,
  castingsOfProject,
  findCasting,
  findProject,
  nowTime,
  projectsOfCd,
  responseCount,
  threadsFor,
  unreadCount,
  type AppKind,
  type AppStatus,
  type Application,
  type Availability,
  type CastingPin,
  type ChatLine,
  type ChatThread,
  type ProfilePatch,
  type RoleLayout,
  type WorkspaceSettings,
  type WorkspaceState,
} from "@/lib/workspace";
import { rehearsalMonthKey, rehearsalsUsed } from "@/lib/rehearsal";
import { useAuth } from "./AuthProvider";

const POLL_MS = 45_000;
const FOCUS_REFRESH_MIN_MS = 10_000;
const VIEW_AS = "x-kadr-as";

const DEFAULT_SETTINGS: WorkspaceSettings = {
  notifyEmail: true,
  notifyPush: false,
  plan: "pro",
  rehearsalsUsed: 0,
  rehearsalsMonth: "",
};

function emptyState(slug: string, role: WorkspaceState["me"]["role"]): WorkspaceState {
  return {
    me: { slug, role, demo: false },
    inboxSeenAt: 0,
    projects: [],
    castings: [],
    applications: [],
    posts: [],
    threads: [],
    saved: [],
    settings: DEFAULT_SETTINGS,
    pulses: [],
    profilePatches: {},
    boards: [],
    shortlist: [],
    roleLayout: [],
  };
}

const STATUS_FLASH: Record<AppStatus, string> = {
  sent: "Возвращено в «Отправлено»",
  shortlist: "Добавлен в шорт-лист",
  invited: "Приглашение отправлено",
  declined: "Отклонено",
};

/** JSON теряет undefined, а для сервера «поле очищено» — это null. */
function clearable<T extends object>(patch: T) {
  return Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v === undefined ? null : v]));
}

type PersonRef = Pick<FaceCard, "slug" | "name" | "imageUrl">;

export type CastingDraft = {
  projectSlug: string;
  title: string;
  roleLabel: string;
  text: string;
  /** Дата YYYY-MM-DD; пусто — без срока. */
  deadlineOn?: string | null;
  age?: string;
  urgent?: boolean;
};

export type ProjectDraft = Partial<Omit<Project, "slug" | "cdSlug">> & { title: string };

function useWorkspaceValue() {
  const { role, cfg, user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const fallbackSlug = profileSlug(cfg);

  const [state, setState] = useState<WorkspaceState>(() => emptyState(fallbackSlug, role));
  const stateRef = useRef(state);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  const viewKey = userId ? `${userId}:${role}` : null;
  const viewKeyRef = useRef(viewKey);
  const roleRef = useRef(role);
  // Свежие значения для колбэков и таймеров; обновляем до обычных эффектов, чтобы загрузка видела актуальный ключ.
  useLayoutEffect(() => {
    stateRef.current = state;
    viewKeyRef.current = viewKey;
    roleRef.current = role;
  });
  const inflight = useRef(0);
  const timers = useRef(new Map<string, { t: number; patch: Record<string, unknown> }>());
  /** Идёт ли наша собственная запись (запрос или отложенная правка): в это время чужой снимок не применяем. */
  const busy = useCallback(() => inflight.current > 0 || timers.current.size > 0, []);
  const lastFetch = useRef(0);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3200);
  }, []);

  const request = useCallback(
    <T,>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, body?: unknown) =>
      apiFetch<T>(method, url, body, { [VIEW_AS]: roleRef.current }),
    [],
  );

  /* ───────────── загрузка снимка ───────────── */

  const refresh = useCallback(
    async (opts?: { force?: boolean }) => {
      const key = viewKeyRef.current;
      if (!key) return;
      // Пока идут наши собственные мутации, чужой снимок не применяем — он перетрёт оптимистичное состояние.
      if (busy() && !opts?.force) return;
      lastFetch.current = Date.now();
      try {
        const snap = await request<WorkspaceState>("GET", "/api/workspace");
        if (viewKeyRef.current !== key) return;
        if (busy() && !opts?.force) return;
        setState(snap);
        stateRef.current = snap;
        setThreads((prev) => (snap.me.demo ? (prev.length ? prev : snap.threads) : []));
        setLoadError(null);
        setLoadedKey(key);
      } catch (err) {
        if (viewKeyRef.current !== key) return;
        const msg = err instanceof ApiError ? err.message : "Не удалось загрузить данные";
        setLoadError(msg);
        // Первую загрузку считаем завершённой, иначе страницы вечно показывают «загрузку»; повторить можно через refresh().
        setLoadedKey((prev) => prev ?? key);
      }
    },
    [request, busy],
  );

  /* eslint-disable react-hooks/set-state-in-effect -- смена пользователя/роли сбрасывает снимок и запускает загрузку */
  useEffect(() => {
    if (authLoading) return;
    if (!viewKey) {
      setLoadedKey(null);
      return;
    }
    setLoadedKey(null);
    setState(emptyState(fallbackSlug, role));
    setThreads([]);
    void refresh({ force: true });
    // fallbackSlug меняется вместе с viewKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey, authLoading]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!viewKey) return;
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onFocus = () => {
      if (Date.now() - lastFetch.current > FOCUS_REFRESH_MIN_MS) tick();
    };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [viewKey, refresh]);

  /* ───────────── помощники для мутаций ───────────── */

  const update = useCallback((fn: (prev: WorkspaceState) => WorkspaceState) => {
    const next = fn(stateRef.current);
    if (next === stateRef.current) return;
    stateRef.current = next;
    setState(next);
  }, []);

  /**
   * Выполнить серверную операцию, пока интерфейс уже показывает ожидаемый результат (optimistic).
   * При ошибке — понятное сообщение и перечитывание правды с сервера, а не молчаливая потеря.
   */
  const mutate = useCallback(
    async <T,>(op: () => Promise<T>, opts?: { onError?: (err: ApiError) => void }): Promise<T | null> => {
      inflight.current += 1;
      let failed = false;
      try {
        return await op();
      } catch (err) {
        failed = true;
        const e = err instanceof ApiError ? err : new ApiError(0, "Не удалось выполнить действие");
        flash(e.message);
        opts?.onError?.(e);
        return null;
      } finally {
        inflight.current -= 1;
        // После успеха берём ответ сервера как есть; после ошибки — перечитываем правду, чтобы не остаться с «призрачным» состоянием.
        if (failed && !busy()) void refresh();
      }
    },
    [flash, refresh, busy],
  );

  /** Группируем частые правки (перетаскивание, набор текста) в один запрос на ключ. */
  const debounced = useCallback(
    (key: string, patch: Record<string, unknown>, send: (merged: Record<string, unknown>) => Promise<unknown>) => {
      const prev = timers.current.get(key);
      if (prev) window.clearTimeout(prev.t);
      const merged = { ...(prev?.patch ?? {}), ...patch };
      const t = window.setTimeout(async () => {
        timers.current.delete(key);
        inflight.current += 1;
        let failed = false;
        try {
          await send(merged);
        } catch (err) {
          failed = true;
          flash(err instanceof ApiError ? err.message : "Не удалось сохранить");
        } finally {
          inflight.current -= 1;
        }
        if (failed && !busy()) void refresh();
      }, 350);
      timers.current.set(key, { t, patch: merged });
    },
    [flash, refresh, busy],
  );

  /* ───────────── производные ───────────── */

  const me = state.me;
  const mySlug = loadedKey === viewKey && viewKey ? me.slug : fallbackSlug;

  const projects = useMemo(() => allProjects(state), [state]);
  const castings = useMemo(() => allCastings(state), [state]);
  const threadList = useMemo(() => threadsFor({ ...state, threads }, role), [state, threads, role]);
  const unread = useMemo(() => unreadCount({ ...state, threads }, role), [state, threads, role]);

  const myApplications = useMemo(() => {
    if (role === "actor") return state.applications.filter((a) => a.actorSlug === mySlug);
    if (role === "agent") return state.applications.filter((a) => a.source === "agent");
    return state.applications;
  }, [state.applications, role, mySlug]);

  /* ───────────── отклики ───────────── */

  const applyToCasting = useCallback(
    async (castingSlug: string, kind: AppKind = "selftape", tape?: Application["tape"]) => {
      const casting = findCasting(stateRef.current, castingSlug);
      if (casting?.status === "closed") {
        flash("Набор на эту роль закрыт");
        return false;
      }
      const res = await mutate(() =>
        request<{ application: Application }>("POST", "/api/workspace/applications", {
          mode: "apply",
          castingSlug,
          kind: kind === "apply" ? "apply" : "selftape",
          note: kind === "selftape" ? "Самопроба отправлена из «Кадра»." : "",
          tape,
        }),
      );
      if (!res) return false;
      update((prev) => ({
        ...prev,
        applications: [res.application, ...prev.applications.filter((a) => a.id !== res.application.id)],
        castings: prev.castings.map((c) => (c.slug === castingSlug ? { ...c, responses: c.responses + 1 } : c)),
      }));
      flash(kind === "selftape" ? "Самопроба отправлена" : "Отклик отправлен");
      return true;
    },
    [flash, mutate, request, update],
  );

  const proposeActor = useCallback(
    async (castingSlug: string, person: PersonRef, note: string) => {
      const res = await mutate(() =>
        request<{ application: Application }>("POST", "/api/workspace/applications", {
          mode: "propose",
          castingSlug,
          actorSlug: person.slug,
          note,
        }),
      );
      if (!res) return false;
      update((prev) => ({
        ...prev,
        applications: [res.application, ...prev.applications],
        castings: prev.castings.map((c) => (c.slug === castingSlug ? { ...c, responses: c.responses + 1 } : c)),
      }));
      flash(`${person.name} предложен(а) на роль`);
      return true;
    },
    [flash, mutate, request, update],
  );

  /** Пригласить человека на кастинг. Честно сообщает, увидит ли он приглашение в «Кадре». */
  const inviteActor = useCallback(
    async (castingSlug: string, person: PersonRef, note = "") => {
      const res = await mutate(() =>
        request<{ application: Application; created: boolean; notified: boolean }>("POST", "/api/workspace/applications", {
          mode: "invite",
          castingSlug,
          actorSlug: person.slug,
          note,
        }),
      );
      if (!res) return { ok: false as const, notified: false };
      update((prev) => ({
        ...prev,
        applications: [res.application, ...prev.applications.filter((a) => a.id !== res.application.id)],
      }));
      flash(
        res.notified
          ? `${person.name} увидит приглашение в «Откликах»`
          : `Приглашение сохранено. У ${person.name} пока нет аккаунта в «Кадре» — свяжитесь напрямую`,
      );
      return { ok: true as const, notified: res.notified };
    },
    [flash, mutate, request, update],
  );

  const setAppStatus = useCallback(
    async (id: string, status: AppStatus) => {
      const before = stateRef.current.applications.find((a) => a.id === id);
      update((prev) => ({
        ...prev,
        applications: prev.applications.map((a) => (a.id === id ? { ...a, status } : a)),
      }));
      const res = await mutate(() =>
        request<{ application: Application; notified: boolean }>("PATCH", `/api/workspace/applications/${id}`, { status }),
      );
      if (!res) return false;
      update((prev) => ({
        ...prev,
        applications: prev.applications.map((a) => (a.id === id ? res.application : a)),
      }));
      if (status === "invited" && !res.notified) {
        flash(`Статус изменён. У ${before?.actorName ?? "актёра"} нет аккаунта в «Кадре» — уведомить его здесь не получится`);
      } else {
        flash(STATUS_FLASH[status]);
      }
      return true;
    },
    [flash, mutate, request, update],
  );

  const withdrawApplication = useCallback(
    async (id: string) => {
      const prev = stateRef.current.applications.find((a) => a.id === id);
      update((s) => ({ ...s, applications: s.applications.filter((a) => a.id !== id) }));
      const ok = await mutate(() => request("DELETE", `/api/workspace/applications/${id}`));
      if (ok) {
        if (prev) {
          update((s) => ({
            ...s,
            castings: s.castings.map((c) => (c.slug === prev.castingSlug ? { ...c, responses: Math.max(0, c.responses - 1) } : c)),
          }));
        }
        flash("Отклик отозван");
      }
      return Boolean(ok);
    },
    [flash, mutate, request, update],
  );

  /* ───────────── проекты и кастинги ───────────── */

  const addProject = useCallback(
    async (draft: ProjectDraft) => {
      const res = await mutate(() => request<{ project: Project }>("POST", "/api/workspace/projects", draft));
      if (!res) return null;
      update((prev) => ({ ...prev, projects: [res.project, ...prev.projects] }));
      flash("Проект создан");
      return res.project.slug;
    },
    [flash, mutate, request, update],
  );

  const updateProject = useCallback(
    async (projectSlug: string, patch: Partial<Project>) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.slug === projectSlug ? { ...p, ...patch } : p)),
      }));
      const res = await mutate(() => request<{ project: Project }>("PATCH", `/api/workspace/projects/${encodeURIComponent(projectSlug)}`, clearable(patch)));
      if (!res) return false;
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.slug === projectSlug ? res.project : p)),
      }));
      flash("Проект обновлён");
      return true;
    },
    [flash, mutate, request, update],
  );

  const archiveProject = useCallback(
    async (projectSlug: string) => {
      const ok = await mutate(() => request("DELETE", `/api/workspace/projects/${encodeURIComponent(projectSlug)}`));
      if (!ok) return false;
      update((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.slug !== projectSlug),
        castings: prev.castings.filter((c) => c.projectSlug !== projectSlug),
      }));
      flash("Проект перенесён в архив");
      return true;
    },
    [flash, mutate, request, update],
  );

  const addCasting = useCallback(
    async (draft: CastingDraft) => {
      const res = await mutate(() => request<{ casting: Casting }>("POST", "/api/workspace/castings", draft));
      if (!res) return null;
      update((prev) => ({ ...prev, castings: [res.casting, ...prev.castings] }));
      flash("Кастинг опубликован");
      return res.casting.slug;
    },
    [flash, mutate, request, update],
  );

  const updateCasting = useCallback(
    async (castingSlug: string, patch: Partial<Casting>, opts?: { quiet?: boolean }) => {
      // `deadline` — это подпись, считаемая сервером; менять срок можно только датой (`deadlineOn`).
      const { deadline: _label, responses: _count, ...body } = patch;
      void _label;
      void _count;
      update((prev) => ({
        ...prev,
        castings: prev.castings.map((c) => (c.slug === castingSlug ? { ...c, ...body } : c)),
      }));
      const res = await mutate(() => request<{ casting: Casting }>("PATCH", `/api/workspace/castings/${encodeURIComponent(castingSlug)}`, clearable(body)));
      if (!res) return false;
      update((prev) => ({
        ...prev,
        castings: prev.castings.map((c) => (c.slug === castingSlug ? res.casting : c)),
      }));
      if (!opts?.quiet) flash("Кастинг обновлён");
      return true;
    },
    [flash, mutate, request, update],
  );

  const closeCasting = useCallback(
    async (castingSlug: string) => {
      const ok = await updateCasting(castingSlug, { status: "closed" }, { quiet: true });
      if (ok) flash("Набор закрыт. Отклики сохранены, новых не будет");
      return ok;
    },
    [flash, updateCasting],
  );

  const reopenCasting = useCallback(
    async (castingSlug: string) => {
      const ok = await updateCasting(castingSlug, { status: "open" }, { quiet: true });
      if (ok) flash("Набор снова открыт");
      return ok;
    },
    [flash, updateCasting],
  );

  const archiveCasting = useCallback(
    async (castingSlug: string) => {
      const ok = await mutate(() => request("DELETE", `/api/workspace/castings/${encodeURIComponent(castingSlug)}`));
      if (!ok) return false;
      update((prev) => ({ ...prev, castings: prev.castings.filter((c) => c.slug !== castingSlug) }));
      flash("Кастинг перенесён в архив");
      return true;
    },
    [flash, mutate, request, update],
  );

  /* ───────────── лента, статус, профиль ───────────── */

  const addPost = useCallback(
    async (text: string) => {
      const res = await mutate(() =>
        request<{ post: { id: string; createdAt: number } }>("POST", "/api/workspace/posts", { text }),
      );
      if (!res) return false;
      update((prev) => ({
        ...prev,
        posts: [
          { id: res.post.id, authorRole: role, authorName: cfg.name, authorAvatar: cfg.avatar, text, createdAt: res.post.createdAt },
          ...prev.posts,
        ],
      }));
      flash("Пост опубликован в ленте");
      return true;
    },
    [cfg.avatar, cfg.name, flash, mutate, request, role, update],
  );

  const publishStatus = useCallback(
    async (text: string, availability: Availability) => {
      const res = await mutate(() =>
        request<{ pulse: { updatedAt: number } }>("PUT", "/api/workspace/pulse", { text, availability }),
      );
      if (!res) return false;
      update((prev) => {
        const pulse = {
          id: `pulse-${prev.me.slug}`,
          personSlug: prev.me.slug,
          name: cfg.name,
          avatar: cfg.avatar,
          text,
          availability,
          updatedAt: res.pulse.updatedAt,
        };
        return { ...prev, pulses: [pulse, ...prev.pulses.filter((p) => p.personSlug !== prev.me.slug)] };
      });
      flash("Статус обновлён — виден кастинг-директорам и агентам");
      return true;
    },
    [cfg.avatar, cfg.name, flash, mutate, request, update],
  );

  const saveProfilePatch = useCallback(
    async (slug: string, patch: ProfilePatch) => {
      const res = await mutate(() => request<{ patch: ProfilePatch; demo: boolean }>("PATCH", "/api/profile", patch));
      if (!res) return false;
      if (res.demo) {
        update((prev) => ({
          ...prev,
          profilePatches: { ...prev.profilePatches, [slug]: { ...prev.profilePatches[slug], ...res.patch } },
        }));
      }
      flash("Профиль обновлён");
      return true;
    },
    [flash, mutate, request, update],
  );

  /* ───────────── доска ───────────── */

  const addPin = useCallback(
    async (pin: Omit<CastingPin, "id" | "rotation"> & { rotation?: number }) => {
      if (stateRef.current.boards.some((p) => p.projectSlug === pin.projectSlug && p.actorSlug === pin.actorSlug)) return false;
      const tempId = `tmp-${Date.now().toString(36)}`;
      const optimistic: CastingPin = { ...pin, id: tempId, rotation: pin.rotation ?? 0 };
      update((prev) => ({ ...prev, boards: [...prev.boards, optimistic] }));
      const res = await mutate(
        () =>
          request<{ pin: CastingPin; created: boolean }>("POST", "/api/workspace/pins", {
            projectSlug: pin.projectSlug,
            actorSlug: pin.actorSlug,
            character: pin.character,
            x: pin.x,
            y: pin.y,
            chosen: pin.chosen,
          }),
        { onError: () => update((prev) => ({ ...prev, boards: prev.boards.filter((p) => p.id !== tempId) })) },
      );
      if (!res) return false;
      update((prev) => ({ ...prev, boards: prev.boards.map((p) => (p.id === tempId ? res.pin : p)) }));
      flash("На доске");
      return true;
    },
    [flash, mutate, request, update],
  );

  const removePin = useCallback(
    async (id: string) => {
      update((prev) => ({ ...prev, boards: prev.boards.filter((p) => p.id !== id) }));
      if (id.startsWith("tmp-")) return;
      await mutate(() => request("DELETE", `/api/workspace/pins/${id}`));
    },
    [mutate, request, update],
  );

  const clearPins = useCallback(
    async (projectSlug: string) => {
      update((prev) => ({ ...prev, boards: prev.boards.filter((p) => p.projectSlug !== projectSlug) }));
      await mutate(() => request("DELETE", `/api/workspace/pins?projectSlug=${encodeURIComponent(projectSlug)}`));
    },
    [mutate, request, update],
  );

  const updatePin = useCallback(
    (id: string, patch: Partial<Pick<CastingPin, "character" | "x" | "y" | "chosen">>) => {
      update((prev) => ({ ...prev, boards: prev.boards.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
      if (id.startsWith("tmp-")) return;
      debounced(`pin:${id}`, patch, (merged) => request("PATCH", `/api/workspace/pins/${id}`, merged));
    },
    [debounced, request, update],
  );

  const updateRoleLayout = useCallback(
    (projectSlug: string, castingSlug: string, pos: { x: number; y: number }) => {
      update((prev) => {
        const list = prev.roleLayout;
        const i = list.findIndex((r) => r.projectSlug === projectSlug && r.castingSlug === castingSlug);
        const next: RoleLayout = { projectSlug, castingSlug, ...pos };
        return { ...prev, roleLayout: i >= 0 ? list.map((r, idx) => (idx === i ? next : r)) : [...list, next] };
      });
      debounced(`layout:${projectSlug}:${castingSlug}`, pos, (merged) =>
        request("PUT", "/api/workspace/role-layout", { projectSlug, castingSlug, ...merged }),
      );
    },
    [debounced, request, update],
  );

  /* ───────────── избранное, шорт-лист, настройки ───────────── */

  const toggleSaved = useCallback(
    (key: string) => {
      const on = !stateRef.current.saved.includes(key);
      update((prev) => ({ ...prev, saved: on ? [key, ...prev.saved] : prev.saved.filter((k) => k !== key) }));
      void mutate(() => request("PUT", "/api/workspace/saved", { key, saved: on }));
    },
    [mutate, request, update],
  );

  const toggleShortlist = useCallback(
    async (person: PersonRef & { meta?: string }) => {
      const on = !stateRef.current.shortlist.some((p) => p.slug === person.slug);
      update((prev) => ({
        ...prev,
        shortlist: on
          ? [{ slug: person.slug, name: person.name, photo: person.imageUrl ?? "", meta: person.meta }, ...prev.shortlist]
          : prev.shortlist.filter((p) => p.slug !== person.slug),
      }));
      const ok = await mutate(() => request("PUT", "/api/workspace/shortlist", { personSlug: person.slug, on }));
      if (ok) flash(on ? `${person.name} в вашем шорт-листе` : `${person.name} убран из шорт-листа`);
      return on;
    },
    [flash, mutate, request, update],
  );

  const setSettings = useCallback(
    (patch: Partial<WorkspaceSettings>) => {
      update((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
      const { notifyEmail, notifyPush, plan } = patch;
      void mutate(() => request("PATCH", "/api/workspace/settings", { notifyEmail, notifyPush, plan }));
    },
    [mutate, request, update],
  );

  const bumpRehearsal = useCallback(async () => {
    const month = rehearsalMonthKey();
    update((prev) => ({
      ...prev,
      settings: { ...prev.settings, rehearsalsMonth: month, rehearsalsUsed: rehearsalsUsed(prev.settings) + 1 },
    }));
    const res = await mutate(() => request<{ settings: WorkspaceSettings }>("POST", "/api/workspace/settings/rehearsal"));
    if (res) update((prev) => ({ ...prev, settings: res.settings }));
    return Boolean(res);
  }, [mutate, request, update]);

  const markInboxSeen = useCallback(async () => {
    const now = Date.now();
    update((prev) => ({ ...prev, inboxSeenAt: now }));
    await mutate(() => request("POST", "/api/workspace/inbox-seen"));
  }, [mutate, request, update]);

  const resetDemo = useCallback(async () => {
    const ok = await mutate(() => request("POST", "/api/workspace/reset-demo"));
    if (!ok) return;
    setThreads([]);
    await refresh({ force: true });
    flash("Демо-данные сброшены");
  }, [flash, mutate, refresh, request]);

  /* ───────────── демо-чат (в памяти вкладки; настоящая переписка — /api/chat) ───────────── */

  const sendMessage = useCallback(
    (threadId: string, text: string, tape?: ChatLine["tape"]) => {
      const trimmed = text.trim();
      if (!trimmed && !tape) return;
      const msg: ChatLine = {
        id: `m-${Date.now().toString(36)}`,
        authorRole: role,
        text: trimmed,
        time: nowTime(),
        createdAt: Date.now(),
        tape,
      };
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          const others = t.roles.filter((r) => r !== role);
          return {
            ...t,
            unreadFor: Array.from(new Set([...t.unreadFor.filter((r) => r !== role), ...others])),
            messages: [...t.messages, msg],
          };
        }),
      );
    },
    [role],
  );

  const markRead = useCallback(
    (threadId: string) => {
      setThreads((prev) => {
        const t = prev.find((x) => x.id === threadId);
        if (!t?.unreadFor.includes(role)) return prev;
        return prev.map((x) => (x.id === threadId ? { ...x, unreadFor: x.unreadFor.filter((r) => r !== role) } : x));
      });
    },
    [role],
  );

  const ready = loadedKey !== null && loadedKey === viewKey;

  return {
    ready,
    loadError,
    refresh,
    notice,
    role,
    cfg,
    /** Чьими глазами смотрим: slug анкеты (или демо-персоны) и признак демо. */
    me: { slug: mySlug, role, demo: me.demo },
    state,
    projects,
    castings,
    applications: state.applications,
    myApplications,
    posts: state.posts,
    pulses: state.pulses,
    boards: state.boards,
    shortlist: state.shortlist,
    roleLayout: state.roleLayout,
    profilePatches: state.profilePatches,
    threads: threadList,
    unread,
    saved: state.saved,
    settings: state.settings,
    inboxSeenAt: state.inboxSeenAt,
    getProject: (slug: string) => findProject(state, slug),
    getCasting: (slug: string) => findCasting(state, slug),
    castingsForProject: (slug: string) => castingsOfProject(state, slug),
    projectsForCd: (slug: string) => projectsOfCd(state, slug),
    castingsForCd: (slug: string) => castingsOfCd(state, slug),
    responseCount: (c: Casting) => responseCount(state, c),
    isShortlisted: (personSlug: string) => state.shortlist.some((p) => p.slug === personSlug),
    alreadyApplied: (castingSlug: string) =>
      state.applications.some((a) => a.castingSlug === castingSlug && a.actorSlug === mySlug && a.source === "actor"),
    applyToCasting,
    proposeActor,
    inviteActor,
    setAppStatus,
    withdrawApplication,
    addProject,
    updateProject,
    archiveProject,
    addCasting,
    updateCasting,
    closeCasting,
    reopenCasting,
    archiveCasting,
    addPost,
    publishStatus,
    saveProfilePatch,
    addPin,
    removePin,
    clearPins,
    updatePin,
    updateRoleLayout,
    sendMessage,
    markRead,
    toggleSaved,
    toggleShortlist,
    setSettings,
    bumpRehearsal,
    markInboxSeen,
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
