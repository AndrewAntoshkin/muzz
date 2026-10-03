"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { castingCardTitle, ruCount } from "@/lib/labels";
import type { Casting, Project } from "@/lib/productions";
import { withRole, type RoleId } from "@/lib/roles";

export type CoverBadgeKind = "urgent" | "casting" | "prod" | "post" | "release" | "stage" | "closed";

export function statusKind(status: string): CoverBadgeKind {
  if (status === "Кастинг") return "casting";
  if (status === "В производстве") return "prod";
  if (status === "Постпродакшн") return "post";
  if (status === "Релиз") return "release";
  return "stage";
}

export function CoverBadge({ kind, children }: { kind: CoverBadgeKind; children: ReactNode }) {
  return (
    <span className={`casting-tile__badge casting-tile__badge--${kind}`}>
      <span className="casting-tile__badge-icon" aria-hidden="true">
        {kind === "urgent" ? <IconFlame /> : null}
        {kind === "casting" ? <IconClapper /> : null}
        {kind === "prod" ? <IconCamera /> : null}
        {kind === "post" ? <IconScissors /> : null}
        {kind === "release" ? <IconSparkle /> : null}
        {kind === "stage" ? <IconDot /> : null}
        {kind === "closed" ? <IconLock /> : null}
      </span>
      {children}
    </span>
  );
}

function IconFlame() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <path
        fill="currentColor"
        d="M8.15 1.2c.15 1.7-.25 3-1.2 4.4-.45.65-.7 1.35-.4 2.05.35 1 1.35 1.55 2.3 1.3.5-.15.9-.5 1.1-1 .5-1.15.25-2.45 0-3.7 1.9 1.25 3.75 3.35 3.75 6.2 0 3.05-2.4 5.45-5.7 5.45S2.3 13.5 2.3 10.45c0-2.7 1.5-4.75 2.8-6.1.25 1.4 1.05 2.4 2.05 2.85-.7-1.55-1.2-3.4-.4-6 .15-.5.7-1 1.4-1z"
      />
    </svg>
  );
}

function IconClapper() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="6.5" width="12" height="7.5" rx="1.4" />
      <path d="M2.5 6.5 4.2 3.2h9.2L12 6.5M5.2 3.6l.7 2.7M8.2 3.4l.4 2.9M11.1 3.5l-.3 2.8" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="9" r="3.1" />
      <path d="M3.2 6.2h1.3l.9-1.4h5.2l.9 1.4h1.3A1.3 1.3 0 0 1 14.1 7.5v5.2A1.3 1.3 0 0 1 12.8 14H3.2A1.3 1.3 0 0 1 1.9 12.7V7.5a1.3 1.3 0 0 1 1.3-1.3z" />
    </svg>
  );
}

function IconScissors() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="4.2" cy="4.4" r="1.8" />
      <circle cx="4.2" cy="11.6" r="1.8" />
      <path d="M5.6 5.6 14 13.2M5.6 10.4 14 2.8" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <path
        fill="currentColor"
        d="M8 1.4c.15 1.7.7 3.05 1.7 4.05 1 1 2.35 1.55 4.05 1.7-1.7.15-3.05.7-4.05 1.7-1 1-1.55 2.35-1.7 4.05-.15-1.7-.7-3.05-1.7-4.05-1-1-2.35-1.55-4.05-1.7 1.7-.15 3.05-.7 4.05-1.7 1-1 1.55-2.35 1.7-4.05z"
      />
    </svg>
  );
}

function IconDot() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <circle cx="8" cy="8" r="3.2" fill="currentColor" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.2" y="7.2" width="9.6" height="6.6" rx="1.4" />
      <path d="M5.2 7.2V5.4a2.8 2.8 0 0 1 5.6 0v1.8" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
      <path
        d="M3 8h8.5M8.5 4l4.5 4-4.5 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProjectTile({
  p,
  role,
  related,
}: {
  p: Project;
  role: RoleId;
  related: Casting[];
}) {
  const href = withRole(`/projects/${p.slug}`, role);
  const open = related.filter((c) => c.deadline !== "закрыт");
  const urgent = open.some((c) => c.urgent);
  const format = p.kind.split("·")[0]?.trim() || p.kind;

  return (
    <article className="casting-tile">
      <Link href={href} className="casting-tile__cover">
        <img src={p.cover} alt="" />
        {urgent ? <CoverBadge kind="urgent">Срочно</CoverBadge> : null}
        <CoverBadge kind={statusKind(p.status)}>{p.status}</CoverBadge>
      </Link>

      <div className="casting-tile__body">
        <div className="casting-tile__tags">
          <span className="casting-tile__role">{format}</span>
          <span className="casting-tile__fee">{p.platform}</span>
        </div>

        <h2 className="casting-tile__title">
          <Link href={href}>{p.title}</Link>
        </h2>

        <p className="casting-tile__project">{p.studio}</p>
        <p className="casting-tile__meta">
          {p.city}
          {p.budget ? ` · ${p.budget}` : ""}
          {p.year ? ` · ${p.year}` : ""}
        </p>

        {open.length ? (
          <div className="casting-tile__deadline">
            <span>Кастинги</span>
            <strong>{ruCount(open.length, "роль", "роли", "ролей")}</strong>
          </div>
        ) : (
          <div className="casting-tile__deadline">
            <span>Этап</span>
            <strong>{p.status}</strong>
          </div>
        )}

        <footer className="casting-tile__foot">
          <span className="casting-tile__responses">
            {open.length
              ? [...new Set(open.map((c) => c.roleLabel))].slice(0, 2).join(" · ")
              : p.kind.split("·")[1]?.trim() || p.kind}
          </span>
          <Link href={href} className="btn-primary casting-tile__go" aria-label="Открыть">
            <IconArrowRight />
          </Link>
        </footer>
      </div>
    </article>
  );
}

export function CastingTile({
  c,
  role,
  responses,
  projectTitle,
  projectStudio,
}: {
  c: Casting;
  role: RoleId;
  responses: number;
  projectTitle?: string;
  projectStudio?: string;
}) {
  const href =
    role === "casting"
      ? withRole(`/castings/${c.slug}/responses`, role)
      : role === "agent"
        ? withRole(`/compose?type=propose&casting=${c.slug}`, role)
        : withRole(`/castings/${c.slug}`, role);
  const cardHref = withRole(`/castings/${c.slug}`, role);
  const cta = role === "casting" ? "Отклики" : role === "agent" ? "Предложить" : "Откликнуться";
  const showResponses = role !== "actor";
  const fee = c.facts.find(([k]) => k === "Гонорар")?.[1];
  const displayTitle = castingCardTitle(c.title, c.roleLabel);
  const projectLine = projectTitle ?? c.cdName;
  const showProject = Boolean(projectLine) && projectLine !== displayTitle;

  return (
    <article className="casting-tile">
      <Link href={cardHref} className="casting-tile__cover">
        <img src={c.media} alt="" />
        {c.urgent ? <CoverBadge kind="urgent">Срочно</CoverBadge> : null}
        {!c.urgent && c.deadline === "закрыт" ? <CoverBadge kind="closed">Закрыт</CoverBadge> : null}
      </Link>

      <div className="casting-tile__body">
        <div className="casting-tile__tags">
          <span className="casting-tile__role">{c.roleLabel}</span>
          {fee ? <span className="casting-tile__fee">{fee}</span> : null}
        </div>

        <h2 className="casting-tile__title">
          <Link href={cardHref}>{displayTitle}</Link>
        </h2>

        {showProject ? <p className="casting-tile__project">{projectLine}</p> : null}
        <p className="casting-tile__meta">
          {projectStudio ? `${projectStudio} · ` : ""}
          {c.meta}
        </p>

        <div className="casting-tile__deadline">
          <span>Дедлайн</span>
          <strong>{c.deadline}</strong>
        </div>

        <footer className="casting-tile__foot">
          {showResponses ? (
            <span className="casting-tile__responses">{responses} откликов</span>
          ) : (
            <span className="casting-tile__responses casting-tile__responses--empty" aria-hidden="true" />
          )}
          {role === "actor" ? (
            <Link href={href} className="btn-primary casting-tile__go" aria-label="Откликнуться">
              <IconArrowRight />
            </Link>
          ) : (
            <Link href={href} className="btn-primary btn-sm">
              {cta}
            </Link>
          )}
        </footer>
      </div>
    </article>
  );
}
