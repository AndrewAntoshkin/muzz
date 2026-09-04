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
  fromAll = false,
}: {
  item: Application;
  role: RoleId;
  casting: Casting | null;
  project: Project | null;
  onStatus: (status: AppStatus) => void;
  fromAll?: boolean;
}) {
  const created = new Date(item.createdAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const profileHref = withRole(
    `/people/${item.actorSlug}?from=response&app=${item.id}${fromAll ? "&via=all" : ""}`,
    role,
  );
  const castingHref = casting ? withRole(`/castings/${casting.slug}`, role) : null;
  const canOpenProfile = role !== "actor";
  const showCdActions = role === "casting" && item.status !== "declined";

  const person = (
    <>
      {item.actorAvatar ? (
        <img src={item.actorAvatar} alt="" className="response-sheet__ava" />
      ) : (
        <span className="response-sheet__ava response-sheet__ava--empty" />
      )}
      <div className="response-detail__who">
        <div className="response-detail__eyebrow">{KIND_LABEL[item.kind]}</div>
        <div className="response-sheet__name">{item.actorName}</div>
        <div className="response-sheet__when">{created}</div>
        {item.actorMeta || item.match ? (
          <div className="response-detail__chips">
            {item.actorMeta ? <span>{item.actorMeta}</span> : null}
            {item.match ? <span className="response-detail__match">{item.match} совпадение</span> : null}
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="app-main__body app-main__body--catalog">
      <main className="page-area">
        <div className="page-scroll detail-page response-detail">
          <div className="detail-grid">
            <div className="response-detail__main">
              <section className="detail-block response-detail__offer">
                <header className="response-detail__hero">
                  {canOpenProfile ? (
                    <Link href={profileHref} className="response-detail__person">
                      {person}
                    </Link>
                  ) : (
                    <div className="response-detail__person">{person}</div>
                  )}
                  <span className={`tag ${statusTag(item.status)}`}>{STATUS_LABEL[item.status]}</span>
                </header>

                <section className="response-detail__note">
                  <h3>Комментарий</h3>
                  <p>{item.note?.trim() ? item.note : "Без комментария"}</p>
                </section>

                {showCdActions ? (
                  <div className="response-detail__footer">
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

              {item.tape ? (
                <section className="detail-block response-detail__tape">
                  <div className="detail-block__head">
                    <h2 className="detail-block__title">Самопроба</h2>
                  </div>
                  <ResponseTape tape={item.tape} role={role} />
                  <p className="response-detail__hint">
                    Пока прикреплён showreel актёра — как самопроба для разбора.
                  </p>
                </section>
              ) : null}

              {casting ? (
                <section className="detail-block response-detail__casting">
                  <div className="detail-block__head">
                    <h2 className="detail-block__title">Кастинг</h2>
                    {casting.scenesPdf ? (
                      <a href={casting.scenesPdf} className="detail-block__link" download>
                        Скачать все сцены (.pdf)
                      </a>
                    ) : null}
                  </div>
                  <p className="response-detail__lead">{casting.text}</p>
                  {project?.logline ? <p className="response-detail__logline">{project.logline}</p> : null}
                  {casting.facts?.length ? (
                    <dl className="feed-card__facts response-detail__facts">
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
                <section className="response-detail__files">
                  <h2 className="detail-block__title">Сцены и файлы</h2>
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
                <dl className="detail-kv detail-kv--stack">
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
                  <dt>Статус</dt>
                  <dd>{STATUS_LABEL[item.status]}</dd>
                </dl>
                {castingHref ? (
                  <Link href={castingHref} className="response-detail__side-link">
                    Открыть кастинг
                  </Link>
                ) : null}
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
