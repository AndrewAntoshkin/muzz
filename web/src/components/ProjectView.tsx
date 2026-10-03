"use client";

import Link from "next/link";
import { Fragment } from "react";
import { initialsOf, platformLogo } from "@/lib/labels";
import {
  parseFraction,
  scheduleTimeline,
  timelineClass,
  type ProjectDoc,
  type ProjectKv,
  type ProjectOpening,
  type ProjectPartner,
  type ProjectTeamMember,
} from "@/lib/productions";
import { withRole, type RoleId } from "@/lib/roles";
import { decodeSlug } from "@/lib/workspace";
import { FileStoreRow, fileKindLabel } from "./FileDropzone";
import { ProjectBoardLink } from "./ProjectBoard";
import { useWorkspace } from "./useWorkspace";

function ruWord(n: number, one: string, few: string, many: string) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

function Kv({ rows }: { rows: ProjectKv[] }) {
  if (!rows.length) return null;
  return (
    <dl className="detail-kv">
      {rows.map((row) => (
        <Fragment key={`${row.label}-${row.value}`}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

function DocsList({ docs }: { docs: ProjectDoc[] }) {
  if (!docs.length) return null;
  return (
    <div className="file-store__list">
      {docs.map((doc) => (
        <FileStoreRow
          key={`${doc.label}-${doc.href || doc.value}`}
          name={doc.label}
          kind={fileKindLabel(doc.label, doc.value)}
          href={doc.href}
        />
      ))}
    </div>
  );
}

function PartnerRow({ partner }: { partner: ProjectPartner }) {
  const initials = partner.initials || initialsOf(partner.name);
  return (
    <div className="response-row project-partner-row">
      <span className="project-team-card__ava" style={{ background: partner.bg || "#2c2c2b", width: 36, height: 36, fontSize: initials.length > 2 ? 9 : 11 }}>
        {initials}
      </span>
      <div>
        <div className="response-row__name">{partner.name}</div>
        <div className="response-row__meta">{partner.meta}</div>
      </div>
    </div>
  );
}

function TeamCard({ member, role }: { member: ProjectTeamMember; role: RoleId }) {
  const inner = (
    <>
      {member.avatar ? (
        <img src={member.avatar} alt="" />
      ) : (
        <span className="project-team-card__ava" style={{ background: member.bg || "#2c2c2b" }}>
          {member.initials || initialsOf(member.name)}
        </span>
      )}
      <div>
        <div className="project-team-card__name">{member.name}</div>
        <div className="project-team-card__meta">{member.role}</div>
      </div>
    </>
  );
  if (member.href) {
    return (
      <Link href={withRole(member.href, role)} className="project-team-card">
        {inner}
      </Link>
    );
  }
  return <div className="project-team-card">{inner}</div>;
}

const OPEN_TAG: Record<ProjectOpening["tag"], [string, string]> = {
  urgent: ["tag-orange", "Срочно"],
  open: ["tag-blue", "Открыто"],
  soon: ["tag-gray", "Скоро"],
};

export function ProjectView({ slug }: { slug: string }) {
  const ws = useWorkspace();
  const { role, ready, responseCount, toggleSaved, saved, flash } = ws;
  const project = ws.getProject(decodeSlug(slug));
  const castings = ws.castingsForProject(decodeSlug(slug));

  if (!ready) {
    return (
      <div className="page-scroll detail-page">
        <p className="catalog-page__lead catalog-page__lead--solo">Загрузка…</p>
      </div>
    );
  }
  if (!project) {
    return (
      <div className="page-scroll">
        <p className="page-type">Проект не найден</p>
      </div>
    );
  }

  const progress = parseFraction(project.shiftsDone);
  const financing = project.financing?.filter((r) => r.value) ?? [];
  const distribution = project.distribution?.filter((r) => r.value) ?? [];
  const partners = project.partners?.filter((p) => p.name) ?? [];
  const docs = project.docs?.filter((d) => d.label || d.href) ?? [];
  const budgetRows: ProjectKv[] = [
    ...(project.budget ? [{ label: "Бюджет", value: project.budget }] : []),
    ...financing,
    ...(project.spent ? [{ label: "Освоено", value: project.spent }] : []),
  ];
  const team = project.team?.filter((m) => m.name) ?? [];
  const openings = project.openings ?? [];
  const updates = project.updates ?? [];
  const timeline = scheduleTimeline(project);
  const savedKey = `project:${project.slug}`;
  const isSaved = saved.includes(savedKey);
  const firstCasting = castings[0];
  const logo = platformLogo(project.platform);
  const facts = [
    ...project.kind.split("·").map((part) => part.trim()).filter(Boolean),
    project.city,
  ].filter(Boolean);

  const statusExtra: ProjectKv[] = [
    { label: "Этап", value: project.status },
    ...(project.scenesDone ? [{ label: "Сцены сняты", value: project.scenesDone }] : []),
    ...(project.nature ? [{ label: "Натура", value: project.nature }] : []),
    ...(project.pavilion ? [{ label: "Павильон", value: project.pavilion }] : []),
    ...(project.cdName ? [{ label: "Кастинг ведёт", value: project.cdName }] : []),
  ];

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
          <section className="detail-hero project-hero">
            <div className="detail-hero__img">
              <img src={project.cover} alt="" />
            </div>
            <div className="detail-hero__body">
              <div className="project-hero__tags">
                <span className="tag tag-blue">Проект</span>
                <span className="tag tag-green">{project.status}</span>
              </div>
              <h1 className="detail-hero__title">{project.title}</h1>
              <div className="detail-hero__meta project-hero-meta">
                <div className="project-hero-meta__studio">
                  <img src={project.studioAvatar} alt="" className="project-hero-meta__ava" />
                  <strong>{project.studio}</strong>
                  {logo ? (
                    <img
                      src={logo.src}
                      alt={project.platform}
                      title={project.platform}
                      className={`project-hero-meta__logo${logo.invert ? " project-hero-meta__logo--invert" : ""}`}
                    />
                  ) : project.platform ? (
                    <span className="project-hero-meta__platform">{project.platform}</span>
                  ) : null}
                </div>
                {facts.length || project.shifts ? (
                  <p className="project-hero-meta__facts">
                    {facts.map((item, i) => (
                      <Fragment key={`${item}-${i}`}>
                        {i > 0 ? <span className="project-hero-meta__dot">·</span> : null}
                        <span>{item}</span>
                      </Fragment>
                    ))}
                    {project.shifts ? (
                      <>
                        {facts.length ? <span className="project-hero-meta__dot">·</span> : null}
                        <span>
                          <strong>{project.shifts}</strong> смен
                        </span>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
              <div className="detail-hero__actions">
                {role === "casting" ? (
                  <Link href={withRole(`/compose?type=casting&project=${project.slug}`, role)} className="btn-primary">
                    Создать кастинг
                  </Link>
                ) : firstCasting ? (
                  <Link href={withRole(`/castings/${firstCasting.slug}`, role)} className="btn-primary">
                    {role === "agent" ? "Предложить на открытые роли" : "Откликнуться на открытые позиции"}
                  </Link>
                ) : null}
                <button type="button" className={`btn-secondary${isSaved ? " is-on" : ""}`} onClick={() => toggleSaved(savedKey)}>
                  {isSaved ? "Вы подписаны" : "Подписаться на проект"}
                </button>
                <button type="button" className="btn-secondary" onClick={share}>
                  Поделиться
                </button>
              </div>
            </div>
          </section>

          <section className="detail-block">
            <div className="detail-block__head">
              <h2 className="detail-block__title">Логлайн</h2>
            </div>
            <p className="project-logline">{project.logline}</p>
            {project.text && project.text !== project.logline ? <p className="project-logline-note">{project.text}</p> : null}
          </section>

          {role === "casting" ? (
            <section className="detail-block">
              <ProjectBoardLink slug={project.slug} />
            </section>
          ) : null}

          {role === "casting" ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Бюджет и финансирование</h2>
                <Link href={withRole(`/projects/${project.slug}?settings=budget`, role)} className="detail-block__link">
                  Править
                </Link>
              </div>
              {budgetRows.length ? (
                <Kv rows={budgetRows} />
              ) : (
                <p className="project-empty-note">Бюджет пока не указан. Добавьте суммы в настройках проекта.</p>
              )}
            </section>
          ) : null}

          {role === "casting" ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Документы и юр.</h2>
                <Link href={withRole(`/projects/${project.slug}?settings=docs`, role)} className="detail-block__link">
                  Загрузить
                </Link>
              </div>
              {docs.length ? (
                <DocsList docs={docs} />
              ) : (
                <p className="project-empty-note">Документов пока нет. Загрузите файлы в настройках.</p>
              )}
            </section>
          ) : null}

          <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">
                  Кастинги проекта
                  {castings.length ? ` · ${castings.length}` : ""}
                </h2>
                {role === "casting" ? (
                  <Link
                    href={withRole(`/compose?type=casting&project=${project.slug}`, role)}
                    className="detail-block__link"
                  >
                    Опубликовать кастинг
                  </Link>
                ) : (
                  <Link href={withRole("/castings", role)} className="detail-block__link">
                    Все кастинги →
                  </Link>
                )}
              </div>
              {castings.length ? (
                <div className="responses-list">
                  {castings.map((c) => {
                    const n = responseCount(c);
                    return (
                      <Link
                        key={c.slug}
                        href={withRole(`/castings/${c.slug}`, role)}
                        className="response-row"
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                      <span className="project-team-card__ava" style={{ background: "#2C2C2B" }}>
                        {c.roleLabel
                          .split(/[·\s]+/)
                          .filter(Boolean)
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 3)
                          .toUpperCase()}
                      </span>
                      <div>
                        <div className="response-row__name">{c.title}</div>
                        <div className="response-row__meta">
                          {c.roleLabel} · до {c.deadline}
                        </div>
                      </div>
                      <div className="response-row__stat">
                        {role !== "actor" ? (
                          <>
                            <strong>{n}</strong> {ruWord(n, "отклик", "отклика", "откликов")}
                          </>
                        ) : null}
                      </div>
                      {c.urgent ? <span className="tag tag-orange">Срочно</span> : <span className="tag tag-blue">Открыто</span>}
                    </Link>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Кастингов пока нет</p>
              )}
            </section>
          

          {openings.length ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Открытые позиции · {openings.length}</h2>
                {role === "casting" ? (
                  <span className="detail-block__link">Опубликовать вакансию</span>
                ) : null}
              </div>
              <div className="responses-list">
                {openings.map((job) => {
                  const [tagCls, tagLabel] = OPEN_TAG[job.tag];
                  return (
                    <div key={job.title} className="response-row">
                      <span className="project-team-card__ava" style={{ background: job.bg }}>
                        {job.initials}
                      </span>
                      <div>
                        <div className="response-row__name">{job.title}</div>
                        <div className="response-row__meta">{job.meta}</div>
                      </div>
                      <div className="response-row__stat">
                        <strong>{job.responses}</strong> {ruWord(job.responses, "отклик", "отклика", "откликов")}
                      </div>
                      <span className={`tag ${tagCls}`}>{tagLabel}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {team.length ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Команда · {team.length}</h2>
              </div>
              <div className="project-team-grid">
                {team.map((member) => (
                  <TeamCard key={`${member.name}-${member.role}`} member={member} role={role} />
                ))}
              </div>
            </section>
          ) : null}

          {updates.length ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Бэкстейдж и обновления</h2>
              </div>
              {updates.map((post, i) => (
                <article
                  key={`${post.author}-${post.time}`}
                  style={
                    i < updates.length - 1
                      ? { borderBottom: "1px solid var(--hairline)", paddingBottom: 14, marginBottom: 14 }
                      : undefined
                  }
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    {post.avatar ? (
                      <img src={post.avatar} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <span className="project-team-card__ava" style={{ background: post.bg || "#2c2c2b", width: 32, height: 32, fontSize: 11 }}>
                        {post.initials || initialsOf(post.author)}
                      </span>
                    )}
                    <strong style={{ fontSize: 13 }}>{post.author}</strong>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· {post.time}</span>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.55 }}>{post.text}</p>
                  {post.image ? (
                    <div className="media-16x9" style={{ background: "#000", borderRadius: 10, marginTop: 10 }}>
                      <img src={post.image} alt="" />
                    </div>
                  ) : null}
                </article>
              ))}
            </section>
          ) : null}
        </div>

        <aside className="detail-side">
          <section className="detail-side__panel">
            <div className="detail-side__title">Статус производства</div>
            {progress ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span>Прогресс смен</span>
                  <strong>
                    {progress.done} / {progress.total}
                  </strong>
                </div>
                <div className="rail-progress__bar" style={{ marginBottom: 14 }}>
                  <span style={{ width: `${progress.pct}%`, background: "var(--tag-green-fg)" }} />
                </div>
              </>
            ) : null}
            {timeline.length ? (
              <div className="timeline" style={{ marginBottom: statusExtra.length ? 14 : 0 }}>
                {timeline.map((item) => (
                  <div key={`${item.title}-${item.date}`} className={timelineClass(item.state)}>
                    <div className="timeline-item__date">{item.date}</div>
                    <div className="timeline-item__title">{item.title}</div>
                    {item.meta ? <div className="timeline-item__meta">{item.meta}</div> : null}
                  </div>
                ))}
              </div>
            ) : null}
            <Kv rows={statusExtra} />
          </section>

          {role === "casting" && distribution.length ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Прокат и платформа</div>
              <Kv rows={distribution} />
            </section>
          ) : null}

          {role === "casting" && partners.length ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Партнёры производства</div>
              {partners.map((partner) => (
                <PartnerRow key={partner.name} partner={partner} />
              ))}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
