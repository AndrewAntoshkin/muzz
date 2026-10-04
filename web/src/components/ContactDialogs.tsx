"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { isDeadlinePast, formatDeadline } from "@/lib/deadline";
import { profileSlug, withRole } from "@/lib/roles";
import { useAuth } from "./AuthProvider";
import { useWorkspace } from "./useWorkspace";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="proj-settings-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="confirm-dialog contact-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirm-dialog__title">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Текст, который можно отправить человеку без аккаунта любым привычным способом. */
function inviteText(name?: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${name ? `${name}, ` : ""}зову вас в «Кадр» — платформу для кастингов, где отклики, проекты и переписка собраны в одном месте. Регистрация: ${origin}/auth`;
}

function InviteToKadr({ name }: { name?: string }) {
  const text = useMemo(() => inviteText(name), [name]);
  const [copied, setCopied] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Буфер недоступен (http, права) — выделяем текст, чтобы скопировать вручную.
      areaRef.current?.focus();
      areaRef.current?.select();
    }
  }

  return (
    <div className="contact-dialog__invite">
      <textarea ref={areaRef} className="contact-dialog__text" readOnly rows={4} value={text} onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className="btn-secondary" onClick={() => void copy()}>
        {copied ? "Скопировано" : "Скопировать приглашение"}
      </button>
    </div>
  );
}

/** Вместо тупика «нет аккаунта»: объясняем, что сообщение не дойдёт, и даём позвать человека в «Кадр». */
export function NoAccountDialog({ personName, onClose }: { personName?: string; onClose: () => void }) {
  return (
    <Modal title="У профиля пока нет аккаунта" onClose={onClose}>
      <div className="confirm-dialog__body">
        <p style={{ margin: "0 0 12px" }}>
          {personName ? `${personName} ещё не зарегистрирован` : "Этот человек ещё не зарегистрирован"} в «Кадре», поэтому сообщение
          здесь не дойдёт. Пришлите приглашение любым удобным способом — после регистрации можно будет писать в чате.
        </p>
        <InviteToKadr name={personName} />
      </div>
      <div className="confirm-dialog__actions">
        <button type="button" className="btn-primary" onClick={onClose}>
          Понятно
        </button>
      </div>
    </Modal>
  );
}

/** Приглашение актёра на один из открытых кастингов текущего кастинг-директора. */
export function InviteToCastingDialog({
  personSlug,
  personName,
  onClose,
}: {
  personSlug: string;
  personName?: string;
  onClose: () => void;
}) {
  const { cfg, role } = useAuth();
  const ws = useWorkspace();
  const mine = useMemo(
    () => ws.castingsForCd(profileSlug(cfg)).filter((c) => c.status !== "closed" && !isDeadlinePast(c.deadlineOn)),
    [ws, cfg],
  );
  const [slug, setSlug] = useState<string>(() => mine[0]?.slug ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [unreachable, setUnreachable] = useState(false);

  async function submit() {
    if (!slug || busy) return;
    setBusy(true);
    const res = await ws.inviteActor(slug, { slug: personSlug, name: personName || "Актёр", imageUrl: "" }, note.trim());
    setBusy(false);
    if (!res.ok) return; // ошибку уже показал toast
    if (res.notified) onClose();
    else setUnreachable(true);
  }

  if (unreachable) {
    return (
      <Modal title="Приглашение сохранено" onClose={onClose}>
        <div className="confirm-dialog__body">
          <p style={{ margin: "0 0 12px" }}>
            Приглашение сохранено в вашем кастинге, но уведомление не придёт: у этого профиля пока нет аккаунта в «Кадре».
            Отправьте приглашение в «Кадр» напрямую — так он сможет увидеть кастинг и ответить.
          </p>
          <InviteToKadr name={personName} />
        </div>
        <div className="confirm-dialog__actions">
          <button type="button" className="btn-primary" onClick={onClose}>
            Готово
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Пригласить${personName ? ` ${personName}` : ""} на кастинг`} onClose={onClose}>
      {mine.length ? (
        <>
          <div className="contact-dialog__list" role="radiogroup" aria-label="Кастинг">
            {mine.map((c) => (
              <label key={c.slug} className={`contact-dialog__option${slug === c.slug ? " is-active" : ""}`}>
                <input type="radio" name="casting" value={c.slug} checked={slug === c.slug} onChange={() => setSlug(c.slug)} />
                <span>
                  <strong>{c.title}</strong>
                  <em>
                    {c.roleLabel}
                    {c.deadlineOn ? ` · до ${formatDeadline(c.deadlineOn)}` : ""}
                  </em>
                </span>
              </label>
            ))}
          </div>
          <label className="kadr-field" style={{ marginTop: 12 }}>
            <span>Сообщение (необязательно)</span>
            <textarea
              rows={3}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Почему вы зовёте именно его"
            />
          </label>
        </>
      ) : (
        <div className="confirm-dialog__body">
          <p style={{ margin: 0 }}>
            Нет открытых кастингов, на которые можно позвать. Создайте новый или откройте набор в настройках существующего.
          </p>
        </div>
      )}
      <div className="confirm-dialog__actions">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
          Отмена
        </button>
        {mine.length ? (
          <button type="button" className="btn-primary" onClick={() => void submit()} disabled={busy || !slug}>
            {busy ? "Отправляем…" : "Пригласить"}
          </button>
        ) : (
          <Link href={withRole("/compose", role)} className="btn-primary" onClick={onClose}>
            Новый кастинг
          </Link>
        )}
      </div>
    </Modal>
  );
}
