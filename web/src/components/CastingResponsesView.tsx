"use client";

import Link from "next/link";
import { useMemo } from "react";
import { decodeSlug } from "@/lib/workspace";
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
          <header className="catalog-page__head catalog-page__head--row">
            <p className="catalog-page__lead catalog-page__lead--solo">
              {casting.title}
              {project ? ` · ${project.title}` : ""} · {rows.length}{" "}
              {rows.length === 1 ? "отклик" : "откликов"}
            </p>
            {casting.scenesPdf ? (
              <a href={casting.scenesPdf} className="btn-secondary btn-sm catalog-page__cta" download>
                Сцены (.pdf)
              </a>
            ) : null}
          </header>

          {rows.length ? (
            <ResponseCards
              rows={rows}
              role={role}
              from="casting"
              getCastingTitle={(s) => getCasting(s)?.title}
              getProjectTitle={(s) => {
                const c = getCasting(s);
                return c ? getProject(c.projectSlug)?.title : undefined;
              }}
            />
          ) : (
            <p className="catalog-empty">Пока нет откликов на этот кастинг.</p>
          )}
        </div>
      </main>
    </div>
  );
}
