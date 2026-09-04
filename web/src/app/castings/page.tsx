"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDemoRole } from "@/components/useDemoRole";
import { useWorkspace } from "@/components/useWorkspace";
import { profileSlug, withRole, type RoleId } from "@/lib/roles";
import type { Casting } from "@/lib/productions";

function CastingTile({
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
      ? withRole(`/responses?casting=${c.slug}`, role)
      : role === "agent"
        ? withRole(`/compose?type=propose&casting=${c.slug}`, role)
        : withRole(`/castings/${c.slug}`, role);
  const cardHref = withRole(`/castings/${c.slug}`, role);
  const cta =
    role === "casting" ? "Отклики" : role === "agent" ? "Предложить" : "Откликнуться";
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

export default function CastingsPage() {
  const { role, cfg } = useDemoRole();
  const { castings, castingsForCd, getProject, responseCount } = useWorkspace();
  const cdSlug = profileSlug(cfg);

  const list = useMemo(() => {
    if (role === "casting") return castingsForCd(cdSlug);
    return castings;
  }, [role, castings, castingsForCd, cdSlug]);

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
                  : "Открытые роли в кино, сериалах и рекламе"}
            </p>
            {role === "casting" ? (
              <Link href={withRole("/compose?type=casting", role)} className="btn-primary btn-sm catalog-page__cta">
                Новый кастинг
              </Link>
            ) : null}
          </header>

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
                {role === "casting" ? (
                  <>
                    Пока нет опубликованных кастингов.{" "}
                    <Link href={withRole("/compose?type=casting", role)}>Создать первый →</Link>
                  </>
                ) : (
                  "Открытых кастингов пока нет."
                )}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
