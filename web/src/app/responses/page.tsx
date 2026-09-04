"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { KIND_LABEL, STATUS_LABEL, type Application, type AppStatus } from "@/lib/workspace";
import { withRole, type RoleId } from "@/lib/roles";
import { useWorkspace } from "@/components/useWorkspace";

export default function ResponsesPage() {
  return (
    <Suspense>
      <ResponsesInner />
    </Suspense>
  );
}

function ResponsesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { role, myApplications, applications, getCasting, getProject, setAppStatus } = useWorkspace();
  const filterSlug = params.get("casting") || "";
  const openId = params.get("app") || "";

  const rows = useMemo(() => {
    const list =
      role === "casting"
        ? applications.filter((a) => !filterSlug || a.castingSlug === filterSlug)
        : myApplications.filter((a) => !filterSlug || a.castingSlug === filterSlug);
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [role, applications, myApplications, filterSlug]);

  const open = rows.find((a) => a.id === openId) ?? null;
  const casting = filterSlug ? getCasting(filterSlug) : null;

  const pageLead =
    role === "casting"
      ? "Разбор входящих откликов и предложений от агентов"
      : role === "agent"
        ? "Статус ваших предложений актёров на роли"
        : "Статус ваших откликов и приглашений";

  function openApp(id: string) {
    const next = new URLSearchParams(params.toString());
    next.set("app", id);
    router.push(withRole(`/responses?${next.toString()}`, role));
  }

  function closeApp() {
    const next = new URLSearchParams(params.toString());
    next.delete("app");
    const q = next.toString();
    router.push(withRole(q ? `/responses?${q}` : "/responses", role));
  }

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

          {rows.length ? (
            <div className="response-cards">
              {rows.map((item) => {
                const c = getCasting(item.castingSlug);
                const project = c ? getProject(c.projectSlug) : null;
                const title =
                  role === "actor" ? (c?.title ?? "Кастинг") : item.actorName;
                const projectBit =
                  project?.title &&
                  c?.title &&
                  !c.title.replace(/[«»]/g, "").includes(project.title.replace(/[«»]/g, ""))
                    ? project.title
                    : role === "actor"
                      ? project?.title
                      : null;
                const subtitle =
                  role === "actor"
                    ? [projectBit, KIND_LABEL[item.kind]].filter(Boolean).join(" · ")
                    : [c?.title, projectBit, KIND_LABEL[item.kind]].filter(Boolean).join(" · ");

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`response-card${openId === item.id ? " is-active" : ""}`}
                    onClick={() => openApp(item.id)}
                  >
                    {item.actorAvatar ? (
                      <img src={item.actorAvatar} alt="" className="response-card__ava" />
                    ) : (
                      <span className="response-card__ava response-card__ava--empty" />
                    )}
                    <span className="response-card__main">
                      <span className="response-card__title">{title}</span>
                      <span className="response-card__sub">{subtitle}</span>
                      {item.note ? <span className="response-card__note">{item.note}</span> : null}
                    </span>
                    <span className={`tag ${statusTag(item.status)}`}>{STATUS_LABEL[item.status]}</span>
                  </button>
                );
              })}
            </div>
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

      {open ? (
        <ResponseDetail
          item={open}
          role={role}
          onClose={closeApp}
          onStatus={(status) => setAppStatus(open.id, status)}
          castingTitle={getCasting(open.castingSlug)?.title}
          castingSlug={open.castingSlug}
          projectTitle={(() => {
            const c = getCasting(open.castingSlug);
            return c ? getProject(c.projectSlug)?.title : undefined;
          })()}
        />
      ) : null}
    </div>
  );
}

function ResponseDetail({
  item,
  role,
  onClose,
  onStatus,
  castingTitle,
  castingSlug,
  projectTitle,
}: {
  item: Application;
  role: RoleId;
  onClose: () => void;
  onStatus: (status: AppStatus) => void;
  castingTitle?: string;
  castingSlug: string;
  projectTitle?: string;
}) {
  const created = new Date(item.createdAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="response-sheet" role="dialog" aria-modal="true" aria-labelledby="response-sheet-title">
      <button type="button" className="response-sheet__backdrop" aria-label="Закрыть" onClick={onClose} />
      <div className="response-sheet__panel">
        <header className="response-sheet__head">
          <div>
            <div className="response-sheet__eyebrow">{KIND_LABEL[item.kind]}</div>
            <h2 id="response-sheet-title" className="response-sheet__title">
              {role === "actor" ? castingTitle || "Отклик" : item.actorName}
            </h2>
          </div>
          <button type="button" className="btn-secondary btn-sm" onClick={onClose}>
            Закрыть
          </button>
        </header>

        <div className="response-sheet__body">
          <div className="response-sheet__hero">
            {item.actorAvatar ? (
              <img src={item.actorAvatar} alt="" className="response-sheet__ava" />
            ) : (
              <span className="response-sheet__ava response-sheet__ava--empty" />
            )}
            <div>
              <div className="response-sheet__name">{item.actorName}</div>
              <div className="response-sheet__when">{created}</div>
            </div>
            <span className={`tag ${statusTag(item.status)}`}>{STATUS_LABEL[item.status]}</span>
          </div>

          <dl className="detail-kv response-sheet__kv">
            <dt>Тип</dt>
            <dd>{KIND_LABEL[item.kind]}</dd>
            <dt>Источник</dt>
            <dd>{item.source === "agent" ? "Предложение агента" : "Отклик актёра"}</dd>
            {projectTitle ? (
              <>
                <dt>Проект</dt>
                <dd>{projectTitle}</dd>
              </>
            ) : null}
            {castingTitle ? (
              <>
                <dt>Кастинг</dt>
                <dd>{castingTitle}</dd>
              </>
            ) : null}
            <dt>Статус</dt>
            <dd>{STATUS_LABEL[item.status]}</dd>
          </dl>

          <section className="response-sheet__note">
            <h3>Комментарий</h3>
            <p>{item.note?.trim() ? item.note : "Без комментария"}</p>
          </section>

          <div className="response-sheet__links">
            <Link href={withRole(`/castings/${castingSlug}`, role)} className="btn-secondary">
              Открыть кастинг
            </Link>
            {role !== "actor" ? (
              <Link href={withRole(`/people/${item.actorSlug}`, role)} className="btn-secondary">
                Профиль актёра
              </Link>
            ) : (
              <Link href={withRole("/messages", role)} className="btn-secondary">
                Сообщения
              </Link>
            )}
          </div>

          {role === "casting" && item.status !== "declined" ? (
            <div className="response-sheet__actions">
              {item.status !== "shortlist" ? (
                <button type="button" className="btn-secondary" onClick={() => onStatus("shortlist")}>
                  В шорт-лист
                </button>
              ) : null}
              {item.status !== "invited" ? (
                <button type="button" className="btn-primary" onClick={() => onStatus("invited")}>
                  Пригласить на очные
                </button>
              ) : null}
              <button type="button" className="btn-secondary" onClick={() => onStatus("declined")}>
                Отклонить
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function statusTag(status: AppStatus) {
  if (status === "invited" || status === "shortlist") return "tag-green";
  if (status === "declined") return "tag-orange";
  return "tag-gray";
}
