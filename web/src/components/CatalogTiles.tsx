"use client";

import Link from "next/link";
import { ruCount } from "@/lib/labels";
import type { Casting, Project } from "@/lib/productions";
import { withRole, type RoleId } from "@/lib/roles";

function statusBadgeClass(status: string) {
  if (status === "Кастинг") return "casting-tile__badge casting-tile__badge--casting";
  if (status === "В производстве") return "casting-tile__badge casting-tile__badge--prod";
  if (status === "Постпродакшн") return "casting-tile__badge casting-tile__badge--post";
  if (status === "Релиз") return "casting-tile__badge casting-tile__badge--release";
  return "casting-tile__badge casting-tile__badge--stage";
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
  const cta =
    role === "agent" ? "Предложить" : role === "casting" ? "Открыть" : open.length ? "К кастингам" : "Открыть";

  return (
    <article className="casting-tile">
      <Link href={href} className="casting-tile__cover">
        <img src={p.cover} alt="" />
        {urgent ? <span className="casting-tile__badge casting-tile__badge--urgent">Срочно</span> : null}
        <span className={statusBadgeClass(p.status)}>{p.status}</span>
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
              ? open
                  .map((c) => c.roleLabel)
                  .slice(0, 2)
                  .join(" · ")
              : p.kind.split("·")[1]?.trim() || p.kind}
          </span>
          <Link href={href} className="btn-primary btn-sm">
            {cta}
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

  return (
    <article className="casting-tile">
      <Link href={cardHref} className="casting-tile__cover">
        <img src={c.media} alt="" />
        {c.urgent ? <span className="casting-tile__badge casting-tile__badge--urgent">Срочно</span> : null}
      </Link>

      <div className="casting-tile__body">
        <div className="casting-tile__tags">
          <span className="casting-tile__role">{c.roleLabel}</span>
          {fee ? <span className="casting-tile__fee">{fee}</span> : null}
        </div>

        <h2 className="casting-tile__title">
          <Link href={cardHref}>{c.title}</Link>
        </h2>

        <p className="casting-tile__project">{projectTitle ?? c.cdName}</p>
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
          <Link href={href} className="btn-primary btn-sm">
            {cta}
          </Link>
        </footer>
      </div>
    </article>
  );
}
