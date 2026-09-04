"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { withRole } from "@/lib/roles";
import { useWorkspace } from "@/components/useWorkspace";
import { ResponseCards } from "@/components/ResponsesBoard";

export default function ResponsesPage() {
  return (
    <Suspense>
      <ResponsesInner />
    </Suspense>
  );
}

function ResponsesInner() {
  const params = useSearchParams();
  const { role, myApplications, applications, getCasting, getProject } = useWorkspace();
  const filterSlug = params.get("casting") || "";

  const rows = useMemo(() => {
    const list =
      role === "casting"
        ? applications.filter((a) => !filterSlug || a.castingSlug === filterSlug)
        : myApplications.filter((a) => !filterSlug || a.castingSlug === filterSlug);
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [role, applications, myApplications, filterSlug]);

  const casting = filterSlug ? getCasting(filterSlug) : null;

  const pageLead =
    role === "casting"
      ? "Все входящие отклики и предложения агентов по вашим кастингам"
      : role === "agent"
        ? "Статус ваших предложений актёров на роли"
        : "Статус ваших откликов и приглашений";

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <div className="page-scroll catalog-page" id="responses-catalog">
          <header className="catalog-page__head catalog-page__head--stack">
            <h1 className="catalog-page__title">
              {role === "casting" ? "Все отклики" : role === "agent" ? "Предложения" : "Мои отклики"}
            </h1>
            <p className="catalog-page__lead">{pageLead}</p>
          </header>

          {casting ? (
            <p className="responses-filter-note">
              Фильтр: <strong>{casting.title}</strong>
              {" · "}
              <Link href={withRole(`/castings/${casting.slug}/responses`, role)}>страница кастинга</Link>
              {" · "}
              <Link href={withRole("/responses", role)}>сбросить</Link>
            </p>
          ) : null}

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
              <p className="catalog-empty">
                {role === "casting" ? (
                  <>
                    Пока нет откликов. <Link href={withRole("/castings", role)}>Открыть кастинги →</Link>
                  </>
                ) : role === "agent" ? (
                  <>
                    Пока нет предложений. <Link href={withRole("/castings", role)}>Найти кастинг →</Link>
                  </>
                ) : (
                  <>
                    Пока нет откликов. <Link href={withRole("/castings", role)}>Смотреть кастинги →</Link>
                  </>
                )}
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
