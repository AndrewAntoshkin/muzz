"use client";

import Link from "next/link";
import { useState } from "react";
import { withRole, type RoleId } from "@/lib/roles";
import { timelineClass, type ProjectTeamMember, type TimelineItem } from "@/lib/productions";
import { decodeSlug } from "@/lib/workspace";
import { IconBolt } from "./icons";
import { FileDropzone, FileStoreRow, fileExt, fileKindLabel, persistFileUrl } from "./FileDropzone";
import { useWorkspace } from "./useWorkspace";
import { RehearsalStudio } from "./RehearsalStudio";
import { openPlanModal, parsePlan, rehearsalCap } from "@/lib/plans";
import { rehearsalLeft, rehearsalsUsed } from "@/lib/rehearsal";
import { VZMETNEV_CARD } from "@/lib/demo-profiles";
import { kvValue } from "@/lib/person-card";

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

type TeamProject = { slug: string; studio: string; studioAvatar: string } | null | undefined;

function CastingTeamList({
  project,
  team,
  casting,
  role,
}: {
  project: TeamProject;
  team: ProjectTeamMember[];
  casting: { cdSlug: string; cdName: string };
  role: RoleId;
}) {
  return (
    <div className="casting-team">
      {project ? (
        <Link href={withRole(`/projects/${project.slug}`, role)} className="casting-team__row">
          <img src={project.studioAvatar} alt="" />
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
              <img src={member.avatar} alt="" />
            ) : (
              <span className="project-team-card__ava" style={{ background: member.bg || "#2c2c2b" }}>
                {member.initials || member.name.slice(0, 2)}
              </span>
            )}
            <div>
              <div className="response-row__name">{member.name}</div>
              <div className="response-row__meta">{member.role}</div>
            </div>
          </>
        );
        if (member.href) {
          return (
            <Link key={`${member.name}-${member.role}`} href={withRole(member.href, role)} className="casting-team__row">
              {inner}
            </Link>
          );
        }
        return (
          <div key={`${member.name}-${member.role}`} className="casting-team__row">
            {inner}
          </div>
        );
      })}
      {!project ? (
        <Link href={withRole(`/people/${casting.cdSlug}`, role)} className="casting-team__row">
          <div>
            <div className="response-row__name">{casting.cdName}</div>
            <div className="response-row__meta">Кастинг-директор</div>
          </div>
        </Link>
      ) : null}
    </div>
  );
}

export function CastingView({ slug }: { slug: string }) {
  const ws = useWorkspace();
  const {
    role,
    cfg,
    ready,
    alreadyApplied,
    applyToCasting,
    toggleSaved,
    saved,
    flash,
    responseCount,
    applications,
    settings,
    bumpRehearsal,
  } = ws;
  const casting = ws.getCasting(decodeSlug(slug));
  const project = casting ? ws.getProject(casting.projectSlug) : null;
  const [tapeFile, setTapeFile] = useState<{ name: string; kind: string; href?: string } | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);

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
  const plan = parsePlan(settings.plan);
  const used = rehearsalsUsed(settings);
  const cap = rehearsalCap(plan);
  const left = rehearsalLeft(plan, used);
  const height = kvValue(VZMETNEV_CARD.params, "Рост") || "180 см";
  const myApp = applications.find((a) => a.castingSlug === casting.slug && a.source === "actor");
  const tapeHref = tapeFile?.href || myApp?.tape?.href;
  const tapeName = tapeFile?.name || myApp?.tape?.title || "Самопроба";
  const tapeKind = tapeFile?.kind || "видео";

  async function keepTape(file: File) {
    try {
      const href = await persistFileUrl(file, "selftape");
      setTapeFile({ name: file.name, kind: fileExt(file.name) || "видео", href });
      return href;
    } catch (err) {
      flash(err instanceof Error ? err.message : "Не удалось сохранить самопробу");
      throw err;
    }
  }

  function openStudio() {
    if (cap <= 0 || left <= 0) {
      if (cap <= 0) flash("Репетиции открываются на Про");
      else flash("Лимит репетиций на этот месяц");
      openPlanModal();
      return;
    }
    setStudioOpen(true);
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash("Ссылка скопирована");
    } catch {
      flash("Не удалось скопировать ссылку");
    }
  }

  return (
    <div className="page-scroll detail-page casting-detail">
      <div className="detail-grid">
        <div className="casting-detail__main">
          <section className="detail-hero">
            <div className="detail-hero__img">
              <img src={casting.media} alt="" />
            </div>
            <div className="detail-hero__body">
              <p className="detail-hero__crumb">{crumb}</p>
              <h1 className="detail-hero__title">
                <span className="casting-detail__role">{casting.title}</span>
                {project ? <span className="casting-detail__film">{project.title}</span> : null}
              </h1>
              {project ? (
                <Link href={withRole(`/projects/${project.slug}`, role)} className="casting-detail__byline">
                  <img src={project.studioAvatar} alt="" />
                  <span>{project.studio}</span>
                </Link>
              ) : (
                <div className="casting-detail__byline">{casting.cdName}</div>
              )}
              <dl className="casting-detail__stats">
                {casting.published ? (
                  <div>
                    <dt>Опубликовано</dt>
                    <dd>{casting.published}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Дедлайн</dt>
                  <dd className="casting-detail__deadline">{casting.deadline}</dd>
                </div>
                {role !== "actor" ? (
                  <div>
                    <dt>Отклики</dt>
                    <dd>
                      {n} {ruWord(n, "отклик", "отклика", "откликов")}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <div className="detail-hero__actions">
                {role === "casting" ? (
                  <Link href={withRole(`/castings/${casting.slug}/responses`, role)} className="btn-primary">
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
              {role === "casting" ? (
                <Link href={withRole(`/castings/${casting.slug}?settings=general`, role)} className="detail-block__link">
                  Править
                </Link>
              ) : null}
            </div>
            <p className="casting-detail__lead">{casting.text}</p>
            {project?.logline ? <p className="casting-detail__logline">{project.logline}</p> : null}
            {casting.facts.length ? (
              <dl className="feed-card__facts casting-detail__facts">
                {casting.facts.map(([k, v]) => (
                  <div className="feed-card__fact" key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>

          {project || team.length ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Команда проекта</h2>
              </div>
              <CastingTeamList project={project} team={team} casting={casting} role={role} />
            </section>
          ) : null}

          {casting.scenes?.length || role === "casting" ? (
            <section className="casting-detail__files">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Сцены для самопробы</h2>
                {role === "casting" ? (
                  <Link href={withRole(`/castings/${casting.slug}?settings=scenes`, role)} className="detail-block__link">
                    Править
                  </Link>
                ) : casting.scenesPdf ? (
                  <a href={casting.scenesPdf} className="detail-block__link" download>
                    Скачать все сцены (.pdf)
                  </a>
                ) : null}
              </div>
              <div className="scenes-list">
                {(casting.scenes ?? []).map((scene) => {
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
              {!casting.scenes?.length && role === "casting" ? (
                <p className="project-empty-note">Сцен пока нет. Добавьте файлы в настройках кастинга.</p>
              ) : (
                <p className="casting-detail__slate">
                  Слейт-стандарт: имя · рост · агентство · {project?.title ?? casting.title} · самопроба.
                  Вертикально, естественный свет, без музыки.
                </p>
              )}
            </section>
          ) : null}

          {role === "actor" ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Ваша самопроба</h2>
                <span className="casting-detail__deadline-hint">до {casting.deadline}</span>
              </div>
              <div className="file-store">
                {role === "actor" && !applied ? (
                  <div className="rehearsal-launch">
                    <button type="button" className="btn-primary" onClick={openStudio}>
                      Репетиция
                    </button>
                    <span>
                      {cap <= 0
                        ? "на Про и Премиум — камера, суфлёр, слейт"
                        : Number.isFinite(left)
                          ? `ещё ${left} из ${cap} в этом месяце`
                          : "безлимит в этом месяце"}
                    </span>
                  </div>
                ) : role === "actor" ? (
                  <div className="rehearsal-launch">
                    <button type="button" className="btn-secondary" onClick={openStudio}>
                      Репетиция
                    </button>
                    <span>отклик уже ушёл — можно снять дубль себе</span>
                  </div>
                ) : null}
                {applied ? (
                  <>
                    <p className="proj-settings-hint" style={{ margin: 0 }}>
                      Самопроба уже в хранилище этого кастинга.
                    </p>
                    <FileStoreRow name={tapeName} kind={tapeKind} href={tapeHref} />
                  </>
                ) : (
                  <>
                    <FileDropzone
                      accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                      multiple={false}
                      maxBytes={200 * 1024 * 1024}
                      title="Перетащите самопробу сюда"
                      hint="MP4 / MOV / WebM · до 200 МБ · желательно 1080p, вертикально, сцены одним файлом"
                      onError={flash}
                      onFiles={(files) => {
                        const file = files[0];
                        if (!file) return;
                        void keepTape(file).catch(() => undefined);
                      }}
                    />
                    {tapeFile ? (
                      <FileStoreRow
                        name={tapeFile.name}
                        kind={tapeFile.kind}
                        href={tapeFile.href}
                        onRemove={() => setTapeFile(null)}
                      />
                    ) : null}
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={!tapeFile}
                      onClick={() => {
                        if (!tapeFile) return;
                        applyToCasting(casting.slug, "selftape", {
                          title: tapeFile.name,
                          poster: "",
                          href: tapeFile.href,
                        });
                      }}
                    >
                      Отправить самопробу
                    </button>
                  </>
                )}
              </div>
            </section>
          ) : null}

          {role === "casting" ? (
            <section className="casting-detail__people">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Кто уже откликнулся · {n}</h2>
                <Link href={withRole(`/castings/${casting.slug}/responses`, role)} className="detail-block__link">
                  Все отклики →
                </Link>
              </div>
              <div className="responses-list">
                {(casting.applicants ?? [])
                  .filter((person) => {
                    const personSlug = person.href?.replace(/^\/people\//, "");
                    if (personSlug) return !liveApps.some((a) => a.actorSlug === personSlug);
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
                  <Link key={app.id} href={withRole(`/responses/${app.id}`, role)} className="response-row">
                    {app.actorAvatar ? (
                      <img src={app.actorAvatar} alt="" />
                    ) : (
                      <span className="project-team-card__ava">{app.actorName.slice(0, 2)}</span>
                    )}
                    <div>
                      <div className="response-row__name">{app.actorName}</div>
                      <div className="response-row__meta">
                        {app.actorMeta ||
                          (app.source === "agent"
                            ? app.note || "Предложение агента"
                            : app.note || "Отклик из «Кадра»")}
                      </div>
                    </div>
                    {app.match ? (
                      <div className="response-row__stat">
                        <strong>{app.match}</strong> совпадение
                      </div>
                    ) : null}
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
            <div className="detail-side__head">
              <div className="detail-side__title">Этапы кастинга</div>
              {role === "casting" ? (
                <Link href={withRole(`/castings/${casting.slug}?settings=timeline`, role)} className="detail-block__link">
                  Править
                </Link>
              ) : null}
            </div>
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

          {role !== "actor" && (casting.docs?.length || role === "casting") ? (
            <section className="detail-side__panel">
              <div className="detail-side__head">
                <div className="detail-side__title">Документы</div>
                {role === "casting" ? (
                  <Link href={withRole(`/castings/${casting.slug}?settings=docs`, role)} className="detail-block__link">
                    Загрузить
                  </Link>
                ) : null}
              </div>
              {casting.docs?.length ? (
                <div className="file-store__list">
                  {casting.docs.map((row) => (
                    <FileStoreRow
                      key={row.label}
                      name={row.label}
                      kind={fileKindLabel(row.label, row.value)}
                      href={row.href}
                    />
                  ))}
                </div>
              ) : (
                <p className="project-empty-note">Документов пока нет. Загрузите файлы в настройках кастинга.</p>
              )}
            </section>
          ) : null}

          {role === "actor" && project ? (
            <section className="detail-side__panel casting-detail__pulse">
              <div className="casting-detail__pulse-body">
                <div className="detail-side__title">
                  {project.studio} · отвечает
                </div>
                <p>
                  Медиана ответа на отклик — <strong>1 день 6 часов</strong>. Конверсия в очные пробы — <strong>14%</strong>.
                </p>
                <Link href={withRole(`/projects/${project.slug}`, role)} className="casting-detail__side-link">
                  К проекту →
                </Link>
              </div>
              <span className="casting-detail__pulse-icon">
                <IconBolt />
              </span>
            </section>
          ) : null}
        </aside>
      </div>
      {studioOpen ? (
        <RehearsalStudio
          casting={casting}
          projectTitle={project?.title}
          actor={{
            name: cfg.name,
            city: cfg.city,
            height,
            agency: "без агентства",
          }}
          left={left}
          cap={cap}
          canSend={!applied}
          onClose={() => setStudioOpen(false)}
          onTake={bumpRehearsal}
          onSend={async (file, duration) => {
            flash("Сохраняю самопробу…");
            const href = await keepTape(file);
            applyToCasting(casting.slug, "selftape", {
              title: file.name,
              poster: "",
              duration,
              href,
            });
            setStudioOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

