"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { withRole } from "@/lib/roles";
import { lastLine } from "@/lib/workspace";
import type { ApiThread } from "@/lib/chat-types";
import { useAuth } from "./AuthProvider";
import { useWorkspace } from "./useWorkspace";
import { useSearchParams } from "next/navigation";

function Avatar({
  src,
  initials,
  bg,
  size = 44,
}: {
  src?: string | null;
  initials?: string | null;
  bg?: string | null;
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

function DemoMessenger() {
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
    <MessengerLayout
      q={q}
      setQ={setQ}
      unreadN={unreadN}
      list={filtered.map((t) => {
        const p = t.views[role];
        const last = lastLine(t);
        if (!p) return null;
        return {
          id: t.id,
          name: p.name,
          preview: last?.text ?? "",
          time: last?.time ?? "",
          unread: t.unreadFor.includes(role),
          avatar: p.avatar,
          initials: p.initials,
          bg: p.bg,
          active: active?.id === t.id,
        };
      })}
      onSelect={setActiveId}
      peer={
        peer
          ? {
              name: peer.name,
              roleLabel: peer.roleLabel,
              avatar: peer.avatar,
              initials: peer.initials,
              bg: peer.bg,
              profileHref: peer.profileHref,
              extraHref: peer.extraHref,
              extraLabel: peer.extraLabel,
            }
          : null
      }
      role={role}
      messages={
        active?.messages.map((m) => ({
          id: m.id,
          text: m.text,
          time: m.time,
          mine: m.authorRole === role,
          card: m.card,
        })) ?? []
      }
      bodyRef={bodyRef}
      draft={draft}
      setDraft={setDraft}
      onSend={send}
    />
  );
}

function LiveMessenger({ initialThread }: { initialThread?: string | null }) {
  const { role } = useAuth();
  const [threads, setThreads] = useState<ApiThread[]>([]);
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(initialThread || null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res = await fetch("/api/chat/threads", { credentials: "include" });
    const data = (await res.json()) as { threads?: ApiThread[]; error?: string };
    if (!res.ok) {
      setError(data.error || "Не удалось загрузить чаты");
      return;
    }
    setThreads(data.threads || []);
    setError(null);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((t) => {
      const last = t.messages[t.messages.length - 1];
      const hay = `${t.peer.name} ${t.peer.roleLabel} ${last?.text ?? ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [threads, q]);

  const active = filtered.find((t) => t.id === activeId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (active && activeId !== active.id) setActiveId(active.id);
  }, [active, activeId]);

  useEffect(() => {
    if (!active) return;
    void fetch(`/api/chat/threads/${active.id}`, { method: "PATCH", credentials: "include" });
  }, [active?.id]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.id, active?.messages.length]);

  async function send() {
    if (!active || !draft.trim()) return;
    const text = draft;
    setDraft("");
    const res = await fetch(`/api/chat/threads/${active.id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Не отправилось");
      setDraft(text);
      return;
    }
    await load();
  }

  return (
    <>
      {error ? <div className="kadr-toast">{error}</div> : null}
      <MessengerLayout
        q={q}
        setQ={setQ}
        unreadN={threads.filter((t) => t.unread).length}
        list={filtered.map((t) => {
          const last = t.messages[t.messages.length - 1];
          return {
            id: t.id,
            name: t.peer.name,
            preview: last?.text ?? "Нет сообщений",
            time: last?.time ?? "",
            unread: t.unread,
            avatar: t.peer.avatar,
            initials: t.peer.initials,
            bg: t.peer.bg,
            active: active?.id === t.id,
          };
        })}
        onSelect={setActiveId}
        peer={
          active
            ? {
                name: active.peer.name,
                roleLabel: active.peer.roleLabel,
                avatar: active.peer.avatar,
                initials: active.peer.initials,
                bg: active.peer.bg,
                profileHref: active.peer.profileHref || undefined,
              }
            : null
        }
        role={role}
        messages={
          active?.messages.map((m) => ({
            id: m.id,
            text: m.text,
            time: m.time,
            mine: m.mine,
          })) ?? []
        }
        bodyRef={bodyRef}
        draft={draft}
        setDraft={setDraft}
        onSend={() => void send()}
        emptyHint="Пока нет переписок. Напишите человеку с аккаунтом с его профиля."
      />
    </>
  );
}

function MessengerLayout({
  q,
  setQ,
  unreadN,
  list,
  onSelect,
  peer,
  role,
  messages,
  bodyRef,
  draft,
  setDraft,
  onSend,
  emptyHint = "Нет переписок",
}: {
  q: string;
  setQ: (v: string) => void;
  unreadN: number;
  list: ({
    id: string;
    name: string;
    preview: string;
    time: string;
    unread: boolean;
    avatar?: string | null;
    initials?: string | null;
    bg?: string | null;
    active: boolean;
  } | null)[];
  onSelect: (id: string) => void;
  peer: {
    name: string;
    roleLabel: string;
    avatar?: string | null;
    initials?: string | null;
    bg?: string | null;
    profileHref?: string;
    extraHref?: string;
    extraLabel?: string;
  } | null;
  role: string;
  messages: { id: string; text: string; time: string; mine: boolean; card?: { title: string; meta: string; href: string } }[];
  bodyRef: React.RefObject<HTMLDivElement | null>;
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  emptyHint?: string;
}) {
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
            <input type="search" placeholder="Поиск по чатам" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        <div className="msg-list__body">
          {list.map((t) => {
            if (!t) return null;
            return (
              <button
                type="button"
                key={t.id}
                className={`msg-row${t.active ? " is-active" : ""}${t.unread ? " is-unread" : ""}`}
                onClick={() => onSelect(t.id)}
              >
                <Avatar src={t.avatar} initials={t.initials} bg={t.bg} />
                <span className="msg-row__main">
                  <span className="msg-row__name">{t.name}</span>
                  <span className="msg-row__preview">{t.preview}</span>
                </span>
                <span className="msg-row__meta">
                  <span className="msg-row__time">{t.time}</span>
                  {t.unread ? <span className="msg-row__badge" aria-label="непрочитано" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {peer ? (
        <section className="msg-thread">
          <div className="msg-thread__head">
            <Avatar src={peer.avatar} initials={peer.initials} bg={peer.bg} size={40} />
            <div className="msg-thread__who">
              <div className="name">{peer.name}</div>
              <div className="meta">{peer.roleLabel}</div>
            </div>
            <div className="actions">
              {peer.profileHref ? (
                <Link href={withRole(peer.profileHref, role as "actor")} className="btn-secondary btn-sm">
                  Профиль
                </Link>
              ) : null}
              {peer.extraHref ? (
                <Link href={withRole(peer.extraHref, role as "actor")} className="btn-secondary btn-sm">
                  {peer.extraLabel || "Открыть"}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="msg-thread__body" ref={bodyRef}>
            {messages.map((m) => (
              <div key={m.id} className={m.mine ? "msg-stack is-me" : "msg-stack"}>
                {m.card ? (
                  <div className="msg-card-inline">
                    <div className="label">Кастинг</div>
                    <div className="title">{m.card.title}</div>
                    <div className="sub">{m.card.meta}</div>
                    <Link href={withRole(m.card.href, role as "actor")} className="link-accent">
                      Открыть →
                    </Link>
                  </div>
                ) : null}
                <div className={m.mine ? "msg-bubble is-me" : "msg-bubble"}>
                  {m.text}
                  <div className="msg-bubble__time">{m.time}</div>
                </div>
              </div>
            ))}
          </div>

          <form
            className="msg-thread__compose"
            onSubmit={(e) => {
              e.preventDefault();
              onSend();
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
                  onSend();
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
            <p className="msg-thread__empty">{emptyHint}</p>
          </div>
        </section>
      )}
    </div>
  );
}

export function Messenger() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const thread = searchParams.get("thread");

  if (user && !user.isDemo) {
    return <LiveMessenger initialThread={thread} />;
  }
  return <DemoMessenger />;
}
