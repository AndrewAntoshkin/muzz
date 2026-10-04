"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FILE_KIND_MAX_BYTES, VIDEO_ACCEPT, formatFileSize, kindFromMime, parseFileKind } from "@/lib/file-kinds";
import { lastLine } from "@/lib/workspace";
import type { ApiThread } from "@/lib/chat-types";
import { withRole } from "@/lib/roles";
import { uploadUserFile, type UploadedFile } from "@/lib/upload-client";
import { useAuth } from "./AuthProvider";
import { useWorkspace } from "./useWorkspace";
import { useSearchParams } from "next/navigation";

type LayoutFile = {
  id: string;
  url: string;
  filename: string;
  mime: string;
  bytes: number;
  kind: string;
};

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

function useChatUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<UploadedFile | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(list: FileList | null) {
    const file = list?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    const kind = parseFileKind(kindFromMime(file.type, file.name));
    const max = FILE_KIND_MAX_BYTES[kind];
    if (file.size > max) {
      setError(`Максимум ${Math.round(max / (1024 * 1024))} МБ`);
      return;
    }
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      setPending(await uploadUserFile(file, kind, setProgress));
    } catch (err) {
      setPending(null);
      setError(err instanceof Error ? err.message : "Не загрузилось");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return {
    inputRef,
    pending,
    progress,
    busy,
    error,
    setError,
    onPick,
    clear: () => setPending(null),
  };
}

function MessageMedia({ file }: { file: LayoutFile }) {
  const video = file.kind === "video" || file.kind === "selftape" || file.mime.startsWith("video/");
  const image = file.kind === "photo" || file.mime.startsWith("image/");
  if (video) {
    return (
      <div className="msg-tape msg-tape--player">
        <video src={file.url} controls preload="metadata" playsInline />
        <div className="msg-tape__meta">
          <span className="msg-tape__title">{file.filename}</span>
          {file.bytes ? <span className="msg-tape__dur">{formatFileSize(file.bytes)}</span> : null}
        </div>
      </div>
    );
  }
  if (image) {
    return (
      <a className="msg-tape msg-tape--image" href={file.url} target="_blank" rel="noopener noreferrer">
        <img src={file.url} alt={file.filename} />
      </a>
    );
  }
  return (
    <a className="msg-tape msg-tape--file" href={file.url} target="_blank" rel="noopener noreferrer">
      <span className="msg-tape__icon" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
        </svg>
      </span>
      <span className="msg-tape__body">
        <span className="msg-tape__title">{file.filename}</span>
        {file.bytes ? <span className="msg-tape__dur">{formatFileSize(file.bytes)}</span> : null}
      </span>
    </a>
  );
}

function DemoMessenger() {
  const { role, threads, sendMessage, markRead } = useWorkspace();
  const searchParams = useSearchParams();
  const initialThread = searchParams.get("thread");
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(initialThread);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const attach = useChatUpload();

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
  const peer = active?.views[role];
  const unreadN = threads.filter((t) => t.unreadFor.includes(role)).length;

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

  async function send() {
    if (!active || attach.busy) return;
    if (!draft.trim() && !attach.pending) return;
    const pending = attach.pending;
    const text = draft;
    sendMessage(
      active.id,
      text,
      pending ? { title: pending.filename, href: pending.url } : undefined,
    );
    setDraft("");
    attach.clear();
    if (pending) {
      const slug = peer?.profileHref?.replace(/^\/people\//, "") || "";
      void fetch("/api/chat/send-file", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personSlug: slug, text, fileId: pending.id }),
      });
    }
  }

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
          preview: last?.tape ? `${last.tape.title}${last.tape.duration ? ` · ${last.tape.duration}` : ""}` : last?.text ?? "",
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
          tape: m.tape,
          file: m.tape?.href
            ? {
                id: m.id,
                url: m.tape.href,
                filename: m.tape.title,
                mime: "video/mp4",
                bytes: 0,
                kind: "video",
              }
            : null,
        })) ?? []
      }
      bodyRef={bodyRef}
      draft={draft}
      setDraft={setDraft}
      onSend={send}
      attach={attach}
      startInThread={Boolean(initialThread)}
      error={attach.error}
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
  const attach = useChatUpload();

  const latestRef = useRef(0);

  const load = async () => {
    const res = await fetch("/api/chat/threads", { credentials: "include" });
    const data = (await res.json()) as { threads?: ApiThread[]; latest?: number; error?: string };
    if (!res.ok) {
      setError(data.error || "Не удалось загрузить чаты");
      return;
    }
    latestRef.current = data.latest ?? 0;
    setThreads(data.threads || []);
    setError(null);
  };

  useEffect(() => {
    void load();
  }, []);

  // Почти-реальное время без WebSocket: дешёвый опрос раз в 15 с, пока вкладка открыта.
  // Полный список диалогов перезагружаем, только если на сервере что-то изменилось.
  useEffect(() => {
    let stopped = false;
    async function poll() {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/chat/poll", { credentials: "include", cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { latest?: number };
        if ((data.latest ?? 0) > latestRef.current) await load();
      } catch {
        /* сеть моргнула — попробуем в следующий раз */
      }
    }
    const timer = window.setInterval(poll, 15000);
    const onVisible = () => void poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((t) => {
      const last = t.messages[t.messages.length - 1];
      const hay = `${t.peer.name} ${t.peer.roleLabel} ${last?.text ?? last?.file?.filename ?? ""}`.toLowerCase();
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
    if (!active || attach.busy) return;
    if (!draft.trim() && !attach.pending) return;
    const text = draft;
    const fileId = attach.pending?.id;
    setDraft("");
    attach.clear();
    const res = await fetch(`/api/chat/threads/${active.id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fileId }),
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
    <MessengerLayout
      q={q}
      setQ={setQ}
      unreadN={threads.filter((t) => t.unread).length}
      list={filtered.map((t) => {
        const last = t.messages[t.messages.length - 1];
        return {
          id: t.id,
          name: t.peer.name,
          preview: last?.file?.filename || last?.text || "Нет сообщений",
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
          file: m.file || null,
        })) ?? []
      }
      bodyRef={bodyRef}
      draft={draft}
      setDraft={setDraft}
      onSend={() => void send()}
      attach={attach}
      emptyHint="Пока нет переписок. Напишите человеку с аккаунтом с его профиля."
      startInThread={Boolean(initialThread)}
      error={error || attach.error}
    />
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
  attach,
  emptyHint = "Нет переписок",
  startInThread = false,
  error,
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
  messages: {
    id: string;
    text: string;
    time: string;
    mine: boolean;
    card?: { title: string; meta: string; href: string };
    tape?: { title: string; duration?: string; href?: string };
    file?: LayoutFile | null;
  }[];
  bodyRef: React.RefObject<HTMLDivElement | null>;
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  attach: ReturnType<typeof useChatUpload>;
  emptyHint?: string;
  startInThread?: boolean;
  error?: string | null;
}) {
  const [mobileThread, setMobileThread] = useState(startInThread);
  const [listTab, setListTab] = useState<"all" | "unread">("all");
  const rows = list.filter((t): t is NonNullable<typeof t> => Boolean(t));
  const visible = listTab === "unread" ? rows.filter((t) => t.unread) : rows;
  const canSend = Boolean(draft.trim() || attach.pending) && !attach.busy;
  const inThread = Boolean(mobileThread && peer);

  useEffect(() => {
    if (inThread) document.body.setAttribute("data-msg-thread", "1");
    else document.body.removeAttribute("data-msg-thread");
    return () => document.body.removeAttribute("data-msg-thread");
  }, [inThread]);

  return (
    <div className={`msg-layout${inThread ? " is-thread" : ""}`}>
      {error ? <div className="kadr-toast">{error}</div> : null}
      <aside className="msg-list">
        <div className="msg-list__head">
          <div className="msg-list__tabs" role="tablist" aria-label="Фильтр чатов">
            <button
              type="button"
              role="tab"
              aria-selected={listTab === "all"}
              className={`msg-list__tab${listTab === "all" ? " is-on" : ""}`}
              onClick={() => setListTab("all")}
            >
              Все
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={listTab === "unread"}
              className={`msg-list__tab${listTab === "unread" ? " is-on" : ""}`}
              onClick={() => setListTab("unread")}
            >
              Непрочитанные{unreadN ? ` · ${unreadN}` : ""}
            </button>
          </div>
          <label className="msg-list__search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input type="search" placeholder="Поиск по чатам" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        <div className="msg-list__body">
          {visible.length === 0 ? (
            <p className="msg-list__empty">
              {listTab === "unread" ? "Нет непрочитанных" : emptyHint}
            </p>
          ) : null}
          {visible.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`msg-row${t.active ? " is-active" : ""}${t.unread ? " is-unread" : ""}`}
              onClick={() => {
                onSelect(t.id);
                setMobileThread(true);
              }}
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
          ))}
        </div>
      </aside>

      {peer ? (
        <section className="msg-thread">
          <div className="msg-thread__head">
            <button
              type="button"
              className="msg-thread__back"
              aria-label="К списку чатов"
              onClick={() => setMobileThread(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            {peer.profileHref ? (
              <Link href={withRole(peer.profileHref, role as "actor")} className="msg-thread__who">
                <Avatar src={peer.avatar} initials={peer.initials} bg={peer.bg} size={40} />
                <span className="msg-thread__who-text">
                  <span className="name">{peer.name}</span>
                  <span className="meta" title={peer.roleLabel}>
                    {peer.roleLabel}
                  </span>
                </span>
              </Link>
            ) : (
              <div className="msg-thread__who">
                <Avatar src={peer.avatar} initials={peer.initials} bg={peer.bg} size={40} />
                <div className="msg-thread__who-text">
                  <div className="name">{peer.name}</div>
                  <div className="meta" title={peer.roleLabel}>
                    {peer.roleLabel}
                  </div>
                </div>
              </div>
            )}
            <div className="actions">
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
                {m.file ? <MessageMedia file={m.file} /> : null}
                {!m.file && m.tape ? (
                  <div className="msg-tape" aria-label={`${m.tape.title}${m.tape.duration ? `, ${m.tape.duration}` : ""}`}>
                    <span className="msg-tape__icon" aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    <span className="msg-tape__body">
                      <span className="msg-tape__title">{m.tape.title}</span>
                      {m.tape.duration ? <span className="msg-tape__dur">{m.tape.duration}</span> : null}
                    </span>
                  </div>
                ) : null}
                {m.text ? (
                  <div className={m.mine ? "msg-bubble is-me" : "msg-bubble"}>
                    {m.text}
                    <div className="msg-bubble__time">{m.time}</div>
                  </div>
                ) : m.file ? (
                  <div className="msg-bubble__time msg-bubble__time--loose">{m.time}</div>
                ) : null}
              </div>
            ))}
          </div>

          <form
            className="msg-thread__compose"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSend) onSend();
            }}
          >
            <input
              ref={attach.inputRef}
              type="file"
              accept={`${VIDEO_ACCEPT},image/*,.pdf,.doc,.docx`}
              hidden
              onChange={(e) => void attach.onPick(e.target.files)}
            />
            <button
              type="button"
              className="msg-attach"
              aria-label="Добавить видео"
              disabled={attach.busy}
              onClick={() => attach.inputRef.current?.click()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <div className="msg-compose__main">
              {attach.busy ? (
                <div className="msg-attach__progress" role="status">
                  Загрузка {attach.progress ?? 0}%
                </div>
              ) : attach.pending ? (
                <div className="msg-attach__pending">
                  <span>{attach.pending.filename}</span>
                  <button type="button" onClick={attach.clear} aria-label="Убрать файл">
                    ×
                  </button>
                </div>
              ) : null}
              <textarea
                placeholder={attach.pending ? "Подпись к файлу…" : "Сообщение"}
                value={draft}
                rows={1}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (canSend) onSend();
                  }
                }}
              />
            </div>
            <button type="submit" className="btn-primary btn-sm msg-send" disabled={!canSend} aria-label="Отправить">
              <span className="msg-send__label">Отправить</span>
              <svg className="msg-send__icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
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
