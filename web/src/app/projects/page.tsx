"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDemoRole } from "@/components/useDemoRole";
import { useWorkspace } from "@/components/useWorkspace";
import { profileSlug, withRole } from "@/lib/roles";

function ruCount(n: number, one: string, few: string, many: string) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return `${n} ${one}`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

export default function ProjectsPage() {
  const { role, cfg } = useDemoRole();
  const { projects, projectsForCd, castingsForProject, responseCount } = useWorkspace();
  const cdSlug = profileSlug(cfg);

  const list = useMemo(() => {
    if (role === "casting") return projectsForCd(cdSlug);
    return projects;
  }, [role, projects, projectsForCd, cdSlug]);

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <div className="page-scroll catalog-page" id="projects-catalog">
          <header className="catalog-page__head catalog-page__head--row">
            <p className="catalog-page__lead catalog-page__lead--solo">
              {role === "casting"
                ? "Ваши проекты и связанные кастинги"
                : role === "agent"
                  ? "Проекты платформ — предложите актёров на открытые роли"
                  : "Студии, платформы и связанные кастинги"}
            </p>
            {role === "casting" ? (
              <Link href={withRole("/compose?type=project", role)} className="btn-primary btn-sm catalog-page__cta">
                Создать проект
              </Link>
            ) : null}
          </header>

          <div className="catalog-results">
            <div className="catalog-feed-list feed-list">
              {list.map((p) => {
                const related = castingsForProject(p.slug);
                return (
                  <article key={p.slug} className="feed-card feed-card--project">
                    <div className="feed-card__top">
                      <img src={p.studioAvatar} alt="" className="feed-card__avatar" width={40} height={40} />
                      <div className="feed-card__who">
                        <div className="feed-card__org">{p.studio}</div>
                        <div className="feed-card__meta">
                          {p.platform} · {p.kind}
                        </div>
                      </div>
                      <span className="tag tag-blue">Проект</span>
                    </div>
                    <Link href={withRole(`/projects/${p.slug}`, role)} className="feed-card__hero media-16x9">
                      <img src={p.cover} alt="" />
                    </Link>
                    <h3 className="feed-card__title">
                      <Link href={withRole(`/projects/${p.slug}`, role)}>{p.title}</Link>
                    </h3>
                    <p className="feed-card__text">{p.logline}</p>
                    <footer className="feed-card__foot">
                      <span className="feed-card__responses">
                        {p.status}
                        {related.length
                          ? ` · ${ruCount(related.length, "кастинг", "кастинга", "кастингов")}`
                          : ""}
                        {role === "casting" && related.length
                          ? ` · ${related.reduce((n, c) => n + responseCount(c), 0)} откликов`
                          : ""}
                      </span>
                      <Link href={withRole(`/projects/${p.slug}`, role)} className="btn-primary btn-sm">
                        {role === "agent" ? "Предложить актёров" : "Открыть проект"}
                      </Link>
                    </footer>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
