"use client";

import { useEffect, useMemo, useState } from "react";
import { CatalogFilterBar, CatalogSearchField } from "@/components/CatalogFilterBar";
import { CastingTile, ProjectTile } from "@/components/CatalogTiles";
import { IconCheck, IconFaces, IconFilm, IconFolder, IconPin, IconProject } from "@/components/icons";
import { PersonCard } from "@/components/PersonCard";
import { useDemoRole } from "@/components/useDemoRole";
import { useWorkspace } from "@/components/useWorkspace";
import {
  ACTOR_PROFESSION_FILTERS,
  CASTING_ROLE_FILTERS,
  CITY_FILTERS,
  FORMAT_FILTERS,
  PLATFORM_FILTERS,
  PROJECT_STATUS_FILTERS,
  castingRoleKind,
  matchesCity,
  matchesPlatform,
  peopleCountLabel,
  projectFormats,
  ruCount,
} from "@/lib/labels";
import type { FaceCard } from "@/lib/people";
import type { Casting, Project } from "@/lib/productions";

type Tab = "all" | "people" | "projects" | "castings";

const PEOPLE_PREVIEW = 10;

function matchesQuery(hay: string, query: string) {
  if (!query) return true;
  return hay.toLowerCase().includes(query);
}

function personHay(p: FaceCard) {
  return `${p.name} ${p.role} ${p.city} ${p.profession}`;
}

function projectHay(p: Project) {
  return `${p.title} ${p.studio} ${p.platform} ${p.kind} ${p.status} ${p.city} ${p.logline}`;
}

function castingHay(c: Casting, project: Project | null) {
  return `${c.title} ${c.roleLabel} ${c.text} ${c.meta} ${c.cdName} ${project?.title ?? ""} ${project?.studio ?? ""} ${project?.platform ?? ""}`;
}

export function UnifiedSearch({ people }: { people: FaceCard[] }) {
  const { role } = useDemoRole();
  const { projects, castings, getProject, castingsForProject, responseCount } = useWorkspace();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [profession, setProfession] = useState("");
  const [format, setFormat] = useState("");
  const [city, setCity] = useState("");
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [roleKind, setRoleKind] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [visiblePeople, setVisiblePeople] = useState(96);

  const query = q.trim().toLowerCase();

  const matchedPeople = useMemo(
    () =>
      people.filter((p) => {
        if (profession && p.profession !== profession) return false;
        if (city && p.city !== city) return false;
        return matchesQuery(personHay(p), query);
      }),
    [people, profession, city, query],
  );

  const matchedProjects = useMemo(
    () =>
      projects.filter((p) => {
        if (format && !projectFormats(p.kind).includes(format)) return false;
        if (!matchesCity(p.city, city)) return false;
        if (!matchesPlatform(p.platform, platform)) return false;
        if (status && p.status !== status) return false;
        if (openOnly && !castingsForProject(p.slug).some((c) => c.deadline !== "закрыт")) return false;
        return matchesQuery(projectHay(p), query);
      }),
    [query, projects, format, city, platform, status, openOnly, castingsForProject],
  );

  const matchedCastings = useMemo(
    () =>
      castings.filter((c) => {
        const project = getProject(c.projectSlug);
        if (roleKind && castingRoleKind(c.roleLabel) !== roleKind) return false;
        if (format && project && !projectFormats(project.kind).includes(format)) return false;
        if (!matchesCity(`${c.meta} ${project?.city ?? ""}`, city)) return false;
        if (platform && !(matchesPlatform(project?.platform ?? "", platform) || matchesPlatform(c.meta, platform))) {
          return false;
        }
        if (urgentOnly && !c.urgent) return false;
        return matchesQuery(castingHay(c, project), query);
      }),
    [query, castings, getProject, format, city, platform, urgentOnly, roleKind],
  );

  useEffect(() => {
    setVisiblePeople(96);
  }, [q, profession, city, tab]);

  const visibleProjects = tab === "people" || tab === "castings" ? [] : matchedProjects;
  const visibleCastings = tab === "people" || tab === "projects" ? [] : matchedCastings;
  const showPeople = tab === "all" || tab === "people";
  const peopleShown =
    tab === "people" ? matchedPeople.slice(0, visiblePeople) : matchedPeople.slice(0, PEOPLE_PREVIEW);

  const empty =
    (!showPeople || matchedPeople.length === 0) &&
    visibleProjects.length === 0 &&
    visibleCastings.length === 0;

  const total =
    (showPeople ? matchedPeople.length : 0) + visibleProjects.length + visibleCastings.length;

  function reset() {
    setQ("");
    setTab("all");
    setProfession("");
    setFormat("");
    setCity("");
    setPlatform("");
    setStatus("");
    setRoleKind("");
    setUrgentOnly(false);
    setOpenOnly(false);
  }

  const countLabel =
    tab === "people"
      ? peopleCountLabel(matchedPeople.length)
      : tab === "projects"
        ? ruCount(matchedProjects.length, "проект", "проекта", "проектов")
        : tab === "castings"
          ? ruCount(matchedCastings.length, "кастинг", "кастинга", "кастингов")
          : ruCount(total, "результат", "результата", "результатов");

  const filters =
    tab === "people"
      ? [
          {
            id: "profession",
            icon: <IconFaces />,
            placeholder: "Роль",
            value: profession,
            options: ACTOR_PROFESSION_FILTERS,
            onChange: setProfession,
          },
          {
            id: "city",
            icon: <IconPin />,
            placeholder: "Город",
            value: city,
            options: CITY_FILTERS,
            onChange: setCity,
          },
        ]
      : tab === "projects"
        ? [
            {
              id: "format",
              icon: <IconFilm />,
              placeholder: "Формат",
              value: format,
              options: FORMAT_FILTERS,
              onChange: setFormat,
            },
            {
              id: "status",
              icon: <IconFolder />,
              placeholder: "Этап",
              value: status,
              options: PROJECT_STATUS_FILTERS,
              onChange: setStatus,
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
          ]
        : tab === "castings"
          ? [
              {
                id: "role",
                icon: <IconFaces />,
                placeholder: "Роль",
                value: roleKind,
                options: CASTING_ROLE_FILTERS,
                onChange: setRoleKind,
              },
              {
                id: "city",
                icon: <IconPin />,
                placeholder: "Город",
                value: city,
                options: CITY_FILTERS,
                onChange: setCity,
              },
            ]
          : [
              {
                id: "profession",
                icon: <IconFaces />,
                placeholder: "Роль",
                value: profession,
                options: ACTOR_PROFESSION_FILTERS,
                onChange: setProfession,
              },
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
            ];

  const toggle =
    tab === "projects"
      ? {
          icon: <IconCheck />,
          label: "Только с кастингом",
          on: openOnly,
          onToggle: () => setOpenOnly((v) => !v),
        }
      : tab === "people"
        ? undefined
        : {
            icon: <IconCheck />,
            label: "Только срочные",
            on: urgentOnly,
            onToggle: () => setUrgentOnly((v) => !v),
          };

  return (
    <div className="page-scroll catalog-page catalog-page--wide" id="unified-search">
      <header className="catalog-page__head catalog-page__head--row">
        <p className="catalog-page__lead catalog-page__lead--solo">
          Вся лента: актёры, проекты в производстве и открытые кастинги
        </p>
      </header>

      <div className="catalog-stats catalog-stats--3" aria-label="Сводка">
        <button type="button" className="catalog-stat" onClick={() => setTab("people")}>
          <strong>{matchedPeople.length}</strong>
          <span>актёров</span>
          <em>в базе</em>
        </button>
        <button type="button" className="catalog-stat" onClick={() => setTab("projects")}>
          <strong>{matchedProjects.length}</strong>
          <span>проектов</span>
          <em>в производстве</em>
        </button>
        <button type="button" className="catalog-stat" onClick={() => setTab("castings")}>
          <strong>{matchedCastings.length}</strong>
          <span>кастингов</span>
          <em>открыты</em>
        </button>
      </div>

      <CatalogSearchField
        value={q}
        onChange={setQ}
        placeholder="Имя, проект, студия, платформа или город…"
        ariaLabel="Поиск по базе"
      />
      <CatalogFilterBar filters={filters} toggle={toggle} onReset={reset} countLabel={countLabel} />

      <div className="search-tabs">
        {(
          [
            ["all", "Все"],
            ["people", "Актёры"],
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
          {showPeople && matchedPeople.length ? (
            <section className="catalog-section">
              {tab === "all" ? (
                <header className="catalog-section__head">
                  <h2 className="catalog-section__title">Актёры</h2>
                  {matchedPeople.length > PEOPLE_PREVIEW ? (
                    <button type="button" className="catalog-section__link" onClick={() => setTab("people")}>
                      Все {matchedPeople.length} →
                    </button>
                  ) : null}
                </header>
              ) : null}
              <div className="faces-grid faces-grid--5" aria-live="polite">
                {peopleShown.map((p) => (
                  <PersonCard key={p.slug} person={p} />
                ))}
              </div>
              {tab === "people" && visiblePeople < matchedPeople.length ? (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ margin: "20px auto", display: "block" }}
                  onClick={() => setVisiblePeople((n) => n + 96)}
                >
                  Показать ещё ({matchedPeople.length - visiblePeople})
                </button>
              ) : null}
            </section>
          ) : null}

          {visibleProjects.length ? (
            <section className="catalog-section">
              {tab === "all" ? (
                <header className="catalog-section__head">
                  <h2 className="catalog-section__title">Проекты</h2>
                  <button type="button" className="catalog-section__link" onClick={() => setTab("projects")}>
                    Все {matchedProjects.length} →
                  </button>
                </header>
              ) : null}
              <div className="casting-grid" role="list">
                {visibleProjects.map((p) => (
                  <ProjectTile key={p.slug} p={p} role={role} related={castingsForProject(p.slug)} />
                ))}
              </div>
            </section>
          ) : null}

          {visibleCastings.length ? (
            <section className="catalog-section">
              {tab === "all" ? (
                <header className="catalog-section__head">
                  <h2 className="catalog-section__title">Кастинги</h2>
                  <button type="button" className="catalog-section__link" onClick={() => setTab("castings")}>
                    Все {matchedCastings.length} →
                  </button>
                </header>
              ) : null}
              <div className="casting-grid" role="list">
                {visibleCastings.map((c) => {
                  const project = getProject(c.projectSlug);
                  return (
                    <CastingTile
                      key={c.slug}
                      c={c}
                      role={role}
                      responses={responseCount(c)}
                      projectTitle={project?.title}
                      projectStudio={project?.studio}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
