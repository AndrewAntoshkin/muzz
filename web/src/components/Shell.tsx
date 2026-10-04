"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  IconBack,
  IconCaret,
  IconCasting,
  IconFaces,
  IconFolder,
  IconHome,
  IconProject,
  IconMessages,
  IconResponses,
  IconSearch,
  IconSettings,
} from "./icons";
import { AccountDrawer } from "./AccountDrawer";
import { MobileTabBar } from "./MobileTabBar";
import { ROLE_SWITCH, switchRoleHref, withRole, type RoleId } from "@/lib/roles";
import { canSwitchKind, isAdmin } from "@/lib/access";
import { getEvent } from "@/lib/events";
import { parsePlan } from "@/lib/plans";
import { useAuth } from "./AuthProvider";
import { useWorkspace } from "./useWorkspace";
import { ProjectSettingsModal, parseSettingsTab } from "./ProjectSettingsModal";
import { CastingSettingsModal, parseCastingSettingsTab } from "./CastingSettingsModal";
import { InboxBell } from "./InboxBell";
import { PlanBadge } from "./PlanBadge";
import { PlanModal } from "./PlanModal";
import { DropdownMenu } from "./DropdownMenu";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ICONS: Record<string, ReactNode> = {
  home: <IconHome />,
  projects: <IconProject />,
  castings: <IconCasting />,
  responses: <IconResponses />,
  messages: <IconMessages />,
  roster: <IconFaces />,
  search: <IconFaces />,
  faces: <IconFaces />,
};

function NavRow({
  href,
  id,
  label,
  icon,
  count,
  active,
  quiet,
  live,
  onNavigate,
}: {
  href: string;
  id: string;
  label: string;
  icon?: ReactNode;
  count?: string;
  active?: boolean;
  quiet?: boolean;
  live?: boolean;
  onNavigate?: () => void;
}) {
  const cls = ["sidebar-item", active ? "is-active" : "", quiet ? "sidebar-item--quiet" : ""]
    .filter(Boolean)
    .join(" ");
  const inner = (
    <>
      {icon}
      <span className="sidebar-item__label">{label}</span>
      {count ? <span className="sidebar-item__count">{count}</span> : null}
    </>
  );
  if (live) {
    return (
      <Link href={href} className={cls} data-nav={id} onClick={onNavigate}>
        {inner}
      </Link>
    );
  }
  return (
    <span className={cls} data-nav={id} title="В следующих заходах">
      {inner}
    </span>
  );
}

function RoleSelect({
  role,
  onChange,
}: {
  role: RoleId;
  onChange: (next: RoleId) => void;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const current = ROLE_SWITCH.find(([key]) => key === role)?.[1] ?? "Актёр";

  return (
    <div className={`sidebar-demo${open ? " is-open" : ""}`}>
      <button
        ref={btn}
        type="button"
        className="sidebar-demo__select"
        aria-label="Вид пользователя"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{current}</span>
        <IconCaret />
      </button>
      <DropdownMenu
        open={open}
        anchorRef={btn}
        className="filter-chip__menu"
        matchWidth
        onClose={() => setOpen(false)}
      >
        {ROLE_SWITCH.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`filter-chip__opt${role === key ? " is-on" : ""}`}
            role="option"
            aria-selected={role === key}
            onClick={() => {
              setOpen(false);
              if (key !== role) onChange(key);
            }}
          >
            {label}
          </button>
        ))}
      </DropdownMenu>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role, cfg, user, logout } = useAuth();
  const { unread, notice, ready, applications, settings } = useWorkspace();
  const userPlan = parsePlan(settings.plan);
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [castingSettingsOpen, setCastingSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const closeAccount = useCallback(() => setAccountOpen(false), []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mine = searchParams.get("mine") === "1";
  const agency = searchParams.get("agency");
  const composeType = searchParams.get("type");
  const settingsQuery = searchParams.get("settings");
  const settingsTab = parseSettingsTab(settingsQuery);
  const castingSettingsTab = parseCastingSettingsTab(settingsQuery);

  const onHome = pathname === "/";
  const onFaces = pathname.startsWith("/faces");
  const onSearchRoute = pathname === "/search";
  const onSearchPage = onSearchRoute || onFaces;
  const onProjects = pathname.startsWith("/projects");
  const onGlobalSearch = onSearchRoute && !mine && !agency;
  const onSearch = onGlobalSearch;
  const onCastingResponses = /^\/castings\/[^/]+\/responses\/?$/.test(pathname);
  const onCastings = pathname.startsWith("/castings");
  const onMessages = pathname.startsWith("/messages");
  const onResponseDetail = /^\/responses\/[^/]+/.test(pathname);
  const onResponsesList = pathname === "/responses";
  const onResponses = onResponsesList || onResponseDetail || onCastingResponses;
  const onSettings = pathname.startsWith("/settings");
  const onCompose = pathname.startsWith("/compose");
  const onProfile = pathname.startsWith("/people/");
  const onAgency = pathname.startsWith("/agencies/");
  const onEvent = pathname.startsWith("/events/");
  const eventSlug = onEvent ? pathname.match(/^\/events\/([^/]+)/)?.[1] : undefined;
  const event = eventSlug ? getEvent(eventSlug) : undefined;
  const onProjectBoard = /^\/projects\/[^/]+\/board\/?$/.test(pathname);
  const castingDetail = /^\/castings\/[^/]+\/?$/.test(pathname);
  const projectDetail = /^\/projects\/[^/]+\/?$/.test(pathname);
  const projectSlug = pathname.match(/^\/projects\/([^/]+)/)?.[1];
  const castingSlug = castingDetail ? pathname.match(/^\/castings\/([^/]+)/)?.[1] : undefined;
  const responseId = onResponseDetail ? pathname.match(/^\/responses\/([^/]+)/)?.[1] : undefined;
  const responseApp = responseId ? applications.find((a) => a.id === responseId) : undefined;
  const fromAll = searchParams.get("from") === "all" || searchParams.get("via") === "all";
  const fromResponseId = searchParams.get("from") === "response" ? searchParams.get("app") : null;
  const backTo = backHref(pathname, role, {
    onProfile,
    onAgency,
    onEvent,
    castingDetail,
    projectDetail,
    onProjectBoard,
    onCastingResponses,
    onResponseDetail,
    responseCastingSlug: responseApp?.castingSlug,
    fromAll,
    fromResponseId,
    agencyId: agency,
  });
  const crumb = onAgency
    ? "Агентство"
    : onProfile
      ? "Профиль"
    : onEvent
      ? event?.shortTitle || "Мероприятие"
    : onSettings
      ? "Настройки"
      : onCompose
        ? composeTitle(composeType)
        : onFaces
          ? "База"
          : onSearchRoute
          ? mine
            ? "Мои актёры"
            : agency
              ? "Ростер"
              : "Поиск"
          : onProjectBoard
            ? "Доска"
            : onProjects
            ? cfg.nav.find((n) => n.id === "projects")?.label || "Проекты"
            : onCastingResponses
              ? "Отклики"
              : onCastings
                ? cfg.nav.find((n) => n.id === "castings")?.label || "Кастинги"
                : onMessages
                  ? "Сообщения"
                  : onResponseDetail
                    ? responseApp?.actorName || "Отклик"
                    : onResponses
                      ? cfg.nav.find((n) => n.id === "responses")?.label || "Мои отклики"
                      : "Главная";

  useEffect(() => {
    const page =
      onHome
        ? "home"
        : onSearchPage
          ? "search"
          : onProjectBoard
            ? "board"
          : onProjects
            ? "projects"
            : onCastingResponses || onResponseDetail || onResponsesList
              ? "responses"
              : onCastings
                ? "castings"
                : onMessages
                  ? "messages"
                  : onSettings
                    ? "settings"
                    : onCompose
                      ? "compose"
                      : onAgency
                        ? "agency"
                        : onProfile
                        ? "profile"
                        : onEvent
                          ? "event"
                        : "page";
    document.body.setAttribute("data-page", page);
    document.body.setAttribute("data-layout", onHome ? "hub" : onProjectBoard ? "board" : "");
    document.body.setAttribute("data-page-title", crumb);
    document.body.setAttribute("data-profession", role);
    document.body.setAttribute("data-user-name", cfg.name);
  }, [
    onHome,
    onSearchPage,
    onProjectBoard,
    onProjects,
    onCastings,
    onCastingResponses,
    onResponseDetail,
    onResponsesList,
    onProfile,
    onAgency,
    onEvent,
    onSettings,
    onCompose,
    crumb,
    role,
    cfg.name,
  ]);

  useEffect(() => {
    setSidebarCollapsed(onProjectBoard);
  }, [onProjectBoard]);

  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    const toggle = () => setSidebarCollapsed((v) => !v);
    window.addEventListener("kadr:toggle-sidebar", toggle);
    return () => window.removeEventListener("kadr:toggle-sidebar", toggle);
  }, []);

  const inCastingTree = onCastings;
  const activeNav = onHome
    ? "home"
    : inCastingTree
      ? "castings"
      : onResponses
        ? "responses"
        : onMessages
          ? "messages"
          : onSettings
            ? "settings"
            : onProjects
              ? "projects"
              : onSearchPage && mine
                ? "roster"
                : onFaces
                  ? "faces"
                  : "";
  const hideTabBar = onProjectBoard || onCompose;
  const messageUnread = unread ? (unread > 9 ? "9+" : String(unread)) : "";
  const initials = (cfg.name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const accountBtn = (
    <button
      type="button"
      className="ss-head__account"
      aria-label="Аккаунт"
      aria-expanded={accountOpen}
      aria-controls="account-drawer"
      onClick={() => setAccountOpen(true)}
    >
      {cfg.avatar ? (
        <img
          src={cfg.avatar}
          alt=""
          className={`ss-head__ava plan-ring plan-ring--${userPlan}`}
          width={32}
          height={32}
        />
      ) : (
        <span className={`ss-head__ava ss-head__ava--fallback plan-ring plan-ring--${userPlan}`}>{initials}</span>
      )}
    </button>
  );

  return (
    <div className={`app-frame${accountOpen ? " is-account-open" : ""}${hideTabBar ? " is-tabbar-hidden" : ""}${onProjectBoard ? " is-board" : ""}${onProjectBoard && sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
      <button
        type="button"
        className="nav-scrim"
        aria-label="Закрыть меню"
        hidden={!accountOpen}
        onClick={closeAccount}
      />
      <AccountDrawer
        open={accountOpen}
        onClose={closeAccount}
        role={role}
        cfg={cfg}
        onRoleChange={(next) => router.push(switchRoleHref(pathname, searchParams, next))}
        RoleSelect={RoleSelect}
      />
      <aside className="sidebar-panel" id="app-sidebar">
        <div className="sidebar-head">
          <Link href={withRole("/", role)} className="sidebar-brand__link" aria-label="На главную">
            <img src="/assets/logo.svg" alt="kadr" width={42} height={20} />
          </Link>
          <Link
            href={withRole("/search", role)}
            className={onSearch ? "sidebar-search is-active" : "sidebar-search"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            Поиск
          </Link>
        </div>

        <div className="sidebar-panel__scroll">
          <nav className="sidebar-nav" aria-label="Навигация">
            {cfg.nav.map((item) => (
              <NavRow
                key={item.id}
                href={withRole(item.href, role)}
                id={item.id}
                label={item.label}
                icon={NAV_ICONS[item.id]}
                count={item.id === "messages" ? (unread ? String(unread) : undefined) : item.count}
                active={activeNav === item.id}
                live={item.live}
              />
            ))}
          </nav>

          {cfg.block.length ? (
          <section className="sidebar-block">
            <h2 className="sidebar-block__title">{cfg.blockTitle}</h2>
            <nav className="sidebar-nav">
              {cfg.block.map((t, i) => (
                <NavRow
                  key={t.name}
                  href={withRole(t.href, role)}
                  id={`team-${i}`}
                  label={t.name}
                  icon={<IconFolder />}
                  live={t.live}
                  active={onAgency && t.href.startsWith("/agencies")}
                />
              ))}
            </nav>
          </section>
          ) : null}

          <section className="sidebar-block">
            <h2 className="sidebar-block__title">Недавно</h2>
            <nav className="sidebar-nav">
              {cfg.recent.map((item, i) => (
                <NavRow
                  key={item.label}
                  href={withRole(item.href, role)}
                  id={`recent-${i}`}
                  label={item.label}
                  quiet
                  live={item.live}
                />
              ))}
            </nav>
          </section>
        </div>

        <div className="sidebar-foot">
          {isAdmin(user) ? (
            <NavRow
              href="/admin"
              id="admin"
              label="Админка"
              quiet
              live
              active={pathname === "/admin" || pathname.startsWith("/admin/")}
            />
          ) : null}
          <ThemeToggle />
          {canSwitchKind(user) ? (
            <RoleSelect
              role={role}
              onChange={(next) => {
                router.push(switchRoleHref(pathname, searchParams, next));
              }}
            />
          ) : (
            <button type="button" className="sidebar-item sidebar-item--quiet" onClick={() => void logout()}>
              <span className="sidebar-item__label">Выйти</span>
            </button>
          )}
          {canSwitchKind(user) ? (
            <button type="button" className="sidebar-item sidebar-item--quiet" onClick={() => void logout()}>
              <span className="sidebar-item__label">{user?.isDemo ? "Выйти из демо" : "Выйти"}</span>
            </button>
          ) : null}
        </div>
      </aside>

      <div className="app-main" inert={accountOpen || undefined}>
        <header className="app-topbar ss-head">
          <div className="ss-head__lead">
            {backTo ? (
              <Link href={backTo} className="ss-head__back" aria-label="Назад">
                <IconBack />
              </Link>
            ) : (
              accountBtn
            )}
            <h1 className="ss-head__title" data-page-title-slot>
              {crumb}
            </h1>
          </div>
          <div className="ss-head__actions">
            {projectDetail && role === "casting" ? (
              <button
                type="button"
                className="ss-head__page-action"
                onClick={() => setProjectSettingsOpen(true)}
              >
                <span className="ss-head__page-action-label">Настройки проекта</span>
                <IconSettings />
              </button>
            ) : null}
            {castingDetail && role === "casting" ? (
              <button
                type="button"
                className="ss-head__page-action"
                onClick={() => setCastingSettingsOpen(true)}
              >
                <span className="ss-head__page-action-label">Настройки кастинга</span>
                <IconSettings />
              </button>
            ) : null}
            {role === "actor" ? <PlanBadge /> : null}
            <InboxBell />
            <Link
              href={withRole("/search", role)}
              className={`ss-head__icon${onSearch ? " is-active" : ""}`}
              aria-label="Поиск"
            >
              <IconSearch />
            </Link>
            <Link
              href={withRole("/messages", role)}
              className={`ss-head__icon${onMessages ? " is-active" : ""}`}
              aria-label={messageUnread ? `Сообщения, ${messageUnread}` : "Сообщения"}
            >
              <IconMessages />
              {messageUnread ? <span className="ss-head__bell-dot">{messageUnread}</span> : null}
            </Link>
            {backTo ? accountBtn : null}
            <Link href={withRole(cfg.profile, role)} className="ss-head__me" aria-label="Профиль">
              {cfg.avatar ? (
                <img
                  src={cfg.avatar}
                  alt=""
                  className={`ss-head__ava plan-ring plan-ring--${userPlan}`}
                  width={36}
                  height={36}
                />
              ) : (
                <span className={`ss-head__ava ss-head__ava--fallback plan-ring plan-ring--${userPlan}`}>{initials}</span>
              )}
            </Link>
          </div>
        </header>
        {children}
        {projectDetail && role === "casting" && (projectSettingsOpen || settingsTab) && ready && projectSlug ? (
          <ProjectSettingsModal
            projectSlug={projectSlug}
            initialTab={settingsTab}
            onClose={() => {
              setProjectSettingsOpen(false);
              if (searchParams.has("settings")) {
                const next = new URLSearchParams(searchParams.toString());
                next.delete("settings");
                const q = next.toString();
                router.replace(q ? `${pathname}?${q}` : pathname);
              }
            }}
          />
        ) : null}
        {castingDetail && role === "casting" && (castingSettingsOpen || castingSettingsTab) && ready && castingSlug ? (
          <CastingSettingsModal
            castingSlug={castingSlug}
            initialTab={castingSettingsTab}
            onClose={() => {
              setCastingSettingsOpen(false);
              if (searchParams.has("settings")) {
                const next = new URLSearchParams(searchParams.toString());
                next.delete("settings");
                const q = next.toString();
                router.replace(q ? `${pathname}?${q}` : pathname);
              }
            }}
          />
        ) : null}
        <PlanModal />
        {notice ? <div className="kadr-toast">{notice}</div> : null}
      </div>
      <MobileTabBar cfg={cfg} role={role} activeId={activeNav} hidden={hideTabBar} inert={accountOpen} />
    </div>
  );
}

function composeTitle(type: string | null) {
  if (type === "project") return "Новый проект";
  if (type === "casting") return "Новый кастинг";
  if (type === "propose") return "Предложить актёра";
  if (type === "post") return "Пост в ленту";
  return "Опубликовать";
}

function backHref(
  pathname: string,
  role: RoleId,
  flags: {
    onProfile: boolean;
    onAgency: boolean;
    onEvent: boolean;
    castingDetail: boolean;
    projectDetail: boolean;
    onProjectBoard?: boolean;
    onCastingResponses: boolean;
    onResponseDetail: boolean;
    responseCastingSlug?: string;
    fromAll?: boolean;
    fromResponseId?: string | null;
    agencyId?: string | null;
  },
) {
  if (flags.onProfile && flags.fromResponseId) {
    const q = flags.fromAll ? `?from=all` : "";
    return withRole(`/responses/${flags.fromResponseId}${q}`, role);
  }

  if (flags.onResponseDetail) {
    if (flags.fromAll || !flags.responseCastingSlug) return withRole("/responses", role);
    return withRole(`/castings/${flags.responseCastingSlug}/responses`, role);
  }

  if (flags.onCastingResponses) {
    const slug = pathname.match(/^\/castings\/([^/]+)/)?.[1];
    return slug ? withRole(`/castings/${slug}`, role) : withRole("/castings", role);
  }

  if (flags.onProfile || flags.onAgency) {
    return role === "actor" ? withRole("/", role) : role === "casting" ? withRole("/faces", role) : withRole("/search", role);
  }

  if (flags.onEvent) return withRole("/", role);

  if (flags.onProjectBoard) {
    const slug = pathname.match(/^\/projects\/([^/]+)/)?.[1];
    return slug ? withRole(`/projects/${slug}`, role) : withRole("/projects", role);
  }

  if (flags.castingDetail) return withRole("/castings", role);

  if (flags.projectDetail) return withRole("/projects", role);

  if (pathname.startsWith("/settings") || pathname.startsWith("/compose")) {
    return withRole("/", role);
  }

  if (pathname === "/search" && flags.agencyId) {
    return withRole(`/agencies/${flags.agencyId}`, role);
  }

  return null;
}
