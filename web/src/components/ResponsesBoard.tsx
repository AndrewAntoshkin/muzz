"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  KIND_LABEL,
  STATUS_LABEL,
  type Application,
  type AppStatus,
} from "@/lib/workspace";
import { withRole, type RoleId } from "@/lib/roles";

function statusTag(status: AppStatus) {
  if (status === "invited" || status === "shortlist") return "tag-green";
  if (status === "declined") return "tag-orange";
  return "tag-gray";
}

export function ResponseTape({
  tape,
  role,
}: {
  tape: NonNullable<Application["tape"]>;
  role?: RoleId;
}) {
  const inner = (
    <>
      <span className="response-tape__frame">
        <img src={tape.poster} alt="" />
        <span className="response-tape__play" aria-hidden>
          ▶
        </span>
        {tape.duration ? <span className="response-tape__dur">{tape.duration}</span> : null}
      </span>
      <span className="response-tape__meta">
        <strong>{tape.title}</strong>
        {tape.caption ? <em>{tape.caption}</em> : null}
      </span>
    </>
  );
  if (tape.href?.startsWith("http")) {
    return (
      <a className="response-tape" href={tape.href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  if (tape.href) {
    const href = role ? withRole(tape.href, role) : tape.href;
    return (
      <Link className="response-tape" href={href}>
        {inner}
      </Link>
    );
  }
  return <div className="response-tape">{inner}</div>;
}

export function ResponseDetailSheet({
  item,
  role,
  onClose,
  onStatus,
  castingTitle,
  castingSlug,
  projectTitle,
}: {
  item: Application;
  role: RoleId;
  onClose: () => void;
  onStatus: (status: AppStatus) => void;
  castingTitle?: string;
  castingSlug: string;
  projectTitle?: string;
}) {
  const created = new Date(item.createdAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="response-sheet" role="dialog" aria-modal="true" aria-labelledby="response-sheet-title">
      <button type="button" className="response-sheet__backdrop" aria-label="Закрыть" onClick={onClose} />
      <div className="response-sheet__panel">
        <header className="response-sheet__head">
          <div>
            <div className="response-sheet__eyebrow">{KIND_LABEL[item.kind]}</div>
            <h2 id="response-sheet-title" className="response-sheet__title">
              {role === "actor" ? castingTitle || "Отклик" : item.actorName}
            </h2>
          </div>
          <button type="button" className="btn-secondary btn-sm" onClick={onClose}>
            Закрыть
          </button>
        </header>

        <div className="response-sheet__body">
          <div className="response-sheet__hero">
            {item.actorAvatar ? (
              <img src={item.actorAvatar} alt="" className="response-sheet__ava" />
            ) : (
              <span className="response-sheet__ava response-sheet__ava--empty" />
            )}
            <div>
              <div className="response-sheet__name">{item.actorName}</div>
              <div className="response-sheet__when">{created}</div>
              {item.actorMeta ? <div className="response-sheet__when">{item.actorMeta}</div> : null}
            </div>
            <span className={`tag ${statusTag(item.status)}`}>{STATUS_LABEL[item.status]}</span>
          </div>

          {item.tape ? <ResponseTape tape={item.tape} role={role} /> : null}

          <dl className="detail-kv response-sheet__kv">
            <dt>Тип</dt>
            <dd>{KIND_LABEL[item.kind]}</dd>
            <dt>Источник</dt>
            <dd>{item.source === "agent" ? "Предложение агента" : "Отклик актёра"}</dd>
            {item.match ? (
              <>
                <dt>Совпадение</dt>
                <dd>{item.match}</dd>
              </>
            ) : null}
            {projectTitle ? (
              <>
                <dt>Проект</dt>
                <dd>{projectTitle}</dd>
              </>
            ) : null}
            {castingTitle ? (
              <>
                <dt>Кастинг</dt>
                <dd>{castingTitle}</dd>
              </>
            ) : null}
            <dt>Статус</dt>
            <dd>{STATUS_LABEL[item.status]}</dd>
          </dl>

          <section className="response-sheet__note">
            <h3>Комментарий</h3>
            <p>{item.note?.trim() ? item.note : "Без комментария"}</p>
          </section>

          <div className="response-sheet__links">
            <Link href={withRole(`/castings/${castingSlug}`, role)} className="btn-secondary">
              Открыть кастинг
            </Link>
            {role === "casting" ? (
              <Link href={withRole(`/castings/${castingSlug}/responses`, role)} className="btn-secondary">
                Все по кастингу
              </Link>
            ) : null}
            {role !== "actor" ? (
              <Link href={withRole(`/people/${item.actorSlug}`, role)} className="btn-primary">
                Профиль актёра
              </Link>
            ) : (
              <Link href={withRole("/messages", role)} className="btn-secondary">
                Сообщения
              </Link>
            )}
          </div>

          {role === "casting" && item.status !== "declined" ? (
            <div className="response-sheet__actions">
              {item.status !== "shortlist" ? (
                <button type="button" className="btn-secondary" onClick={() => onStatus("shortlist")}>
                  В шорт-лист
                </button>
              ) : null}
              {item.status !== "invited" ? (
                <button type="button" className="btn-primary" onClick={() => onStatus("invited")}>
                  Пригласить на очные
                </button>
              ) : null}
              <button type="button" className="btn-secondary" onClick={() => onStatus("declined")}>
                Отклонить
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ResponseCards({
  rows,
  role,
  getCastingTitle,
  getProjectTitle,
  from = "casting",
}: {
  rows: Application[];
  role: RoleId;
  getCastingTitle: (slug: string) => string | undefined;
  getProjectTitle: (castingSlug: string) => string | undefined;
  from?: "casting" | "all";
}) {
  return (
    <div className="response-cards">
      {rows.map((item) => {
        const castingTitle = getCastingTitle(item.castingSlug);
        const projectTitle = getProjectTitle(item.castingSlug);
        const title = role === "actor" ? castingTitle ?? "Кастинг" : item.actorName;
        const projectBit =
          projectTitle &&
          castingTitle &&
          !castingTitle.replace(/[«»]/g, "").includes(projectTitle.replace(/[«»]/g, ""))
            ? projectTitle
            : role === "actor"
              ? projectTitle
              : null;
        const subtitle =
          role === "actor"
            ? [projectBit, KIND_LABEL[item.kind]].filter(Boolean).join(" · ")
            : [castingTitle, projectBit, KIND_LABEL[item.kind]].filter(Boolean).join(" · ");
        const detailHref = withRole(
          from === "all" ? `/responses/${item.id}?from=all` : `/responses/${item.id}`,
          role,
        );

        return (
          <Link key={item.id} href={detailHref} className="response-tile">
            <span className="response-tile__top">
              {item.actorAvatar ? (
                <img src={item.actorAvatar} alt="" className="response-tile__ava" />
              ) : (
                <span className="response-tile__ava response-tile__ava--empty" />
              )}
              <span className="response-tile__who">
                <span className="response-tile__title">{title}</span>
                {subtitle ? <span className="response-tile__sub">{subtitle}</span> : null}
              </span>
              {item.match ? <span className="response-tile__match">{item.match}</span> : null}
            </span>
            {item.note ? <span className="response-tile__note">{item.note}</span> : null}
            <span className="response-tile__tags">
              <span className="response-tile__kind">{KIND_LABEL[item.kind]}</span>
              <span className={`tag ${statusTag(item.status)}`}>{STATUS_LABEL[item.status]}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
