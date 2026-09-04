"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CatalogFilterBar, CatalogSearchField } from "@/components/CatalogFilterBar";
import { CastingTile } from "@/components/CatalogTiles";
import { IconCheck, IconFaces, IconPin } from "@/components/icons";
import { useDemoRole } from "@/components/useDemoRole";
import { useWorkspace } from "@/components/useWorkspace";
import {
  CASTING_ROLE_FILTERS,
  CITY_FILTERS,
  castingRoleKind,
  matchesCity,
  ruCount,
} from "@/lib/labels";
import { profileSlug, withRole } from "@/lib/roles";

export default function CastingsPage() {
  const { role, cfg } = useDemoRole();
  const { castings, castingsForCd, getProject, responseCount } = useWorkspace();
  const cdSlug = profileSlug(cfg);
  const [q, setQ] = useState("");
  const [roleKind, setRoleKind] = useState("");
  const [city, setCity] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);

  const source = useMemo(() => {
    if (role === "casting") return castingsForCd(cdSlug);
    return castings;
  }, [role, castings, castingsForCd, cdSlug]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return source.filter((c) => {
      const project = getProject(c.projectSlug);
      if (roleKind && castingRoleKind(c.roleLabel) !== roleKind) return false;
      if (!matchesCity(`${c.meta} ${project?.city ?? ""}`, city)) return false;
      if (urgentOnly && !c.urgent) return false;
      if (query) {
        const hay =
          `${c.title} ${c.roleLabel} ${c.text} ${c.meta} ${c.cdName} ${project?.title ?? ""} ${project?.studio ?? ""} ${project?.platform ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [source, q, roleKind, city, urgentOnly, getProject]);

  function reset() {
    setQ("");
    setRoleKind("");
    setCity("");
    setUrgentOnly(false);
  }

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <div className="page-scroll catalog-page" id="castings-catalog">
          <header className="catalog-page__head catalog-page__head--row">
            <p className="catalog-page__lead catalog-page__lead--solo">
              {role === "casting"
                ? "Ваши открытые роли — отклики и дедлайны"
                : role === "agent"
                  ? "Роли, куда можно предложить актёров из ростера"
                  : "Все открытые роли в кино, сериалах и рекламе"}
            </p>
            {role === "casting" ? (
              <Link href={withRole("/compose?type=casting", role)} className="btn-primary btn-sm catalog-page__cta">
                Новый кастинг
              </Link>
            ) : null}
          </header>

          <CatalogSearchField
            value={q}
            onChange={setQ}
            placeholder="Название, роль, студия или город…"
            ariaLabel="Поиск по кастингам"
          />
          <CatalogFilterBar
            filters={[
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
            ]}
            toggle={{
              icon: <IconCheck />,
              label: "Только срочные",
              on: urgentOnly,
              onToggle: () => setUrgentOnly((v) => !v),
            }}
            onReset={reset}
            countLabel={ruCount(list.length, "кастинг", "кастинга", "кастингов")}
          />

          <div className="catalog-results">
            {list.length ? (
              <div className="casting-grid" role="list">
                {list.map((c) => {
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
            ) : (
              <p className="catalog-empty">
                {role === "casting" && !q && !roleKind && !city && !urgentOnly ? (
                  <>
                    Пока нет опубликованных кастингов.{" "}
                    <Link href={withRole("/compose?type=casting", role)}>Создать первый →</Link>
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
