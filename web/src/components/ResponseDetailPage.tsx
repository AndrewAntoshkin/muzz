"use client";

import Link from "next/link";
import {
  KIND_LABEL,
  STATUS_LABEL,
  type Application,
  type AppStatus,
} from "@/lib/workspace";
import { withRole, type RoleId } from "@/lib/roles";
import type { Casting, Project } from "@/lib/productions";
import { ResponseTape } from "@/components/ResponsesBoard";

function statusTag(status: AppStatus) {
  if (status === "invited" || status === "shortlist") return "tag-green";
  if (status === "declined") return "tag-orange";
  return "tag-gray";
}

export function ResponseDetailPage({
  item,
  role,
  casting,
  project,
  onStatus,
  backHref,
}: {
  item: Application;
  role: RoleId;
  casting: Casting | null;
  project: Project | null;
  onStatus: (status: AppStatus) => void;
  backHref: string;
}) {
  const created = new Date(item.createdAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <div className="page-scroll detail-page response-detail">
          <div className="detail-grid">
            <div>
              <header className="catalog-page__head catalog-page__head--stack" style={{ marginBottom: 18 }}>
                <Link href={backHref} className="hub-block__link">
                  ← К откликам
                </Link>
                <p className="response-detail__eyebrow">{KIND_LABEL[item.kind]}</p>
                <h1 className="catalog-page__title">
                  {role === "actor" ? casting?.title || "Отклик" : item.actorName}
                </h1>
                <p className="catalog-page__lead">
                  {[casting?.title, project?.title].filter(Boolean).join(" · ")}
                </p>
              </header>

              <section className="detail-block">
                <div className="response-sheet__hero">
                  {item.actorAvatar ? (
                    <img src={item.actorAvatar} alt="" className="response-sheet__ava" />
                  ) : (
                    <span className="response-sheet__ava response-sheet__ava--empty" />
                  )}
                  <div>
                    <div className="response-sheet__name">{item.actorName}</div>
                    <div className="response-sheet__when">{created}</div>
                    {item.actorMeta ? <div className="response-sheet__when">{item.actorMeta}</div> : null}
                    {item.match ? <div className="response-sheet__when">{item.match} совпадение</div> : null}
                  </div>
                  <span className={`tag ${statusTag(item.status)}`}>{STATUS_LABEL[item.status]}</span>
                </div>

                {item.tape ? (
                  <div className="response-detail__tape">
                    <h2 className="detail-block__title" style={{ marginBottom: 12 }}>
                      Самопроба
                    </h2>
                    <ResponseTape tape={item.tape} role={role} />
                    <p className="response-detail__hint">Пока прикреплён showreel актёра — как самопроба для разбора.</p>
                  </div>
                ) : null}

                <section className="response-sheet__note" style={{ marginTop: 18 }}>
                  <h3>Комментарий</h3>
                  <p>{item.note?.trim() ? item.note : "Без комментария"}</p>
                </section>

                <dl className="detail-kv response-sheet__kv" style={{ marginTop: 18 }}>
                  <dt>Тип</dt>
                  <dd>{KIND_LABEL[item.kind]}</dd>
                  <dt>Источник</dt>
                  <dd>{item.source === "agent" ? "Предложение агента" : "Отклик актёра"}</dd>
                  <dt>Статус</dt>
                  <dd>{STATUS_LABEL[item.status]}</dd>
                </dl>

                <div className="response-sheet__links" style={{ marginTop: 18 }}>
                  {role !== "actor" ? (
                    <Link href={withRole(`/people/${item.actorSlug}`, role)} className="btn-primary">
                      Профиль актёра
                    </Link>
                  ) : null}
                  {casting ? (
                    <Link href={withRole(`/castings/${casting.slug}`, role)} className="btn-secondary">
                      Открыть кастинг
                    </Link>
                  ) : null}
                </div>

                {role === "casting" && item.status !== "declined" ? (
                  <div className="response-sheet__actions" style={{ marginTop: 12 }}>
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
              </section>

              {casting ? (
                <section className="detail-block">
                  <div className="detail-block__head">
                    <h2 className="detail-block__title">Кастинг</h2>
                    {casting.scenesPdf ? (
                      <a href={casting.scenesPdf} className="detail-block__link" download>
                        Скачать все сцены (.pdf)
                      </a>
                    ) : null}
                  </div>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text)" }}>{casting.text}</p>
                  {project?.logline ? (
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)", marginTop: 12 }}>
                      {project.logline}
                    </p>
                  ) : null}
                  {casting.facts?.length ? (
                    <dl className="feed-card__facts" style={{ marginTop: 14 }}>
                      {casting.facts.map(([k, v]) => (
                        <div className="feed-card__fact" key={k}>
                          <dt>{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </section>
              ) : null}

              {casting?.scenes?.length ? (
                <section className="detail-block">
                  <div className="detail-block__head">
                    <h2 className="detail-block__title">Сцены и файлы</h2>
                  </div>
                  <div className="scenes-list">
                    {casting.scenes.map((scene) => {
                      const body = (
                        <>
                          <span className="scene-row__num">{scene.num}</span>
                          <div>
                            <div className="scene-row__title">{scene.title}</div>
                            <div className="scene-row__meta">{scene.meta}</div>
                          </div>
                          <div className="scene-row__dl">
                            <strong>{scene.duration}</strong> минимум
                          </div>
                        </>
                      );
                      if (scene.href) {
                        return (
                          <a key={scene.num} href={scene.href} className="scene-row" download>
                            {body}
                          </a>
                        );
                      }
                      return (
                        <div key={scene.num} className="scene-row">
                          {body}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="detail-side">
              <section className="detail-side__panel">
                <div className="detail-side__title">Кратко</div>
                <dl className="detail-kv">
                  {project ? (
                    <>
                      <dt>Проект</dt>
                      <dd>{project.title}</dd>
                    </>
                  ) : null}
                  {casting ? (
                    <>
                      <dt>Роль</dt>
                      <dd>{casting.roleLabel || casting.title}</dd>
                      <dt>Дедлайн</dt>
                      <dd>{casting.deadline}</dd>
                      <dt>CD</dt>
                      <dd>{casting.cdName}</dd>
                    </>
                  ) : null}
                </dl>
              </section>
              {casting?.scenesPdf ? (
                <section className="detail-side__panel">
                  <div className="detail-side__title">Материалы</div>
                  <a href={casting.scenesPdf} className="btn-secondary btn-block" download>
                    Все сцены (.pdf)
                  </a>
                </section>
              ) : null}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
