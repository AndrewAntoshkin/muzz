"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FacesCatalog } from "@/components/FacesCatalog";
import { useDemoRole } from "@/components/useDemoRole";
import { useWorkspace } from "@/components/useWorkspace";
import type { FaceCard } from "@/lib/people";
import type { Casting, Project } from "@/lib/productions";
import { withRole } from "@/lib/roles";

type Tab = "all" | "projects" | "castings";

function plural(n: number, one: string, few: string, many: string) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

function matchesQuery(hay: string, query: string) {
  if (!query) return true;
  return hay.toLowerCase().includes(query);
}

function projectHay(p: Project) {
  return `${p.title} ${p.studio} ${p.platform} ${p.kind} ${p.status} ${p.city} ${p.logline}`;
}

function castingHay(c: Casting, project: Project | null) {
  return `${c.title} ${c.roleLabel} ${c.text} ${c.meta} ${c.cdName} ${project?.title ?? ""} ${project?.studio ?? ""} ${project?.platform ?? ""}`;
}

export function SearchSwitch({
  people,
  initialProfession = "",
  mine = false,
}: {
  people: FaceCard[];
  initialProfession?: string;
  mine?: boolean;
}) {
  const { role } = useDemoRole();
  if (role === "actor") return <ProductionSearch />;
  const roster = people.filter(
    (p) => p.agencyId === "akter1" && (p.profession === "actor" || p.profession === "actress"),
  );
  const list = role === "agent" && mine ? roster : people;
  return (
    <FacesCatalog
      people={list}
      initialProfession={initialProfession}
      title={mine ? "Мои актёры" : "Поиск"}
      lead={
        mine
          ? "Ростер агентства «Актёр 1»."
          : role === "agent"
            ? "Вся база. Ростер — в «Мои актёры»."
            : "Все люди в «Кадре»: актёры, кастинг-директора и агенты."
      }
    />
  );
}

export function ProductionSearch() {
  const { role } = useDemoRole();
  const { projects, castings, getProject, castingsForProject, responseCount } = useWorkspace();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  const query = q.trim().toLowerCase();

  const matchedProjects = useMemo(
    () => projects.filter((p) => matchesQuery(projectHay(p), query)),
    [query, projects],
  );
  const matchedCastings = useMemo(
    () =>
      castings.filter((c) => matchesQuery(castingHay(c, getProject(c.projectSlug)), query)),
    [query, castings, getProject],
  );

  const visibleProjects = tab === "castings" ? [] : matchedProjects;
  const visibleCastings = tab === "projects" ? [] : matchedCastings;
  const empty = visibleProjects.length + visibleCastings.length === 0;

  return (
    <div className="page-scroll catalog-page" id="production-search">
      <p className="catalog-page__lead catalog-page__lead--solo">Проекты в производстве и открытые кастинги</p>

      <div className="catalog-stats" aria-label="Сводка">
        <div className="catalog-stat">
          <strong>{matchedProjects.length}</strong>
          <span>{plural(matchedProjects.length, "проект", "проекта", "проектов")}</span>
          <em>в производстве</em>
        </div>
        <div className="catalog-stat">
          <strong>{matchedCastings.length}</strong>
          <span>
            {plural(
              matchedCastings.length,
              "открытый кастинг",
              "открытых кастинга",
              "открытых кастингов",
            )}
          </span>
          <em>ждут отклика</em>
        </div>
      </div>

      <label className="catalog-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          aria-label="Поиск проектов и кастингов"
          placeholder="Название, студия, платформа или роль…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="catalog-search__count">
          {visibleProjects.length + visibleCastings.length}
        </span>
      </label>

      <div className="search-tabs">
        {(
          [
            ["all", "Все"],
            ["projects", "Проекты"],
            ["castings", "Кастинги"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "search-tab is-on" : "search-tab"}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {empty ? (
        <p className="catalog-empty">
          По запросу ничего не найдено.{" "}
          <button type="button" className="btn-ghost" onClick={() => { setQ(""); setTab("all"); }}>
            Сбросить
          </button>
        </p>
      ) : (
        <div className="catalog-results">
          <div className="catalog-feed-list feed-list" aria-live="polite">
            {visibleProjects.map((p) => (
              <ProjectCard key={p.slug} project={p} role={role} related={castingsForProject(p.slug)} />
            ))}
            {visibleCastings.map((c) => (
              <CastingCard key={c.slug} casting={c} role={role} project={getProject(c.projectSlug)} responses={responseCount(c)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project: p,
  role,
  related,
}: {
  project: Project;
  role: ReturnType<typeof useDemoRole>["role"];
  related: Casting[];
}) {
  const href = withRole(`/projects/${p.slug}`, role);
  const open = related;

  return (
    <article className="feed-card feed-card--project">
      <div className="feed-card__top">
        <img src={p.studioAvatar} alt="" className="feed-card__avatar" width={40} height={40} />
        <div className="feed-card__who">
          <div className="feed-card__org">{p.studio}</div>
          <div className="feed-card__meta">
            {p.kind} · {p.platform} · {p.city}
          </div>
        </div>
        <span className="tag tag-blue">Проект</span>
      </div>
      <Link href={href} className="feed-card__hero media-16x9">
        <img src={p.cover} alt="" />
      </Link>
      <h3 className="feed-card__title">
        <Link href={href}>{p.title}</Link>
      </h3>
      <p className="feed-card__text">{p.logline}</p>
      {open.length ? (
        <div className="feed-card__roles">
          {open.map((c) => (
            <span key={c.slug} className="tag tag-gray">
              {c.roleLabel}
            </span>
          ))}
        </div>
      ) : null}
      <footer className="feed-card__foot">
        <span className="feed-card__responses">{p.status}</span>
        <div className="feed-card__actions">
          <Link href={href} className="btn-primary btn-sm">
            Открыть проект
          </Link>
        </div>
      </footer>
    </article>
  );
}

function CastingCard({
  casting: c,
  role,
  project,
  responses,
}: {
  casting: Casting;
  role: ReturnType<typeof useDemoRole>["role"];
  project: Project | null;
  responses: number;
}) {
  const cardHref = withRole(`/castings/${c.slug}`, role);
  const actionHref =
    role === "casting"
      ? withRole(`/responses?casting=${c.slug}`, role)
      : role === "agent"
        ? withRole(`/compose?type=propose&casting=${c.slug}`, role)
        : cardHref;
  const cta = role === "casting" ? "Отклики" : role === "agent" ? "Предложить" : "Откликнуться";

  return (
    <article className="feed-card feed-card--casting">
      <div className="feed-card__top">
        <img
          src={project?.studioAvatar || "/assets/figma/avatar-04.png"}
          alt=""
          className="feed-card__avatar"
          width={40}
          height={40}
        />
        <div className="feed-card__who">
          <div className="feed-card__org">{project?.title ?? c.cdName}</div>
          <div className="feed-card__meta">
            {project?.studio ? `${project.studio} · ` : ""}
            {c.meta}
          </div>
        </div>
        <div className="feed-card__tags">
          {c.urgent ? <span className="tag tag-orange">Срочно</span> : null}
          <span className="tag tag-green">Кастинг</span>
        </div>
      </div>
      <Link href={cardHref} className="feed-card__hero media-16x9">
        <img src={c.media} alt="" />
      </Link>
      <h3 className="feed-card__title">
        <Link href={cardHref}>{c.title}</Link>
      </h3>
      <p className="feed-card__text">{c.text}</p>
      <dl className="feed-card__facts">
        {c.facts.map(([k, v]) => (
          <div key={k} className="feed-card__fact">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="feed-card__deadline">
        <span className="feed-card__deadline-label">Дедлайн</span>
        <strong>{c.deadline}</strong>
      </div>
      <footer className="feed-card__foot">
        {role !== "actor" ? (
          <span className="feed-card__responses">{responses} откликов</span>
        ) : null}
        <div className="feed-card__actions">
          <Link href={actionHref} className="btn-primary btn-sm">
            {cta}
          </Link>
        </div>
      </footer>
    </article>
  );
}
