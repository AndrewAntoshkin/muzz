"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CatalogFilterBar, CatalogSearchField } from "@/components/CatalogFilterBar";
import { ProjectTile } from "@/components/CatalogTiles";
import { IconCheck, IconFilm, IconFolder, IconPin, IconProject } from "@/components/icons";
import { useDemoRole } from "@/components/useDemoRole";
import { useWorkspace } from "@/components/useWorkspace";
import {
  CITY_FILTERS,
  FORMAT_FILTERS,
  PLATFORM_FILTERS,
  PROJECT_STATUS_FILTERS,
  matchesCity,
  matchesPlatform,
  projectFormats,
  ruCount,
} from "@/lib/labels";
import { profileSlug, withRole } from "@/lib/roles";

export default function ProjectsPage() {
  const { role, cfg } = useDemoRole();
  const { projects, projectsForCd, castingsForProject } = useWorkspace();
  const cdSlug = profileSlug(cfg);
  const [q, setQ] = useState("");
  const [format, setFormat] = useState("");
  const [city, setCity] = useState("");
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  const source = useMemo(() => {
    if (role === "casting") return projectsForCd(cdSlug);
    return projects;
  }, [role, projects, projectsForCd, cdSlug]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return source.filter((p) => {
      const related = castingsForProject(p.slug);
      if (format && !projectFormats(p.kind).includes(format)) return false;
      if (!matchesCity(p.city, city)) return false;
      if (!matchesPlatform(p.platform, platform)) return false;
      if (status && p.status !== status) return false;
      if (openOnly && !related.some((c) => c.deadline !== "закрыт")) return false;
      if (query) {
        const hay =
          `${p.title} ${p.studio} ${p.platform} ${p.kind} ${p.status} ${p.city} ${p.logline} ${p.text} ${p.cdName ?? ""} ${p.client ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [source, q, format, city, platform, status, openOnly, castingsForProject]);

  function reset() {
    setQ("");
    setFormat("");
    setCity("");
    setPlatform("");
    setStatus("");
    setOpenOnly(false);
  }

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <div className="page-scroll catalog-page" id="projects-catalog">
          <header className="catalog-page__head catalog-page__head--row">
            <p className="catalog-page__lead catalog-page__lead--solo">
              {role === "casting"
                ? "Ваши проекты — производство, кастинги и команда"
                : role === "agent"
                  ? "Проекты платформ — роли, куда можно предложить ростер"
                  : "Все проекты в производстве: кино, сериалы и площадки"}
            </p>
            {role === "casting" ? (
              <Link href={withRole("/compose?type=project", role)} className="btn-primary btn-sm catalog-page__cta">
                Создать проект
              </Link>
            ) : null}
          </header>

          <CatalogSearchField
            value={q}
            onChange={setQ}
            placeholder="Название, студия, платформа или город…"
            ariaLabel="Поиск по проектам"
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
            ]}
            toggle={{
              icon: <IconCheck />,
              label: "Только с кастингом",
              on: openOnly,
              onToggle: () => setOpenOnly((v) => !v),
            }}
            onReset={reset}
            countLabel={ruCount(list.length, "проект", "проекта", "проектов")}
          />

          <div className="catalog-results">
            {list.length ? (
              <div className="casting-grid" role="list">
                {list.map((p) => (
                  <ProjectTile key={p.slug} p={p} role={role} related={castingsForProject(p.slug)} />
                ))}
              </div>
            ) : (
              <p className="catalog-empty">
                {role === "casting" && !q && !format && !city && !platform && !status && !openOnly ? (
                  <>
                    Пока нет проектов.{" "}
                    <Link href={withRole("/compose?type=project", role)}>Создать первый →</Link>
                  </>
                ) : (
                  <>
                    По запросу ничего не найдено.{" "}
                    <button type="button" className="btn-ghost" onClick={reset}>
                      Сбросить
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
