"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { withRole } from "@/lib/roles";
import { lastLine } from "@/lib/workspace";
import { useWorkspace } from "./useWorkspace";

function Avatar({
  src,
  initials,
  bg,
  size = 44,
}: {
  src?: string;
  initials?: string;
  bg?: string;
  size?: number;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="msg-ava"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="msg-ava msg-ava--initials"
      style={{ width: size, height: size, background: bg || "#5C4A45", fontSize: size < 40 ? 11 : 13 }}
    >
      {initials || "·"}
    </span>
  );
}

export function Messenger() {
  const { role, threads, sendMessage, markRead } = useWorkspace();
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((t) => {
      const peer = t.views[role];
      const hay = `${peer?.name ?? ""} ${peer?.roleLabel ?? ""} ${lastLine(t)?.text ?? ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [threads, q, role]);

  const active = filtered.find((t) => t.id === activeId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (active && activeId !== active.id) setActiveId(active.id);
  }, [active, activeId]);

  useEffect(() => {
    if (active) markRead(active.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark on thread switch only
  }, [active?.id]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.id, active?.messages.length]);

  function send() {
    if (!active) return;
    sendMessage(active.id, draft);
    setDraft("");
  }

  const peer = active?.views[role];
  const unreadN = threads.filter((t) => t.unreadFor.includes(role)).length;

  return (
    <div className="msg-layout">
      <aside className="msg-list">
        <div className="msg-list__head">
          <div className="msg-list__title">{unreadN ? `Непрочитанных · ${unreadN}` : "Все чаты"}</div>
          <label className="msg-list__search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Поиск по чатам"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        </div>
        <div className="msg-list__body">
          {filtered.map((t) => {
            const p = t.views[role];
            const last = lastLine(t);
            const unread = t.unreadFor.includes(role);
            if (!p) return null;
            return (
              <button
                type="button"
                key={t.id}
                className={`msg-row${active?.id === t.id ? " is-active" : ""}${unread ? " is-unread" : ""}`}
                onClick={() => setActiveId(t.id)}
              >
                <Avatar src={p.avatar} initials={p.initials} bg={p.bg} />
                <span className="msg-row__main">
                  <span className="msg-row__name">{p.name}</span>
                  <span className="msg-row__preview">{last?.text ?? ""}</span>
                </span>
                <span className="msg-row__meta">
                  <span className="msg-row__time">{last?.time ?? ""}</span>
                  {unread ? <span className="msg-row__badge" aria-label="непрочитано" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {active && peer ? (
        <section className="msg-thread">
          <div className="msg-thread__head">
            <Avatar src={peer.avatar} initials={peer.initials} bg={peer.bg} size={40} />
            <div className="msg-thread__who">
              <div className="name">{peer.name}</div>
              <div className="meta">{peer.roleLabel}</div>
            </div>
            <div className="actions">
              {peer.profileHref ? (
                <Link href={withRole(peer.profileHref, role)} className="btn-secondary btn-sm">
                  Профиль
                </Link>
              ) : null}
              {peer.extraHref ? (
                <Link href={withRole(peer.extraHref, role)} className="btn-secondary btn-sm">
                  {peer.extraLabel || "Открыть"}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="msg-thread__body" ref={bodyRef}>
            {active.messages.map((m) => {
              const mine = m.authorRole === role;
              return (
                <div key={m.id} className={mine ? "msg-stack is-me" : "msg-stack"}>
                  {m.card ? (
                    <div className="msg-card-inline">
                      <div className="label">Кастинг</div>
                      <div className="title">{m.card.title}</div>
                      <div className="sub">{m.card.meta}</div>
                      <Link href={withRole(m.card.href, role)} className="link-accent">
                        Открыть →
                      </Link>
                    </div>
                  ) : null}
                  <div className={mine ? "msg-bubble is-me" : "msg-bubble"}>
                    {m.text}
                    <div className="msg-bubble__time">{m.time}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            className="msg-thread__compose"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              placeholder="Сообщение…"
              value={draft}
              rows={1}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button type="submit" className="btn-primary btn-sm" disabled={!draft.trim()}>
              Отправить
            </button>
          </form>
        </section>
      ) : (
        <section className="msg-thread">
          <div className="msg-thread__body">
            <p className="msg-thread__empty">Нет переписок</p>
          </div>
        </section>
      )}
    </div>
  );
}
