"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { profileSlug, withRole } from "@/lib/roles";
import { collectInbox, relTime } from "@/lib/inbox";
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

export function InboxBell() {
  const { role, cfg } = useAuth();
  const { state } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const [highlight, setHighlight] = useState<Set<string>>(() => new Set());
  const btnRef = useRef<HTMLButtonElement>(null);
  const meSlug = profileSlug(cfg);

  useLayoutEffect(() => {
    setSeen(loadSeen());
  }, []);

  const events = useMemo(() => collectInbox(state, role, meSlug), [state, role, meSlug]);
  const seenSet = useMemo(() => new Set(seen), [seen]);
  const unreadN = events.filter((e) => !seenSet.has(e.id)).length;

  const close = useCallback(() => setOpen(false), []);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const fresh = events.filter((e) => !seenSet.has(e.id)).map((e) => e.id);
    setHighlight(new Set(fresh));
    const ids = Array.from(new Set([...seen, ...events.map((e) => e.id)]));
    setSeen(ids);
    saveSeen(ids);
    setOpen(true);
  }

  const badge = unreadN > 9 ? "9+" : unreadN ? String(unreadN) : "";

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
        {events.length === 0 ? (
          <p className="ss-head__inbox-empty">
            Сюда придут сообщения, события по кастингам и обновления проектов, на которые вы подписались.
          </p>
        ) : (
          events.map((item) => (
            <Link
              key={item.id}
              href={withRole(item.href, role)}
              className={`ss-head__inbox-item${highlight.has(item.id) ? " is-new" : ""}`}
              data-kind={item.kind}
              role="menuitem"
              onClick={close}
            >
              <span className="ss-head__inbox-kind">{item.kindLabel}</span>
              <span className="ss-head__inbox-time">{item.timeLabel || relTime(item.createdAt)}</span>
              <strong className="ss-head__inbox-title">{item.title}</strong>
              <span className="ss-head__inbox-text">{item.text}</span>
            </Link>
          ))
        )}
      </DropdownMenu>
    </div>
  );
}
