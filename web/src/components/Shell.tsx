"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
} from "./icons";
import { ROLE_SWITCH, switchRoleHref, withRole, type RoleId } from "@/lib/roles";
import { useAuth } from "./AuthProvider";
import { useWorkspace } from "./useWorkspace";
import { ProjectSettingsModal } from "./ProjectSettingsModal";
import { InboxBell } from "./InboxBell";
import { PlanBadge } from "./PlanBadge";
import { DropdownMenu } from "./DropdownMenu";

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
        aria-label="Роль демо"
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
  const { unread, notice, ready, applications } = useWorkspace();
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const mine = searchParams.get("mine") === "1";
  const agency = searchParams.get("agency");
  const composeType = searchParams.get("type");

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
  const castingDetail = /^\/castings\/[^/]+\/?$/.test(pathname);
  const projectDetail = /^\/projects\/[^/]+/.test(pathname);
  const projectSlug = projectDetail ? pathname.match(/^\/projects\/([^/]+)/)?.[1] : undefined;
  const responseId = onResponseDetail ? pathname.match(/^\/responses\/([^/]+)/)?.[1] : undefined;
  const responseApp = responseId ? applications.find((a) => a.id === responseId) : undefined;
  const fromAll = searchParams.get("from") === "all" || searchParams.get("via") === "all";
  const fromResponseId = searchParams.get("from") === "response" ? searchParams.get("app") : null;
  const backTo = backHref(pathname, role, {
    onHome,
    onProfile,
    onAgency,
    castingDetail,
    projectDetail,
    onCastingResponses,
    onResponseDetail,
    onResponsesList,
    responseCastingSlug: responseApp?.castingSlug,
    fromAll,
    fromResponseId,
  });
  const crumb = onAgency
    ? "Агентство"
    : onProfile
      ? "Профиль"
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
                        : "page";
    document.body.setAttribute("data-page", page);
    document.body.setAttribute("data-layout", onHome ? "hub" : "");
    document.body.setAttribute("data-page-title", crumb);
    document.body.setAttribute("data-profession", role);
    document.body.setAttribute("data-user-name", cfg.name);
  }, [
    onHome,
    onSearchPage,
    onProjects,
    onCastings,
    onCastingResponses,
    onResponseDetail,
    onResponsesList,
    onProfile,
    onAgency,
    onSettings,
    onCompose,
    crumb,
    role,
    cfg.name,
  ]);

  const inCastingTree = onCastings || (onResponseDetail && !fromAll);
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

  return (
    <div className={`app-frame${navOpen ? " is-nav-open" : ""}`}>
      <button
        type="button"
        className="nav-scrim"
        aria-label="Закрыть меню"
        hidden={!navOpen}
        onClick={() => setNavOpen(false)}
      />
      <aside className="sidebar-panel" id="app-sidebar">
        <div className="sidebar-head">
          <Link href={withRole("/", role)} className="sidebar-brand__link" aria-label="На главную" onClick={() => setNavOpen(false)}>
            <img src="/assets/logo.svg" alt="kadr" width={42} height={20} />
          </Link>
          <Link
            href={withRole("/search", role)}
            className={onSearch ? "sidebar-search is-active" : "sidebar-search"}
            onClick={() => setNavOpen(false)}
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
                onNavigate={() => setNavOpen(false)}
              />
            ))}
          </nav>

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
                  onNavigate={() => setNavOpen(false)}
                />
              ))}
            </nav>
          </section>

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
                  onNavigate={() => setNavOpen(false)}
                />
              ))}
            </nav>
          </section>
        </div>

        <div className="sidebar-foot">
          {user?.isDemo ? (
            <RoleSelect
              role={role}
              onChange={(next) => {
                setNavOpen(false);
                router.push(switchRoleHref(pathname, searchParams, next));
              }}
            />
          ) : (
            <button type="button" className="sidebar-item sidebar-item--quiet" onClick={() => void logout()}>
              <span className="sidebar-item__label">Выйти</span>
            </button>
          )}
          {user?.isDemo ? (
            <button type="button" className="sidebar-item sidebar-item--quiet" onClick={() => void logout()}>
              <span className="sidebar-item__label">Выйти из демо</span>
            </button>
          ) : null}
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar ss-head">
          <div className="ss-head__lead">
            <button
              type="button"
              className="ss-head__menu"
              aria-label="Меню"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            {backTo ? (
              <Link href={backTo} className="ss-head__back" aria-label="Назад">
                <IconBack />
              </Link>
            ) : null}
            <h1 className="ss-head__title" data-page-title-slot>
              {crumb}
            </h1>
          </div>
          <div className="ss-head__actions">
            {projectDetail && role === "casting" ? (
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setProjectSettingsOpen(true)}
              >
                Настройки проекта
              </button>
            ) : null}
            {role === "actor" ? <PlanBadge /> : null}
            <InboxBell />
            <Link href={withRole(cfg.profile, role)} className="ss-head__me" aria-label="Профиль">
              {cfg.avatar ? (
                <img src={cfg.avatar} alt="" className="ss-head__ava" width={36} height={36} />
              ) : (
                <span className="ss-head__ava ss-head__ava--fallback">
                  {(cfg.name || "?")
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "")
                    .join("")}
                </span>
              )}
            </Link>
          </div>
        </header>
        {children}
        {projectDetail && role === "casting" && projectSettingsOpen && ready && projectSlug ? (
          <ProjectSettingsModal projectSlug={projectSlug} onClose={() => setProjectSettingsOpen(false)} />
        ) : null}
        {notice ? <div className="kadr-toast">{notice}</div> : null}
      </div>
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
    onHome: boolean;
    onProfile: boolean;
    onAgency: boolean;
    castingDetail: boolean;
    projectDetail: boolean;
    onCastingResponses: boolean;
    onResponseDetail: boolean;
    onResponsesList: boolean;
    responseCastingSlug?: string;
    fromAll?: boolean;
    fromResponseId?: string | null;
  },
) {
  if (flags.onHome) return null;

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

  if (flags.onResponsesList) return withRole("/", role);

  if (flags.onProfile || flags.onAgency) {
    return role === "actor" ? withRole("/", role) : role === "casting" ? withRole("/faces", role) : withRole("/search", role);
  }

  if (flags.castingDetail) return withRole("/castings", role);

  if (flags.projectDetail) {
    return withRole("/projects", role);
  }

  if (pathname.startsWith("/settings") || pathname.startsWith("/compose") || pathname.startsWith("/messages")) {
    return withRole("/", role);
  }

  if (pathname === "/castings" || pathname === "/projects" || pathname === "/search" || pathname.startsWith("/faces")) {
    return withRole("/", role);
  }

  return withRole("/", role);
}
