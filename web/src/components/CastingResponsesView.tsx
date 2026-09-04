"use client";

import Link from "next/link";
import { useMemo } from "react";
import { decodeSlug } from "@/lib/workspace";
import { withRole } from "@/lib/roles";
import { useWorkspace } from "@/components/useWorkspace";
import { ResponseCards } from "@/components/ResponsesBoard";

export function CastingResponsesView({ slug }: { slug: string }) {
  const { role, ready, applications, getCasting, getProject } = useWorkspace();
  const castingSlug = decodeSlug(slug);
  const casting = getCasting(castingSlug);
  const project = casting ? getProject(casting.projectSlug) : null;

  const rows = useMemo(
    () =>
      [...applications.filter((a) => a.castingSlug === castingSlug)].sort((a, b) => b.createdAt - a.createdAt),
    [applications, castingSlug],
  );

  if (!ready) {
    return (
      <div className="app-main__body app-main__body--catalog">
        <main className="page-area">
          <div className="page-scroll catalog-page">
            <p className="catalog-page__lead catalog-page__lead--solo">Загрузка…</p>
          </div>
        </main>
      </div>
    );
  }

  if (!casting) {
    return (
      <div className="app-main__body app-main__body--catalog">
        <main className="page-area">
          <div className="page-scroll catalog-page">
            <p className="catalog-page__lead catalog-page__lead--solo">Кастинг не найден</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <div className="page-scroll catalog-page">
          <header className="catalog-page__head catalog-page__head--stack">
            <Link href={withRole(`/castings/${casting.slug}`, role)} className="hub-block__link">
              ← К кастингу
            </Link>
            <h1 className="catalog-page__title">
              Отклики · {casting.title}
              {project ? ` — ${project.title}` : ""}
            </h1>
            <p className="catalog-page__lead">
              {rows.length} {rows.length === 1 ? "отклик" : "откликов"} · самопробы и предложения агентов
            </p>
            <div className="catalog-page__actions">
              <Link href={withRole("/responses", role)} className="btn-secondary btn-sm">
                Все отклики
              </Link>
              {casting.scenesPdf ? (
                <a href={casting.scenesPdf} className="btn-secondary btn-sm" download>
                  Сцены (.pdf)
                </a>
              ) : null}
            </div>
          </header>

          {rows.length ? (
            <ResponseCards
              rows={rows}
              role={role}
              getCastingTitle={(s) => getCasting(s)?.title}
              getProjectTitle={(s) => {
                const c = getCasting(s);
                return c ? getProject(c.projectSlug)?.title : undefined;
              }}
            />
          ) : (
            <section className="detail-block responses-block">
              <p className="catalog-empty">Пока нет откликов на этот кастинг.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
