"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { KIND_LABEL, STATUS_LABEL, type AppStatus } from "@/lib/workspace";
import { withRole } from "@/lib/roles";
import { useWorkspace } from "@/components/useWorkspace";

export default function ResponsesPage() {
  return (
    <Suspense>
      <ResponsesInner />
    </Suspense>
  );
}

function ResponsesInner() {
  const { role, myApplications, applications, getCasting, getProject, setAppStatus } = useWorkspace();
  const params = useSearchParams();
  const filterSlug = params.get("casting") || "";

  const rows =
    role === "casting"
      ? applications.filter((a) => !filterSlug || a.castingSlug === filterSlug)
      : myApplications.filter((a) => !filterSlug || a.castingSlug === filterSlug);

  const casting = filterSlug ? getCasting(filterSlug) : null;
  const pageLead =
    role === "casting"
      ? "Разбор входящих откликов и предложений от агентов"
      : role === "agent"
        ? "Статус ваших предложений актёров на роли"
        : "Статус ваших откликов и приглашений";

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <div className="page-scroll catalog-page" id="responses-catalog">
          <header className="catalog-page__head">
            <p className="catalog-page__lead catalog-page__lead--solo">{pageLead}</p>
          </header>

          {casting ? (
            <p className="responses-filter-note">
              Фильтр: <strong>{casting.title}</strong>
              {" · "}
              <Link href={withRole("/responses", role)}>сбросить</Link>
            </p>
          ) : null}

          <section className="detail-block responses-block">
            {rows.length ? (
              rows.map((item) => {
                const c = getCasting(item.castingSlug);
                const project = c ? getProject(c.projectSlug) : null;
                return (
                  <div key={item.id} className="kadr-app-row">
                    {item.actorAvatar ? (
                      <img src={item.actorAvatar} alt="" className="kadr-app-row__ava" />
                    ) : (
                      <span className="kadr-app-row__ava kadr-app-row__ava--empty" />
                    )}
                    <div className="kadr-app-row__body">
                      <Link
                        href={withRole(
                          role === "actor" && c ? `/castings/${c.slug}` : `/people/${item.actorSlug}`,
                          role,
                        )}
                        className="kadr-app-row__name"
                      >
                        {role === "actor" ? (c?.title ?? item.actorName) : item.actorName}
                      </Link>
                      <div className="kadr-app-row__meta">
                        {KIND_LABEL[item.kind]} · {STATUS_LABEL[item.status]}
                        {project ? ` · ${project.title}` : ""}
                        {c && role !== "actor" ? ` · ${c.title}` : ""}
                        {item.note ? ` · ${item.note}` : ""}
                      </div>
                    </div>
                    <div className="kadr-app-row__side">
                      {c ? (
                        <Link href={withRole(`/castings/${c.slug}`, role)} className="btn-secondary btn-sm">
                          Кастинг
                        </Link>
                      ) : null}
                      {role === "casting" && item.status !== "declined" ? (
                        <div className="kadr-app-row__actions">
                          {item.status !== "shortlist" ? (
                            <button type="button" className="btn-secondary btn-sm" onClick={() => setAppStatus(item.id, "shortlist")}>
                              В шорт-лист
                            </button>
                          ) : null}
                          {item.status !== "invited" ? (
                            <button type="button" className="btn-primary btn-sm" onClick={() => setAppStatus(item.id, "invited")}>
                              Пригласить
                            </button>
                          ) : null}
                          <button type="button" className="btn-secondary btn-sm" onClick={() => setAppStatus(item.id, "declined")}>
                            Отклонить
                          </button>
                        </div>
                      ) : (
                        <span className={`tag ${statusTag(item.status)}`}>{STATUS_LABEL[item.status]}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="catalog-empty">
                {role === "casting" ? (
                  <>
                    Пока нет откликов.{" "}
                    <Link href={withRole("/castings", role)}>Открыть кастинги →</Link>
                  </>
                ) : role === "agent" ? (
                  <>
                    Пока нет предложений.{" "}
                    <Link href={withRole("/castings", role)}>Найти кастинг →</Link>
                  </>
                ) : (
                  <>
                    Пока нет откликов.{" "}
                    <Link href={withRole("/castings", role)}>Смотреть кастинги →</Link>
                  </>
                )}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function statusTag(status: AppStatus) {
  if (status === "invited" || status === "shortlist") return "tag-green";
  if (status === "declined") return "tag-orange";
  return "tag-gray";
}
