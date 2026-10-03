"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { collectInbox, relTime, type InboxEvent } from "@/lib/inbox";
import { canUseAssistant, openPlanModal, parsePlan } from "@/lib/plans";
import { profileSlug, withRole } from "@/lib/roles";
import { DropdownMenu } from "./DropdownMenu";
import { IconBell } from "./icons";
import { useAuth } from "./AuthProvider";
import { useWorkspace } from "./useWorkspace";

const SEEN_KEY = "kadr-inbox-seen";

function loadSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-200)));
  } catch {
    /* ignore */
  }
}

function useInbox() {
  const { role, cfg } = useAuth();
  const { state, settings } = useWorkspace();
  const [seen, setSeen] = useState<string[]>([]);
  const [highlight, setHighlight] = useState<Set<string>>(() => new Set());
  const meSlug = profileSlug(cfg);
  const plan = parsePlan(settings.plan);

  useLayoutEffect(() => {
    setSeen(loadSeen());
  }, []);

  const events = useMemo(() => collectInbox(state, role, meSlug, plan), [state, role, meSlug, plan]);
  const seenSet = useMemo(() => new Set(seen), [seen]);
  const unreadN = events.filter((e) => !seenSet.has(e.id)).length;

  const markSeen = useCallback(() => {
    setSeen((prev) => {
      const seenSet = new Set(prev);
      const fresh = events.filter((e) => !seenSet.has(e.id)).map((e) => e.id);
      setHighlight(new Set(fresh));
      const ids = Array.from(new Set([...prev, ...events.map((e) => e.id)]));
      saveSeen(ids);
      return ids;
    });
  }, [events]);

  return { role, plan, events, highlight, unreadN, markSeen };
}

function InboxItems({
  events,
  highlight,
  role,
  plan,
  onNavigate,
  asMenu,
}: {
  events: InboxEvent[];
  highlight: Set<string>;
  role: ReturnType<typeof useAuth>["role"];
  plan: ReturnType<typeof parsePlan>;
  onNavigate?: () => void;
  asMenu?: boolean;
}) {
  function onItemClick(event: MouseEvent<HTMLAnchorElement>, item: InboxEvent) {
    if (item.kind === "assistant" && !canUseAssistant(plan)) {
      event.preventDefault();
      openPlanModal();
    }
    onNavigate?.();
  }

  if (events.length === 0) {
    return (
      <p className="ss-head__inbox-empty">
        Сюда придут сообщения, события по кастингам и обновления проектов, на которые вы подписались.
      </p>
    );
  }

  return events.map((item) => (
    <Link
      key={item.id}
      href={withRole(item.href, role)}
      className={`ss-head__inbox-item${highlight.has(item.id) ? " is-new" : ""}`}
      data-kind={item.kind}
      role={asMenu ? "menuitem" : undefined}
      onClick={(event) => onItemClick(event, item)}
    >
      <span className="ss-head__inbox-kind">{item.kindLabel}</span>
      <span className="ss-head__inbox-time">{item.timeLabel || relTime(item.createdAt)}</span>
      <strong className="ss-head__inbox-title">{item.title}</strong>
      <span className="ss-head__inbox-text">{item.text}</span>
    </Link>
  ));
}

export function InboxFeed({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { role, plan, events, highlight, unreadN, markSeen } = useInbox();

  useLayoutEffect(() => {
    markSeen();
    // mark once when the drawer section mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="account-drawer__section" aria-label="Уведомления">
      <h2 className="account-drawer__title">
        Уведомления{unreadN ? ` · ${unreadN}` : ""}
      </h2>
      <div className="account-drawer__inbox">
        <InboxItems events={events} highlight={highlight} role={role} plan={plan} onNavigate={onNavigate} />
      </div>
    </section>
  );
}

export function InboxBell() {
  const { role, plan, events, highlight, unreadN, markSeen } = useInbox();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const badge = unreadN > 9 ? "9+" : unreadN ? String(unreadN) : "";

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    markSeen();
    setOpen(true);
  }

  return (
    <div className="ss-head__inbox-wrap">
      <button
        ref={btnRef}
        type="button"
        className={`ss-head__bell${open ? " is-open" : ""}`}
        aria-label={unreadN ? `Уведомления, ${unreadN}` : "Уведомления"}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={toggle}
      >
        <IconBell />
        {badge ? <span className="ss-head__bell-dot">{badge}</span> : null}
      </button>
      <DropdownMenu
        open={open}
        anchorRef={btnRef}
        onClose={close}
        align="right"
        className="ss-head__inbox"
        role="menu"
      >
        <div className="ss-head__inbox-head">Уведомления</div>
        <InboxItems events={events} highlight={highlight} role={role} plan={plan} onNavigate={close} asMenu />
      </DropdownMenu>
    </div>
  );
}
