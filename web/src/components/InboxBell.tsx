"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { collectInbox, relTime, type InboxEvent } from "@/lib/inbox";
import { canUseAssistant, openPlanModal, parsePlan } from "@/lib/plans";
import { profileSlug, withRole } from "@/lib/roles";
import { DropdownMenu } from "./DropdownMenu";
import { IconBell } from "./icons";
import { useAuth } from "./AuthProvider";
import { useWorkspace } from "./useWorkspace";

function useInbox() {
  const { role, cfg } = useAuth();
  const { state, settings, ready, inboxSeenAt, markInboxSeen } = useWorkspace();
  const [highlight, setHighlight] = useState<Set<string>>(() => new Set());
  const meSlug = profileSlug(cfg);
  const plan = parsePlan(settings.plan);

  const events = useMemo(() => collectInbox(state, role, meSlug, plan), [state, role, meSlug, plan]);
  // «Прочитано» хранится на сервере как отметка времени, поэтому одинаково на всех устройствах.
  const unreadN = ready ? events.filter((e) => e.createdAt > inboxSeenAt).length : 0;

  const markSeen = useCallback(() => {
    if (!ready) return;
    setHighlight(new Set(events.filter((e) => e.createdAt > inboxSeenAt).map((e) => e.id)));
    if (unreadN > 0) void markInboxSeen();
  }, [events, inboxSeenAt, markInboxSeen, ready, unreadN]);

  return { role, plan, events, highlight, unreadN, markSeen, ready };
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
  const { role, plan, events, highlight, unreadN, markSeen, ready } = useInbox();
  const marked = useRef(false);

  // Отмечаем прочитанным один раз — когда раздел открыт и данные уже загружены.
  useEffect(() => {
    if (!ready || marked.current) return;
    marked.current = true;
    markSeen();
  }, [ready, markSeen]);

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
