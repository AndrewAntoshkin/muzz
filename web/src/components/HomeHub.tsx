"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { FaceCard } from "@/lib/people";
import { compareFacesByPlan } from "@/lib/labels";
import { profileSlug, roleAgencyId, withRole } from "@/lib/roles";
import {
  availabilityLabel,
  personAvailability,
} from "@/lib/workspace";
import { useDemoRole } from "./useDemoRole";
import { useWorkspace } from "./useWorkspace";
import { assistantDigest } from "@/lib/assistant";
import { listEvents } from "@/lib/events";
import { canUseAssistant, openPlanModal, parsePlan } from "@/lib/plans";
import { CoverBadge, statusKind } from "./CatalogTiles";
import { PersonCard } from "./PersonCard";
import { RightRail } from "./RightRail";

const PLATFORMS = [
  { name: "Кинопоиск", count: "14 проектов", hot: "3 ищут команду", bg: "#FF5500", mark: "КП" },
  { name: "Okko", count: "9 проектов", hot: "5 ищут команду", bg: "#181818", mark: "OK" },
  { name: "START", count: "7 проектов", hot: "2 ищут команду", bg: "var(--ss-surface-hover)", mark: "ST", border: true },
  { name: "KION", count: "6 проектов", hot: "4 ищут команду", bg: "#E50046", mark: "KI" },
  { name: "Wink", count: "4 проекта", hot: "1 ищет команду", bg: "#0080CB", mark: "W" },
  { name: "Premier", count: "2 проекта", hot: "—", bg: "#7B61FF", mark: "PR" },
];

export function HomeHub({
  roster,
  preview,
  actorCount,
}: {
  roster: FaceCard[];
  preview: FaceCard[];
  actorCount: number;
}) {
  const { role, cfg } = useDemoRole();
  const ws = useWorkspace();
  const {
    castings,
    projects,
    posts,
    pulses,
    myApplications,
    applications,
    unread,
    responseCount,
    getProject,
    castingsForProject,
    castingsForCd,
    projectsForCd,
    toggleSaved,
    saved,
    settings,
    state,
  } = ws;
  const hub = cfg.hub;
  const cdSlug = profileSlug(cfg);
  const agencyId = roleAgencyId(role);
  const plan = parsePlan(settings.plan);
  const digest = useMemo(
    () => assistantDigest(state, role, cdSlug, plan),
    [state, role, cdSlug, plan],
  );

  const people = useMemo(() => {
    const talent = (p: FaceCard) => p.profession === "actor" || p.profession === "actress";
    const list =
      role === "agent"
        ? roster.filter((p) => p.agencyId === agencyId && talent(p))
        : role === "casting"
          ? preview.filter(talent)
          : preview.slice();
    return [...list].sort(compareFacesByPlan);
  }, [roster, preview, role, agencyId]);
  const peopleTotal = role === "agent" ? people.length : actorCount;

  const feedCastings = useMemo(() => {
    if (role === "casting") return castingsForCd(cdSlug);
    if (role === "actor") {
      const preferred = ["tihiy-yanvar-second", "okno-hosts"];
      return [...castings].sort((a, b) => {
        const ai = preferred.indexOf(a.slug);
        const bi = preferred.indexOf(b.slug);
        const av = ai === -1 ? preferred.length : ai;
        const bv = bi === -1 ? preferred.length : bi;
        return av - bv;
      });
    }
    return castings;
  }, [role, castings, castingsForCd, cdSlug]);

  const visibleProjects = useMemo(() => {
    if (role === "casting") return projectsForCd(cdSlug);
    return projects;
  }, [role, projects, projectsForCd, cdSlug]);

  const cta =
    role === "casting" ? "Смотреть отклики" : role === "agent" ? "Предложить" : "Откликнуться";

  const metrics: [string, string, string][] =
    role === "actor"
      ? [
          [String(castings.length), "кастингов открыто", "в ленте"],
          [String(myApplications.length), "активных отклика", myApplications.some((a) => a.status === "invited") ? "есть приглашение" : "ждут ответа"],
          [String(unread), "непрочитанных", "в сообщениях"],
          [String(posts.filter((p) => p.authorRole === "actor").length), "ваших постов", "в ленте"],
        ]
      : role === "casting"
        ? [
            [String(feedCastings.length), "кастинга в работе", "ваши роли"],
            [String(applications.filter((a) => feedCastings.some((c) => c.slug === a.castingSlug)).length), "входящих отклика", "на разбор"],
            [String(applications.filter((a) => a.status === "shortlist").length), "в шорт-листе", "нужно решение"],
            [String(unread), "сообщения", "актёры и агенты"],
          ]
        : [
            [String(peopleTotal), "актёров в ростере", "Актёр 1"],
            [String(castings.length), "кастингов к разбору", "сегодня"],
            [String(myApplications.length), "предложений отправлено", "ждут ответа"],
            [String(unread), "сообщения", "от кастинг-директоров"],
          ];

  function rosterStatus(person: FaceCard) {
    const kind = personAvailability(person.slug, pulses);
    return {
      kind,
      label: availabilityLabel(kind, person.profession === "actress"),
    };
  }

  function castingPrimaryHref(slug: string) {
    if (role === "casting") return withRole(`/castings/${slug}/responses`, role);
    if (role === "agent") return withRole(`/compose?type=propose&casting=${slug}`, role);
    return withRole(`/castings/${slug}`, role);
  }

  return (
    <div className="app-main__body app-main__body--hub">
      <main className="page-area hub-center">
        <div className="page-scroll">
          <div className="hub-column">
            <section className="hub-welcome">
              <div>
                <h1 className="hub-welcome__title">Здравствуйте, {cfg.firstName}</h1>
                <p className="hub-welcome__lead">{hub.lead}</p>
              </div>
              {digest ? (
                <div className="hub-welcome__tasks">
                  {canUseAssistant(plan) ? (
                    <Link href={withRole(digest.href, role)} className="hub-task">
                      <span className="hub-task__label">От ассистента</span>
                      <strong>{digest.title}</strong>
                      <span className="hub-task__meta">{digest.text}</span>
                    </Link>
                  ) : (
                    <button type="button" className="hub-task" onClick={() => openPlanModal()}>
                      <span className="hub-task__label">От ассистента</span>
                      <strong>{digest.title}</strong>
                      <span className="hub-task__meta">{digest.text}</span>
                    </button>
                  )}
                </div>
              ) : null}
            </section>

            <section className="hub-metrics">
              {metrics.map(([n, label, extra]) => (
                <span key={label} className="hub-metric">
                  <strong>{n}</strong>
                  <span>{label}</span>
                  <em>{extra}</em>
                </span>
              ))}
            </section>

            <section className="hub-block">
              <header className="hub-block__head">
                <div>
                  <h2 className="hub-block__title">ВГИК</h2>
                  <p className="hub-block__lead">Фестиваль и набор Высших курсов</p>
                </div>
                <a href="https://vgik.info/" target="_blank" rel="noopener noreferrer" className="hub-block__link">
                  vgik.info →
                </a>
              </header>
              <div className="hub-events">
                {listEvents().map((event) => (
                  <Link key={event.slug} href={withRole(`/events/${event.slug}`, role)} className="hub-event">
                    <div className="hub-event__media media-16x9">
                      <img src={event.image} alt="" />
                      <time className="hub-event__date" dateTime={event.iso}>
                        {event.day}
                        <span>{event.month}</span>
                      </time>
                    </div>
                    <div className="hub-event__body">
                      <span className="hub-event__tag">{event.tag}</span>
                      <strong className="hub-event__title">{event.title}</strong>
                      <span className="hub-event__meta">
                        {event.when} · {event.city}
                      </span>
                      <span className="hub-event__text">{event.meta}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {(role === "casting" || role === "agent") && (
              <section className="hub-block">
                <header className="hub-block__head">
                  <div>
                    <h2 className="hub-block__title">{hub.peopleTitle}</h2>
                    <p className="hub-block__lead">{hub.peopleLead}</p>
                  </div>
                  <Link
                    href={withRole(role === "agent" ? "/search?mine=1" : "/faces", role)}
                    className="hub-block__link"
                  >
                    {role === "agent" ? `Ростер · ${peopleTotal} →` : `Все ${peopleTotal} →`}
                  </Link>
                </header>
                <div className="faces-strip" aria-label="Ростер">
                  {people.slice(0, 8).map((p) => {
                    const { kind, label } = rosterStatus(p);
                    return (
                      <PersonCard
                        key={p.slug}
                        person={p}
                        variant="strip"
                        status={label}
                        statusKind={kind}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            <section className="hub-block">
              <header className="hub-block__head">
                <div>
                  <h2 className="hub-block__title">{hub.feedTitle}</h2>
                  <p className="hub-block__lead">{hub.feedLead}</p>
                </div>
                <Link href={withRole("/castings", role)} className="hub-block__link">
                  {role === "casting" ? "Все мои кастинги →" : "Все кастинги →"}
                </Link>
              </header>
              <div className="feed-list feed-list--compact">
                {posts
                  .filter((post) => (role === "actor" ? post.authorRole === "actor" : false))
                  .slice(0, 1)
                  .map((post) => (
                  <article key={post.id} className="feed-card">
                    <div className="feed-card__top">
                      <img src={post.authorAvatar} alt="" className="feed-card__avatar" width={40} height={40} />
                      <div className="feed-card__who">
                        <div className="feed-card__org">{post.authorName}</div>
                        <div className="feed-card__meta">Пост в ленту</div>
                      </div>
                      <span className="tag tag-gray">Лента</span>
                    </div>
                    <p className="feed-card__text">{post.text}</p>
                  </article>
                ))}
                {(role === "casting" ? feedCastings : feedCastings.slice(0, 4)).map((p) => {
                  const project = getProject(p.projectSlug);
                  const cardHref = withRole(`/castings/${p.slug}`, role);
                  const actionHref = castingPrimaryHref(p.slug);
                  const n = responseCount(p);
                  const savedKey = `casting:${p.slug}`;
                  const isSaved = saved.includes(savedKey);
                  return (
                    <article key={p.slug} className="feed-card feed-card--casting">
                      <Link href={cardHref} className="feed-card__hero media-16x9">
                        <img src={p.media} alt="" />
                        {p.urgent ? <CoverBadge kind="urgent">Срочно</CoverBadge> : null}
                        <CoverBadge kind="casting">Кастинг</CoverBadge>
                      </Link>
                      <div className="feed-card__top">
                        <img
                          src={project?.studioAvatar || "/assets/figma/avatar-04.png"}
                          alt=""
                          className="feed-card__avatar"
                          width={40}
                          height={40}
                        />
                        <div className="feed-card__who">
                          <div className="feed-card__org">{project?.studio ?? p.cdName}</div>
                          <div className="feed-card__meta">
                            {project ? `${project.title} · ${p.meta}` : p.meta}
                          </div>
                        </div>
                      </div>
                      <h3 className="feed-card__title">
                        <Link href={cardHref}>{p.title}</Link>
                      </h3>
                      <p className="feed-card__text">{p.text}</p>
                      <div className="feed-card__deadline">
                        <span className="feed-card__deadline-label">Дедлайн</span>
                        <strong>{p.deadline}</strong>
                      </div>
                      <footer className="feed-card__foot">
                        {role !== "actor" ? (
                          <span className="feed-card__responses">{n} откликов</span>
                        ) : (
                          <span className="feed-card__responses feed-card__responses--empty" aria-hidden="true" />
                        )}
                        <div className="feed-card__actions">
                          <button
                            type="button"
                            className={`btn-secondary btn-sm${isSaved ? " is-on" : ""}`}
                            onClick={() => toggleSaved(savedKey)}
                          >
                            {isSaved ? "Сохранено" : "Сохранить"}
                          </button>
                          <Link href={actionHref} className="btn-primary btn-sm">
                            {cta}
                          </Link>
                        </div>
                      </footer>
                    </article>
                  );
                })}
              </div>
            </section>

            {(role === "actor" || role === "agent") && (
              <section className="hub-block">
                <header className="hub-block__head">
                  <div>
                    <h2 className="hub-block__title">Активность платформ</h2>
                    <p className="hub-block__lead">Кто заказывает кино прямо сейчас</p>
                  </div>
                  <Link href={withRole("/projects", role)} className="hub-block__link">
                    Все проекты →
                  </Link>
                </header>
                <div className="platform-strip">
                  {PLATFORMS.map((p) => (
                    <span key={p.name} className="platform-card">
                      <span
                        className="platform-card__logo"
                        style={{
                          background: p.bg,
                          color: p.border ? "var(--ss-text-secondary)" : undefined,
                          border: p.border ? "1px solid var(--ss-border)" : undefined,
                        }}
                      >
                        {p.mark}
                      </span>
                      <span className="platform-card__name">{p.name}</span>
                      <span className="platform-card__count">{p.count}</span>
                      <span className="platform-card__hot">{p.hot}</span>
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="hub-block">
              <header className="hub-block__head">
                <div>
                  <h2 className="hub-block__title">
                    {role === "casting" ? "Мои проекты" : "Проекты в производстве"}
                  </h2>
                  <p className="hub-block__lead">
                    {role === "casting"
                      ? "Студии и платформы, где вы ведёте кастинг"
                      : "Студии, которые набирают команду"}
                  </p>
                </div>
                <Link href={withRole("/projects", role)} className="hub-block__link">
                  {role === "casting" ? "Все мои проекты →" : "Все проекты →"}
                </Link>
              </header>
              <div className="feed-list feed-list--compact">
                {(role === "casting" ? visibleProjects : visibleProjects.slice(0, 4)).map((p) => {
                  const href = withRole(`/projects/${p.slug}`, role);
                  const related = castingsForProject(p.slug);
                  const urgent = related.some((c) => c.urgent && c.deadline !== "закрыт");
                  return (
                    <article key={p.slug} className="feed-card feed-card--project">
                      <Link href={href} className="feed-card__hero media-16x9">
                        <img src={p.cover} alt="" />
                        {urgent ? <CoverBadge kind="urgent">Срочно</CoverBadge> : null}
                        <CoverBadge kind={statusKind(p.status)}>{p.status}</CoverBadge>
                      </Link>
                      <div className="feed-card__top">
                        <img src={p.studioAvatar} alt="" className="feed-card__avatar" width={40} height={40} />
                        <div className="feed-card__who">
                          <div className="feed-card__org">{p.studio}</div>
                          <div className="feed-card__meta">
                            {p.kind} · {p.platform} · {p.city}
                          </div>
                        </div>
                      </div>
                      <h3 className="feed-card__title">
                        <Link href={href}>{p.title}</Link>
                      </h3>
                      <p className="feed-card__text">{p.logline}</p>
                      {related.length ? (
                        <div className="feed-card__roles">
                          {related.map((c) => (
                            <span key={c.slug} className="tag tag-gray">
                              {c.roleLabel}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <footer className="feed-card__foot">
                        <span className="feed-card__responses">{p.status}</span>
                        <div className="feed-card__actions">
                          <Link href={href} className="btn-primary btn-sm">
                            {role === "agent" ? "Предложить актёров" : "Открыть проект"}
                          </Link>
                        </div>
                      </footer>
                    </article>
                  );
                })}
              </div>
            </section>

          </div>
        </div>
      </main>
      <RightRail />
    </div>
  );
}
