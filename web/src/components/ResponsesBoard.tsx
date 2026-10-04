"use client";

import { ResponseActions } from "@/components/ResponseActions";
import Link from "next/link";
import { useEffect } from "react";
import {
  KIND_LABEL,
  STATUS_LABEL,
  type Application,
  type AppStatus,
} from "@/lib/workspace";
import { withRole, type RoleId } from "@/lib/roles";
import type { Casting, Project } from "@/lib/productions";

function statusTag(status: AppStatus) {
  if (status === "invited" || status === "shortlist") return "tag-green";
  if (status === "declined") return "tag-orange";
  return "tag-gray";
}

const TILE_STATUS: Record<AppStatus, string> = {
  sent: "Отправлено",
  shortlist: "Шорт-лист",
  invited: "Приглашение",
  declined: "Отклонено",
};

function fold(s: string) {
  return s.replace(/[«»""]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function covers(hay: string, bit: string) {
  const h = fold(hay);
  const b = fold(bit);
  return b.length >= 2 && h.includes(b);
}

function uniqueJoin(parts: (string | null | undefined)[]) {
  const out: string[] = [];
  for (const part of parts) {
    const v = part?.trim();
    if (!v) continue;
    if (out.some((x) => covers(x, v) || covers(v, x))) continue;
    out.push(v);
  }
  return out.join(" · ");
}

function tileCopy(
  item: Application,
  role: RoleId,
  from: "casting" | "all",
  casting?: Casting | null,
  project?: Project | null,
) {
  const kind = KIND_LABEL[item.kind];
  const castingTitle = casting?.title;
  const projectTitle = project?.title;
  const deadline = casting?.deadline ? `до ${casting.deadline}` : null;

  const title =
    role === "actor" ? (castingTitle ?? "Кастинг") : item.actorName;

  const subtitle =
    from === "casting"
      ? uniqueJoin([kind, item.actorMeta])
      : role === "actor"
        ? uniqueJoin([kind, projectTitle].filter((bit) => !covers(title, bit || "")))
        : uniqueJoin([kind, castingTitle, projectTitle]);

  const castingLines = [
    casting?.meta,
    role === "actor"
      ? uniqueJoin([
          casting?.cdName ? `Кастинг-директор · ${casting.cdName}` : null,
          deadline,
        ])
      : deadline,
  ].filter((line): line is string => Boolean(line));

  return { title, subtitle, castingLines };
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
        {tape.poster ? <img src={tape.poster} alt="" /> : <span className="response-tape__ph" />}
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
  if (tape.href && /^(https?:|blob:|data:|\/api\/)/.test(tape.href)) {
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
  onStatus: (status: AppStatus) => void | Promise<unknown>;
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
            <dd>{item.source === "agent" ? "Предложение агента" : item.source === "casting" ? "Приглашение от кастинга" : "Отклик актёра"}</dd>
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

          {role === "casting" ? <ResponseActions item={item} onStatus={onStatus} /> : null}
        </div>
      </div>
    </div>
  );
}

export function ResponseCards({
  rows,
  role,
  getCasting,
  getProject,
  from = "casting",
}: {
  rows: Application[];
  role: RoleId;
  getCasting: (slug: string) => Casting | null | undefined;
  getProject: (slug: string) => Project | null | undefined;
  from?: "casting" | "all";
}) {
  return (
    <div className="response-cards">
      {rows.map((item) => {
        const casting = getCasting(item.castingSlug);
        const project = casting ? getProject(casting.projectSlug) : undefined;
        const { title, subtitle, castingLines } = tileCopy(item, role, from, casting, project);
        const detailHref = withRole(
          from === "all" ? `/responses/${item.id}?from=all` : `/responses/${item.id}`,
          role,
        );

        return (
          <Link key={item.id} href={detailHref} className="response-tile">
            <span className="response-tile__head">
              <span className={`tag ${statusTag(item.status)}`}>{TILE_STATUS[item.status]}</span>
              {item.match ? <span className="response-tile__match">{item.match}</span> : null}
            </span>
            <span className="response-tile__person">
              {item.actorAvatar ? (
                <img src={item.actorAvatar} alt="" className="response-tile__ava" />
              ) : (
                <span className="response-tile__ava response-tile__ava--empty" />
              )}
              <span className="response-tile__who">
                <span className="response-tile__title">{title}</span>
                {subtitle ? <span className="response-tile__sub">{subtitle}</span> : null}
              </span>
            </span>
            {castingLines.length ? (
              <span className="response-tile__casting">
                {castingLines.map((line, i) => (
                  <span key={i} className="response-tile__casting-line">
                    {line}
                  </span>
                ))}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
