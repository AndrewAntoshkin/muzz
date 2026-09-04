"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CatalogFilterBar, CatalogSearchField } from "@/components/CatalogFilterBar";
import { FacesCatalog } from "@/components/FacesCatalog";
import { UnifiedSearch } from "@/components/UnifiedSearch";
import { IconCheck, IconFilm, IconPin, IconProject } from "@/components/icons";
import { useDemoRole } from "@/components/useDemoRole";
import { useWorkspace } from "@/components/useWorkspace";
import {
  ACTOR_PROFESSION_FILTERS,
  CITY_FILTERS,
  FORMAT_FILTERS,
  PLATFORM_FILTERS,
  matchesCity,
  matchesPlatform,
  projectFormats,
  ruCount,
  ruPlural,
} from "@/lib/labels";
import type { FaceCard } from "@/lib/people";
import type { Casting, Project } from "@/lib/productions";
import { withRole } from "@/lib/roles";

type Tab = "all" | "projects" | "castings";

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
  agency = "",
}: {
  people: FaceCard[];
  initialProfession?: string;
  mine?: boolean;
  agency?: string;
}) {
  const { role } = useDemoRole();
  const roster = people.filter(
    (p) => p.agencyId === (agency || "akter1") && (p.profession === "actor" || p.profession === "actress"),
  );
  if ((role === "agent" && mine) || agency) {
    return (
      <FacesCatalog
        people={roster}
        initialProfession={initialProfession}
        professionFilters={ACTOR_PROFESSION_FILTERS}
        title={mine ? "Мои актёры" : "Ростер"}
        lead={mine ? "Ростер агентства «Актёр 1» — ваши актёры." : "Ростер агентства «Актёр 1»."}
        placeholder="Имя или город…"
        wide
        dense
      />
    );
  }
  if (role === "actor") return <ProductionSearch />;
  const actors = people.filter((p) => p.profession === "actor" || p.profession === "actress");
  return <UnifiedSearch people={actors} />;
}

export function ProductionSearch() {
  const { role } = useDemoRole();
  const { projects, castings, getProject, castingsForProject, responseCount } = useWorkspace();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [format, setFormat] = useState("");
  const [city, setCity] = useState("");
  const [platform, setPlatform] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);

  const query = q.trim().toLowerCase();

  const matchedProjects = useMemo(
    () =>
      projects.filter((p) => {
        if (format && !projectFormats(p.kind).includes(format)) return false;
        if (!matchesCity(p.city, city)) return false;
        if (!matchesPlatform(p.platform, platform)) return false;
        if (urgentOnly && !castingsForProject(p.slug).some((c) => c.urgent)) return false;
        return matchesQuery(projectHay(p), query);
      }),
    [query, projects, format, city, platform, urgentOnly, castingsForProject],
  );
  const matchedCastings = useMemo(
    () =>
      castings.filter((c) => {
        const project = getProject(c.projectSlug);
        if (format && project && !projectFormats(project.kind).includes(format)) return false;
        if (!matchesCity(`${c.meta} ${project?.city ?? ""}`, city)) return false;
        if (platform && !(matchesPlatform(project?.platform ?? "", platform) || matchesPlatform(c.meta, platform))) {
          return false;
        }
        if (urgentOnly && !c.urgent) return false;
        return matchesQuery(castingHay(c, project), query);
      }),
    [query, castings, getProject, format, city, platform, urgentOnly],
  );

  const visibleProjects = tab === "castings" ? [] : matchedProjects;
  const visibleCastings = tab === "projects" ? [] : matchedCastings;
  const empty = visibleProjects.length + visibleCastings.length === 0;
  const total = visibleProjects.length + visibleCastings.length;

  function reset() {
    setQ("");
    setTab("all");
    setFormat("");
    setCity("");
    setPlatform("");
    setUrgentOnly(false);
  }

  return (
    <div className="page-scroll catalog-page" id="production-search">
      <p className="catalog-page__lead catalog-page__lead--solo">Проекты в производстве и открытые кастинги</p>

      <div className="catalog-stats" aria-label="Сводка">
        <div className="catalog-stat">
          <strong>{matchedProjects.length}</strong>
          <span>{ruPlural(matchedProjects.length, "проект", "проекта", "проектов")}</span>
          <em>в производстве</em>
        </div>
        <div className="catalog-stat">
          <strong>{matchedCastings.length}</strong>
          <span>
            {ruPlural(
              matchedCastings.length,
              "открытый кастинг",
              "открытых кастинга",
              "открытых кастингов",
            )}
          </span>
          <em>ждут отклика</em>
        </div>
      </div>

      <CatalogSearchField
        value={q}
        onChange={setQ}
        placeholder="Название, студия, платформа или роль…"
        ariaLabel="Поиск проектов и кастингов"
      />
      <CatalogFilterBar
        filters={[
          {
            id: "format",
            icon: <IconFilm />,
            placeholder: "Формат",
            value: format,
            options: FORMAT_FILTERS,
            onChange: setFormat,
          },
          {
            id: "city",
            icon: <IconPin />,
            placeholder: "Город",
            value: city,
            options: CITY_FILTERS,
            onChange: setCity,
          },
          {
            id: "platform",
            icon: <IconProject />,
            placeholder: "Платформа",
            value: platform,
            options: PLATFORM_FILTERS,
            onChange: setPlatform,
          },
        ]}
        toggle={{
          icon: <IconCheck />,
          label: "Только срочные",
          on: urgentOnly,
          onToggle: () => setUrgentOnly((v) => !v),
        }}
        onReset={reset}
        countLabel={ruCount(total, "результат", "результата", "результатов")}
      />

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
          <button type="button" className="btn-ghost" onClick={reset}>
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
      ? withRole(`/castings/${c.slug}/responses`, role)
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
