"use client";

import Link from "next/link";
import { withRole } from "@/lib/roles";
import { timelineClass, type TimelineItem } from "@/lib/productions";
import { decodeSlug } from "@/lib/workspace";
import { useWorkspace } from "./useWorkspace";

function ruWord(n: number, one: string, few: string, many: string) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

const TAG_CLS = {
  green: "tag-green",
  blue: "tag-blue",
  gray: "tag-gray",
  orange: "tag-orange",
};

function fallbackTimeline(deadline: string, responses: number): TimelineItem[] {
  return [
    { date: "Открыто", title: "Объявление и сбор самопроб", meta: `${responses} откликов`, state: "done" },
    { date: deadline, title: "Дедлайн самопроб", meta: "приём открыт", state: "current" },
    { date: "далее", title: "Очные пробы", meta: "по приглашениям", state: "future" },
  ];
}

export function CastingView({ slug }: { slug: string }) {
  const ws = useWorkspace();
  const { role, ready, alreadyApplied, applyToCasting, toggleSaved, saved, flash, responseCount, applications } = ws;
  const casting = ws.getCasting(decodeSlug(slug));
  const project = casting ? ws.getProject(casting.projectSlug) : null;

  if (!ready) {
    return (
      <div className="page-scroll detail-page">
        <p className="catalog-page__lead catalog-page__lead--solo">Загрузка…</p>
      </div>
    );
  }
  if (!casting) {
    return (
      <div className="page-scroll">
        <p className="page-type">Кастинг не найден</p>
      </div>
    );
  }

  const applied = alreadyApplied(casting.slug);
  const savedKey = `casting:${casting.slug}`;
  const isSaved = saved.includes(savedKey);
  const n = responseCount(casting);
  const kind = project?.kind ?? casting.meta;
  const platform = project?.platform;
  const crumb = ["Кастинг", kind, platform].filter(Boolean).join(" · ");
  const timeline = casting.timeline?.length ? casting.timeline : fallbackTimeline(casting.deadline, n);
  const liveApps = applications.filter((a) => a.castingSlug === casting.slug);
  const team = project?.team?.filter((m) => m.name && !/актёр|актриса/i.test(m.role)) ?? [];

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash("Ссылка скопирована");
    } catch {
      flash("Не удалось скопировать ссылку");
    }
  }

  return (
    <div className="page-scroll detail-page">
      <div className="detail-grid">
        <div>
          <section className="detail-hero">
            <div className="detail-hero__img">
              <img src={casting.media} alt="" />
            </div>
            <div className="detail-hero__body">
              <p className="detail-hero__crumb">{crumb}</p>
              <h1 className="detail-hero__title">
                {casting.title}
                {project ? ` — ${project.title}` : ""}
              </h1>
              <p className="detail-hero__meta">
                {project ? (
                  <Link
                    href={withRole(`/projects/${project.slug}`, role)}
                    style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <img
                      src={project.studioAvatar}
                      alt=""
                      style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
                    />
                    <strong>{project.studio}</strong>
                  </Link>
                ) : (
                  <strong>{casting.cdName}</strong>
                )}
                {casting.published ? (
                  <>
                    <span>·</span>
                    <span>Опубликовано {casting.published}</span>
                  </>
                ) : null}
                <span>·</span>
                <span className="tag tag-orange">Дедлайн · {casting.deadline}</span>
                {role !== "actor" ? (
                  <>
                    <span>·</span>
                    <span>
                      <strong>{n}</strong> {ruWord(n, "отклик", "отклика", "откликов")}
                    </span>
                  </>
                ) : null}
              </p>
              <div className="detail-hero__actions">
                {role === "casting" ? (
                  <Link href={withRole(`/responses?casting=${casting.slug}`, role)} className="btn-primary">
                    Смотреть отклики
                  </Link>
                ) : role === "agent" ? (
                  <Link href={withRole(`/compose?type=propose&casting=${casting.slug}`, role)} className="btn-primary">
                    Предложить
                  </Link>
                ) : applied ? (
                  <Link href={withRole("/responses", role)} className="btn-primary">
                    Отклик отправлен
                  </Link>
                ) : (
                  <button type="button" className="btn-primary" onClick={() => applyToCasting(casting.slug, "selftape")}>
                    Откликнуться самопробой
                  </button>
                )}
                <button type="button" className={`btn-secondary${isSaved ? " is-on" : ""}`} onClick={() => toggleSaved(savedKey)}>
                  {isSaved ? "Сохранено" : "Сохранить"}
                </button>
                <button type="button" className="btn-secondary" onClick={share}>
                  Поделиться
                </button>
              </div>
            </div>
          </section>

          <section className="detail-block">
            <div className="detail-block__head">
              <h2 className="detail-block__title">О роли</h2>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text)" }}>{casting.text}</p>
            {project?.logline ? (
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)", marginTop: 12 }}>{project.logline}</p>
            ) : null}
            {casting.facts.length ? (
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

          {casting.scenes?.length ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Сцены для самопробы</h2>
                <a href="#scenes" className="detail-block__link" onClick={(e) => e.preventDefault()}>
                  Скачать все сцены (.pdf)
                </a>
              </div>
              <div className="scenes-list">
                {casting.scenes.map((scene) => (
                  <a key={scene.num} href="#scene" className="scene-row" onClick={(e) => e.preventDefault()}>
                    <span className="scene-row__num">{scene.num}</span>
                    <div>
                      <div className="scene-row__title">{scene.title}</div>
                      <div className="scene-row__meta">{scene.meta}</div>
                    </div>
                    <div className="scene-row__dl">
                      <strong>{scene.duration}</strong> минимум
                    </div>
                  </a>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
                Слейт-стандарт: имя · рост · агентство · «{project?.title ?? casting.title} · самопроба». Вертикально, естественный свет, без музыки.
              </p>
            </section>
          ) : null}

          {role === "actor" ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Ваша самопроба</h2>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>до {casting.deadline}</span>
              </div>
              <div className="tape-upload">
                <div className="tape-upload__title">Загрузите 1 видео до 500 МБ</div>
                <div className="tape-upload__hint">MP4 / MOV. Желательно 1080p, вертикально. Сцены — одним файлом, склейка без переходов.</div>
                <button type="button" className="btn-primary" onClick={() => applyToCasting(casting.slug, "selftape")}>
                  {applied ? "Самопроба отправлена" : "Выбрать файл"}
                </button>
              </div>
            </section>
          ) : null}

          {role === "casting" ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">
                  Кто уже откликнулся · {n}
                </h2>
                <Link href={withRole(`/responses?casting=${casting.slug}`, role)} className="detail-block__link">
                  Все отклики →
                </Link>
              </div>
              <div className="responses-list">
                {(casting.applicants ?? [])
                  .filter((person) => {
                    const slug = person.href?.replace(/^\/people\//, "");
                    if (slug) return !liveApps.some((a) => a.actorSlug === slug);
                    return !liveApps.some((a) => a.actorName === person.name);
                  })
                  .map((person) => (
                  <div key={person.name} className="response-row">
                    {person.avatar ? <img src={person.avatar} alt="" /> : null}
                    <div>
                      <div className="response-row__name">{person.name}</div>
                      <div className="response-row__meta">{person.meta}</div>
                    </div>
                    <div className="response-row__stat">
                      <strong>{person.match}</strong> совпадение
                    </div>
                    <span className={`tag ${TAG_CLS[person.tagKind]}`}>{person.tag}</span>
                  </div>
                ))}
                {liveApps.map((app) => (
                  <Link
                    key={app.id}
                    href={withRole(`/responses?casting=${casting.slug}&app=${app.id}`, role)}
                    className="response-row"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {app.actorAvatar ? (
                      <img src={app.actorAvatar} alt="" />
                    ) : (
                      <span className="project-team-card__ava">{app.actorName.slice(0, 2)}</span>
                    )}
                    <div>
                      <div className="response-row__name">{app.actorName}</div>
                      <div className="response-row__meta">
                        {app.source === "agent"
                          ? app.note || "Предложение агента"
                          : app.note || "Отклик из «Кадра»"}
                      </div>
                    </div>
                    <span
                      className={`tag ${
                        app.status === "shortlist" || app.status === "invited"
                          ? "tag-green"
                          : app.source === "agent"
                            ? "tag-blue"
                            : "tag-gray"
                      }`}
                    >
                      {app.source === "agent" && app.status === "sent"
                        ? "Предложение агента"
                        : app.status === "shortlist"
                          ? "В шорт-лист"
                          : app.status === "invited"
                            ? "Приглашение"
                            : "Новая"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="detail-side">
          <section className="detail-side__panel">
            <div className="detail-side__title">Команда проекта</div>
            {project ? (
              <Link
                href={withRole(`/projects/${project.slug}`, role)}
                className="response-row"
                style={{ gridTemplateColumns: "36px 1fr", padding: "6px 0", border: "none", textDecoration: "none", color: "inherit" }}
              >
                <img src={project.studioAvatar} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                <div>
                  <div className="response-row__name">{project.studio}</div>
                  <div className="response-row__meta">Продакшн-компания</div>
                </div>
              </Link>
            ) : null}
            {team.map((member) => {
              const inner = (
                <>
                  {member.avatar ? (
                    <img src={member.avatar} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span className="project-team-card__ava" style={{ background: member.bg || "#2c2c2b", width: 36, height: 36 }}>
                      {member.initials || member.name.slice(0, 2)}
                    </span>
                  )}
                  <div>
                    <div className="response-row__name">{member.name}</div>
                    <div className="response-row__meta">{member.role}</div>
                  </div>
                </>
              );
              const rowStyle = { gridTemplateColumns: "36px 1fr", padding: "6px 0", border: "none", textDecoration: "none", color: "inherit" } as const;
              if (member.href) {
                return (
                  <Link key={`${member.name}-${member.role}`} href={withRole(member.href, role)} className="response-row" style={rowStyle}>
                    {inner}
                  </Link>
                );
              }
              return (
                <div key={`${member.name}-${member.role}`} className="response-row" style={rowStyle}>
                  {inner}
                </div>
              );
            })}
            {!project && (
              <Link
                href={withRole(`/people/${casting.cdSlug}`, role)}
                className="response-row"
                style={{ gridTemplateColumns: "1fr", padding: "6px 0", border: "none", textDecoration: "none", color: "inherit" }}
              >
                <div>
                  <div className="response-row__name">{casting.cdName}</div>
                  <div className="response-row__meta">Кастинг-директор</div>
                </div>
              </Link>
            )}
          </section>

          <section className="detail-side__panel">
            <div className="detail-side__title">Этапы кастинга</div>
            <div className="timeline">
              {timeline.map((item) => (
                <div key={`${item.date}-${item.title}`} className={timelineClass(item.state)}>
                  <div className="timeline-item__date">{item.date}</div>
                  <div className="timeline-item__title">{item.title}</div>
                  {item.meta ? <div className="timeline-item__meta">{item.meta}</div> : null}
                </div>
              ))}
            </div>
          </section>

          {casting.docs?.length ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Документы</div>
              <dl className="detail-kv">
                {casting.docs.map((row) => (
                  <FragmentDoc key={row.label} label={row.label} value={row.value} />
                ))}
              </dl>
            </section>
          ) : null}

          {project ? (
            <section className="detail-side__panel" style={{ background: "rgba(85,240,139,0.08)", border: "none" }}>
              <div className="detail-side__title" style={{ color: "#55f08b" }}>
                {project.studio} · отвечает
              </div>
              <p style={{ fontSize: 13, color: "#55f08b", lineHeight: 1.5, margin: "0 0 8px" }}>
                Медиана ответа на отклик — <strong>1 день 6 часов</strong>. Конверсия в очные пробы — <strong>14%</strong>.
              </p>
              <Link href={withRole(`/projects/${project.slug}`, role)} className="link-accent" style={{ fontWeight: 600, fontSize: 13 }}>
                К проекту →
              </Link>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function FragmentDoc({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>
        <a href="#doc" className="link-accent" onClick={(e) => e.preventDefault()}>
          {value}
        </a>
      </dd>
    </>
  );
}
