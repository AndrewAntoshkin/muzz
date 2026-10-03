"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { canSwitchKind, isAdmin } from "@/lib/access";
import { parsePlan } from "@/lib/plans";
import { withRole, type DemoRole, type RoleId } from "@/lib/roles";
import { useAuth } from "./AuthProvider";
import { InboxFeed } from "./InboxBell";
import { PlanBadge } from "./PlanBadge";
import { IconFolder, IconSettings } from "./icons";
import { ThemeToggle } from "./ThemeToggle";
import { useWorkspace } from "./useWorkspace";

export function AccountDrawer({
  open,
  onClose,
  role,
  cfg,
  onRoleChange,
  RoleSelect,
}: {
  open: boolean;
  onClose: () => void;
  role: RoleId;
  cfg: DemoRole;
  onRoleChange: (next: RoleId) => void;
  RoleSelect: (props: { role: RoleId; onChange: (next: RoleId) => void }) => ReactNode;
}) {
  const { user, logout } = useAuth();
  const { settings } = useWorkspace();
  const userPlan = parsePlan(settings.plan);
  const panelRef = useRef<HTMLElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      restoreRef.current?.focus();
      restoreRef.current = null;
      return;
    }
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (document.querySelector(".filter-chip__menu")) return;
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll<HTMLElement>("a, button, input, select, textarea")].filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const initials = (cfg.name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <aside
      ref={panelRef}
      className={`account-drawer${open ? " is-open" : ""}`}
      id="account-drawer"
      role="dialog"
      aria-modal={open}
      aria-label="Аккаунт"
      aria-hidden={!open}
      inert={!open ? true : undefined}
    >
      <header className="account-drawer__me">
        <Link href={withRole(cfg.profile, role)} className="account-drawer__profile" onClick={onClose}>
          {cfg.avatar ? (
            <img
              src={cfg.avatar}
              alt=""
              className={`ss-head__ava plan-ring plan-ring--${userPlan}`}
              width={48}
              height={48}
            />
          ) : (
            <span className={`ss-head__ava ss-head__ava--fallback plan-ring plan-ring--${userPlan}`}>{initials}</span>
          )}
          <span className="account-drawer__who">
            <strong>{cfg.name}</strong>
            <span>{cfg.label}</span>
          </span>
        </Link>
        {role === "actor" ? <PlanBadge /> : null}
      </header>

      <div className="account-drawer__scroll">
        <nav className="account-drawer__nav" aria-label="Аккаунт">
          <Link href={withRole(cfg.profile, role)} className="sidebar-item" onClick={onClose}>
            <span className="sidebar-item__label">Мой профиль</span>
          </Link>
          <Link href={withRole("/settings", role)} className="sidebar-item" onClick={onClose}>
            <IconSettings />
            <span className="sidebar-item__label">Настройки</span>
          </Link>
          {isAdmin(user) ? (
            <Link href="/admin" className="sidebar-item" onClick={onClose}>
              <span className="sidebar-item__label">Админка</span>
            </Link>
          ) : null}
        </nav>

        {open ? <InboxFeed onNavigate={onClose} /> : null}

        {cfg.block.length ? (
          <section className="account-drawer__section">
            <h2 className="account-drawer__title">{cfg.blockTitle}</h2>
            <nav className="account-drawer__nav">
              {cfg.block.map((item) => (
                <Link
                  key={item.name}
                  href={withRole(item.href, role)}
                  className="sidebar-item"
                  onClick={onClose}
                >
                  <IconFolder />
                  <span className="sidebar-item__label">{item.name}</span>
                </Link>
              ))}
            </nav>
          </section>
        ) : null}

        {cfg.recent.length ? (
          <section className="account-drawer__section">
            <h2 className="account-drawer__title">Недавно</h2>
            <nav className="account-drawer__nav">
              {cfg.recent.map((item) =>
                item.live ? (
                  <Link
                    key={item.label}
                    href={withRole(item.href, role)}
                    className="sidebar-item sidebar-item--quiet"
                    onClick={onClose}
                  >
                    <span className="sidebar-item__label">{item.label}</span>
                  </Link>
                ) : (
                  <span key={item.label} className="sidebar-item sidebar-item--quiet">
                    <span className="sidebar-item__label">{item.label}</span>
                  </span>
                ),
              )}
            </nav>
          </section>
        ) : null}
      </div>

      <div className="account-drawer__foot">
        <ThemeToggle />
        {canSwitchKind(user) ? (
          <RoleSelect
            role={role}
            onChange={(next) => {
              onClose();
              onRoleChange(next);
            }}
          />
        ) : null}
        <button type="button" className="sidebar-item sidebar-item--quiet" onClick={() => void logout()}>
          <span className="sidebar-item__label">{user?.isDemo ? "Выйти из демо" : "Выйти"}</span>
        </button>
      </div>
    </aside>
  );
}
