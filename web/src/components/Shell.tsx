"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  IconBack,
  IconCasting,
  IconFaces,
  IconFolder,
  IconHome,
  IconProject,
  IconMessages,
  IconResponses,
  IconSettings,
} from "./icons";
import { ROLE_SWITCH, profileSlug, switchRoleHref, withRole, type RoleId } from "@/lib/roles";
import { useAuth } from "./AuthProvider";
import { useWorkspace } from "./useWorkspace";
import { DropdownMenu } from "./DropdownMenu";
import { ProjectSettingsModal } from "./ProjectSettingsModal";
import { StatusModal } from "./StatusModal";
import { ProfileEditModal } from "./ProfileEditModal";
import { VZMETNEV_CARD, DEMO_BIOS } from "@/lib/demo-profiles";

const NAV_ICONS: Record<string, ReactNode> = {
  home: <IconHome />,
  projects: <IconProject />,
  castings: <IconCasting />,
  responses: <IconResponses />,
  messages: <IconMessages />,
  roster: <IconFaces />,
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

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { role, cfg, user, logout } = useAuth();
  const { unread, notice, ready, profilePatches } = useWorkspace();
  const [publishOpen, setPublishOpen] = useState(false);
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const plusBtn = useRef<HTMLButtonElement>(null);
  const mine = searchParams.get("mine") === "1";
  const composeType = searchParams.get("type");

  const onHome = pathname === "/";
  const onSearchPage = pathname === "/search" || pathname.startsWith("/faces");
  const onProjects = pathname.startsWith("/projects");
  const onSearch = onSearchPage || (role === "actor" && onProjects);
  const onCastings = pathname.startsWith("/castings");
  const onMessages = pathname.startsWith("/messages");
  const onResponses = pathname.startsWith("/responses");
  const onSettings = pathname.startsWith("/settings");
  const onCompose = pathname.startsWith("/compose");
  const onProfile = pathname.startsWith("/people/");
  const castingDetail = /^\/castings\/[^/]+/.test(pathname);
  const projectDetail = /^\/projects\/[^/]+/.test(pathname);
  const projectSlug = projectDetail ? pathname.match(/^\/projects\/([^/]+)/)?.[1] : undefined;
  const backTo = backHref(pathname, role, { onHome, onProfile, castingDetail, projectDetail });
  const crumb = onProfile
    ? "Профиль"
    : onSettings
      ? "Настройки"
      : onCompose
        ? composeTitle(composeType)
        : onSearchPage
          ? mine
            ? "Мои актёры"
            : "Поиск"
          : onProjects
            ? cfg.nav.find((n) => n.id === "projects")?.label || "Проекты"
            : onCastings
              ? cfg.nav.find((n) => n.id === "castings")?.label || "Кастинги"
              : onMessages
                ? "Сообщения"
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
            : onCastings
              ? "castings"
              : onMessages
                ? "messages"
                : onResponses
                  ? "responses"
                  : onSettings
                    ? "settings"
                    : onCompose
                      ? "compose"
                      : onProfile
                        ? "profile"
                        : "page";
    document.body.setAttribute("data-page", page);
    document.body.setAttribute("data-layout", onHome ? "hub" : "");
    document.body.setAttribute("data-page-title", crumb);
    document.body.setAttribute("data-profession", role);
    document.body.setAttribute("data-user-name", cfg.name);
  }, [onHome, onSearchPage, onProjects, onProfile, onSettings, onCompose, crumb, role, cfg.name]);

  const activeNav = onHome
    ? "home"
    : onCastings
      ? "castings"
      : onMessages
        ? "messages"
        : onResponses
          ? "responses"
          : onSettings
            ? "settings"
            : onProjects && role !== "actor"
              ? "projects"
              : onSearchPage && mine
                ? "roster"
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
            <img src="/assets/logo.svg" alt="cadr" width={58} height={20} />
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
                active={activeNav === item.id || (item.id === "roster" && onSearchPage)}
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
          <Link
            href={withRole(cfg.profile, role)}
            className={onProfile && pathname === cfg.profile ? "sidebar-profile is-active" : "sidebar-profile"}
            data-nav="profile"
            onClick={() => setNavOpen(false)}
          >
            <span className="sidebar-profile__avatar">
              {cfg.avatar ? (
                <img src={cfg.avatar} alt="" width={44} height={44} />
              ) : (
                <span className="msg-ava msg-ava--initials" style={{ width: 44, height: 44 }}>
                  {(cfg.name || "?")
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "")
                    .join("")}
                </span>
              )}
            </span>
            <span className="sidebar-profile__body">
              <span className="sidebar-profile__name">{cfg.name}</span>
              <span className="sidebar-profile__role">{cfg.label}</span>
            </span>
          </Link>
          <NavRow
            href={withRole("/settings", role)}
            id="settings"
            label="Настройки"
            icon={<IconSettings />}
            live
            active={onSettings}
            onNavigate={() => setNavOpen(false)}
          />
          {user?.isDemo ? (
            <details className="sidebar-demo" open>
              <summary className="sidebar-demo__title">Войти как</summary>
              <div className="search-filter__chips">
                {ROLE_SWITCH.map(([key, label]) => (
                  <Link
                    key={key}
                    href={switchRoleHref(pathname, searchParams, key)}
                    className={key === role ? "search-chip is-on" : "search-chip"}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </details>
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
          {projectDetail && role === "casting" ? (
            <div className="app-topbar__publish-wrap">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setProjectSettingsOpen(true)}
                style={{ whiteSpace: "nowrap" }}
              >
                Настройки проекта
              </button>
            </div>
          ) : onCompose || onSettings ? null : (
            <div className={`app-topbar__publish-wrap${publishOpen ? " is-open" : ""}`} data-publish>
              <button
                ref={plusBtn}
                type="button"
                className="ss-head__plus"
                aria-label={role === "actor" ? "Статус и профиль" : "Опубликовать"}
                aria-expanded={publishOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setPublishOpen((v) => !v);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <DropdownMenu
                open={publishOpen}
                anchorRef={plusBtn}
                align="right"
                className="app-topbar__publish-menu"
                role="menu"
                onClose={() => setPublishOpen(false)}
              >
                {cfg.plus.map((p) =>
                  p.action === "status" ? (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setPublishOpen(false);
                        setStatusOpen(true);
                      }}
                    >
                      {p.label}
                    </button>
                  ) : p.action === "profile" ? (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setPublishOpen(false);
                        setProfileEditOpen(true);
                      }}
                    >
                      {p.label}
                    </button>
                  ) : p.href ? (
                    <Link key={p.label} href={withRole(p.href, role)} onClick={() => setPublishOpen(false)}>
                      {p.label}
                    </Link>
                  ) : (
                    <span key={p.label}>{p.label}</span>
                  ),
                )}
              </DropdownMenu>
            </div>
          )}
        </header>
        {children}
        {projectDetail && role === "casting" && projectSettingsOpen && ready && projectSlug ? (
          <ProjectSettingsModal projectSlug={projectSlug} onClose={() => setProjectSettingsOpen(false)} />
        ) : null}
        {statusOpen ? <StatusModal onClose={() => setStatusOpen(false)} /> : null}
        {profileEditOpen ? (
          <ProfileEditModal
            personSlug={profileSlug(cfg)}
            initial={profilePatches[profileSlug(cfg)] || {}}
            defaults={{
              bio: DEMO_BIOS.vzmetnev,
              city: cfg.city,
              params: VZMETNEV_CARD.params || [],
              appearance: VZMETNEV_CARD.appearance || [],
              languages: VZMETNEV_CARD.languages || [],
              skills: VZMETNEV_CARD.skills || [],
            }}
            onClose={() => setProfileEditOpen(false)}
          />
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
  flags: { onHome: boolean; onProfile: boolean; castingDetail: boolean; projectDetail: boolean },
) {
  if (flags.onHome) return null;
  if (flags.onProfile) {
    return role === "actor" ? withRole("/", role) : withRole("/search", role);
  }
  if (flags.castingDetail) return withRole("/castings", role);
  if (flags.projectDetail) {
    return role === "casting" ? withRole("/projects", role) : withRole("/", role);
  }
  return withRole("/", role);
}
