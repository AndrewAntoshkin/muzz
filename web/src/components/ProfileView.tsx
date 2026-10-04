"use client";

import Link from "next/link";
import type { PersonProfile } from "@/lib/people";
import { VZMETNEV_CARD, KEVORKOVA_CARD, DEMO_BIOS, demoActorSchedule } from "@/lib/demo-profiles";
import { LINK_LABELS, CONTACT_KINDS, contactHref, assetSrc, initialsOf } from "@/lib/labels";
import { PLAN_META, openPlanModal, personIsStudent, parsePlan, visiblePlan, type PlanId } from "@/lib/plans";
import {
  ageLabel,
  asCard,
  kvValue,
  type Credit,
  type KvPair,
  type PersonCard,
  type Schedule,
  type Showreel,
} from "@/lib/person-card";
import { emptySchedule, eventVisibleInMonth, formatEventWhen, normalizeSchedule, WEEKDAYS } from "@/lib/calendar";
import { availabilityLabel, personAvailability } from "@/lib/workspace";
import { AGENCY_PAGES } from "@/lib/agencies";
import { useEffect, useMemo, useState } from "react";
import { AnketaTabs } from "./AnketaTabs";
import { HideIfOwn, ProfileViewerActions, WriteButton } from "./ProfileViewerActions";
import { MonthCalendar } from "./MonthCalendar";
import { ProfileEditModal, type ProfileEditTab } from "./ProfileEditModal";
import { StatusModal } from "./StatusModal";
import { useWorkspace } from "./useWorkspace";
import { profileSlug, withRole } from "@/lib/roles";
import { useDemoRole } from "./useDemoRole";

const VIDEO_KINDS = new Set(["vimeo", "youtube", "video"]);

function MetaLine({ bits }: { bits: (string | null | undefined)[] }) {
  const shown = bits.filter((bit): bit is string => typeof bit === "string" && bit.length > 0 && !isHttpUrl(bit));
  if (!shown.length) return null;
  return (
    <p className="detail-hero__meta">
      {shown.map((bit, i) => (
        <span key={`${bit}-${i}`}>
          {i === 0 ? <strong>{bit}</strong> : bit}
          {i < shown.length - 1 ? <span> · </span> : null}
        </span>
      ))}
    </p>
  );
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function goLabel(href: string) {
  const compact = href.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  if (compact.length > 32 || compact.includes("/")) return "Перейти";
  return compact;
}

function KvValue({ value }: { value: string }) {
  if (isHttpUrl(value)) {
    return (
      <a className="link-accent" href={value} target="_blank" rel="noopener noreferrer">
        Перейти
      </a>
    );
  }
  return value;
}

function KvList({ rows, stacked }: { rows: KvPair[]; stacked?: boolean }) {
  return (
    <dl className={stacked ? "detail-kv detail-kv--stack" : "detail-kv"}>
      {rows.map((row) => (
        <span key={row.label} style={{ display: "contents" }}>
          <dt>{row.label}</dt>
          <dd>
            <KvValue value={row.value} />
          </dd>
        </span>
      ))}
    </dl>
  );
}

function Filmography({ credits, title = "Фильмография" }: { credits: Credit[]; title?: string }) {
  if (!credits.length) return null;
  const rows = [...credits].sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
  return (
    <section className="detail-block">
      <div className="detail-block__head">
        <h2 className="detail-block__title">{title}</h2>
      </div>
      <div>
        {rows.map((row, i) => (
          <div className="kadr-film-row" key={`${row.year}-${row.title}-${i}`}>
            <span className="kadr-film-row__year">{row.year || "—"}</span>
            <div>
              <div className="kadr-film-row__title">{row.title}</div>
              {row.meta ? <div className="kadr-film-row__meta">{row.meta}</div> : null}
            </div>
            <span className="kadr-film-row__credit">
              {row.credit ? <strong>{row.credit}</strong> : null}
            </span>
            {row.kind ? <span className={row.kind === "Кино" ? "tag tag-blue" : "tag tag-gray"}>{row.kind}</span> : <span />}
          </div>
        ))}
      </div>
    </section>
  );
}

function PhotoLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label="Просмотр фото">
      <button type="button" className="photo-lightbox__backdrop" aria-label="Закрыть" onClick={onClose} />
      <div className="photo-lightbox__stage">
        <button type="button" className="photo-lightbox__close" aria-label="Закрыть" onClick={onClose}>
          ×
        </button>
        <img src={src} alt="" className="photo-lightbox__img" />
      </div>
    </div>
  );
}

function PhotoGrid({ photos }: { photos: PersonProfile["photos"] }) {
  const [openSrc, setOpenSrc] = useState<string | null>(null);
  if (!photos.length) return null;
  return (
    <section className="detail-block">
      <div className="detail-block__head">
        <h2 className="detail-block__title">Фото</h2>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{photos.length}</span>
      </div>
      <div className="kadr-photos">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            className="kadr-photos__btn"
            onClick={() => setOpenSrc(photo.url)}
            aria-label="Открыть фото"
          >
            <img src={photo.url} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      {openSrc ? <PhotoLightbox src={openSrc} onClose={() => setOpenSrc(null)} /> : null}
    </section>
  );
}

function isEducationLabel(label: string) {
  return label.trim().toLowerCase() === "образование";
}

function educationLines(card: PersonCard): string[] {
  const fromParams = card.params?.find((row) => isEducationLabel(row.label))?.value;
  const raw = (card.education || fromParams || "").trim();
  if (!raw) return [];
  return raw
    .split(/\s*;\s*|\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function Anketa({ card }: { card: PersonCard }) {
  const params = (card.params || []).filter((row) => !isEducationLabel(row.label));
  const education = educationLines(card);
  const cols = [
    params.length ? { title: "Параметры", rows: params, key: "params" as const } : null,
    card.appearance?.length ? { title: "Внешность", rows: card.appearance, key: "appearance" as const } : null,
    card.languages?.length ? { title: "Языки", rows: card.languages, key: "languages" as const } : null,
  ].filter(Boolean) as { title: string; rows: KvPair[]; key: "params" | "appearance" | "languages" }[];

  if (!cols.length && !education.length && !card.skills?.length) return null;

  return (
    <section className="detail-block">
      <div className="detail-block__head">
        <h2 className="detail-block__title">Анкета</h2>
      </div>
      {cols.length ? <AnketaTabs cols={cols} /> : null}
      {education.length ? (
        <div className={cols.length ? "kadr-education" : undefined}>
          <h3 className="kadr-anketa__title">Образование</h3>
          <ul className="kadr-education__list">
            {education.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {card.skills?.length ? (
        <div className={cols.length || education.length ? "kadr-skills" : undefined}>
          <h3 className="kadr-anketa__title">Спецнавыки</h3>
          <div className="search-filter__chips">
            {card.skills.map((skill) => (
              <span className="search-chip" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function useVisiblePlan(person: { slug: string; profession?: string | null }) {
  const { cfg } = useDemoRole();
  const { settings } = useWorkspace();
  return visiblePlan(person.slug, person.profession, profileSlug(cfg), parsePlan(settings.plan));
}

function planRingClass(plan: PlanId) {
  return `kadr-avatar plan-ring plan-ring--${plan}`;
}

function heroSectionClass(plan: PlanId) {
  return plan === "premium" ? "detail-hero kadr-profile--premium" : "detail-hero";
}

function Avatar({
  person,
  onOpen,
}: {
  person: PersonProfile;
  onOpen?: (src: string) => void;
}) {
  const plan = useVisiblePlan(person);
  const src = assetSrc(person.imageUrl);
  const initials = person.initials || initialsOf(person.name);
  const ring = planRingClass(plan);
  if (src) {
    if (onOpen) {
      return (
        <button type="button" className="kadr-avatar-btn" onClick={() => onOpen(src)} aria-label="Открыть фото">
          <img className={ring} src={src} alt="" />
        </button>
      );
    }
    return <img className={ring} src={src} alt="" />;
  }
  return (
    <div className={`${ring} kadr-avatar--fallback`} style={{ background: person.bg || "#5C4A45" }}>
      {initials}
    </div>
  );
}

function quotedAgency(name: string) {
  const inner = name.replace(/^«/, "").replace(/»$/, "").trim();
  return `агентство «${inner}»`;
}

function cardFor(person: PersonProfile, patch?: import("@/lib/workspace").ProfilePatch): PersonCard {
  const base = asCard(person.card);
  const card =
    person.slug === "vzmetnev"
      ? { ...base, ...VZMETNEV_CARD, manager: undefined }
      : person.slug === "kevorkova"
        ? { ...base, ...KEVORKOVA_CARD, manager: undefined }
        : base;
  if (!patch) return card;
  return {
    ...card,
    params: patch.params ?? card.params,
    appearance: patch.appearance ?? card.appearance,
    languages: patch.languages ?? card.languages,
    skills: patch.skills ?? card.skills,
    height: kvValue(patch.params ?? card.params, "Рост") || card.height,
    education: patch.education ?? card.education,
    showreel: patch.showreel === null ? undefined : (patch.showreel ?? card.showreel),
    schedule:
      patch.schedule === null
        ? undefined
        : patch.schedule
          ? normalizeSchedule(patch.schedule)
          : card.schedule
            ? normalizeSchedule(card.schedule)
            : undefined,
    credits: patch.credits ?? card.credits,
  };
}

export function ProfileView({ person }: { person: PersonProfile }) {
  const { profilePatches } = useWorkspace();
  const patch = profilePatches[person.slug];
  const card = cardFor(person, patch);
  if (person.profession === "casting") return <CastingLayout person={person} card={card} />;
  if (person.profession === "agent") return <AgentLayout person={person} card={card} />;
  return <ActorLayout person={person} card={card} />;
}

function videoLink(person: PersonProfile) {
  return person.links.find(
    (link) => VIDEO_KINDS.has(link.kind) || /(?:vimeo\.com|youtube\.com|youtu\.be)\b/i.test(link.url),
  );
}

function resolveShowreel(person: PersonProfile, card: PersonCard): (Showreel & { href?: string }) | null {
  if (card.showreel?.poster) return card.showreel;
  const video = videoLink(person);
  if (!video || !person.imageUrl) return null;
  return {
    poster: person.imageUrl,
    title: person.name,
    href: video.url,
  };
}

function ShowreelBlock({ data }: { data: Showreel }) {
  const poster = assetSrc(data.poster);
  if (!poster) return null;
  const inner = (
    <>
      <img className="kadr-showreel__poster" src={poster} alt="" />
      <div className="kadr-showreel__dim" />
      <div className="kadr-showreel__label">Showreel</div>
      {data.duration ? <div className="kadr-showreel__dur">{data.duration}</div> : null}
      <div className="kadr-showreel__play">
        <span className="kadr-showreel__play-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--ss-on-image)" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
      {data.title || data.caption ? (
        <div className="kadr-showreel__caption">
          {data.title ? <div className="kadr-showreel__title">{data.title}</div> : null}
          {data.caption ? <div className="kadr-showreel__sub">{data.caption}</div> : null}
        </div>
      ) : null}
    </>
  );
  return (
    <section className="detail-block kadr-showreel" id="showreel">
      {data.href ? (
        <a className="kadr-showreel__frame" href={data.href} target="_blank" rel="noopener noreferrer">
          {inner}
        </a>
      ) : (
        <div className="kadr-showreel__frame">{inner}</div>
      )}
    </section>
  );
}

function ScheduleBlock({ card, feminine }: { card: PersonCard; feminine: boolean }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const openLabel = feminine ? "Открыта к предложениям" : "Открыт к предложениям";
  const freeLine = feminine ? "Свободна для съёмок" : "Свободен для съёмок";
  const schedule = card.schedule ? normalizeSchedule(card.schedule) : emptySchedule();
  const events = schedule.events.filter((event) => eventVisibleInMonth(event, year, month));
  return (
    <section className="detail-block" id="schedule">
      <div className="detail-block__head">
        <h2 className="detail-block__title">График и доступность</h2>
        <span className="tag tag-green">{openLabel}</span>
      </div>
      <div className="kadr-cal-grid">
        <div>
          <MonthCalendar
            year={year}
            month={month}
            onYearMonth={(nextYear, nextMonth) => {
              setYear(nextYear);
              setMonth(nextMonth);
            }}
            schedule={schedule}
          />
          <div className="kadr-cal-legend">
            <span className="kadr-cal-legend__item">
              <span className="kadr-cal-legend__swatch kadr-cal-legend__swatch--busy" />
              смена
            </span>
            <span className="kadr-cal-legend__item">
              <span className="kadr-cal-legend__swatch kadr-cal-legend__swatch--hold" />
              hold
            </span>
            <span className="kadr-cal-legend__item">
              <span className="kadr-cal-legend__swatch kadr-cal-legend__swatch--today" />
              сегодня
            </span>
          </div>
        </div>
        <ul className="kadr-cal-events">
          {events.length ? (
            events.map((event) => (
              <li key={`${event.start ?? event.when}-${event.title}`}>
                <strong>{formatEventWhen(event)}</strong>
                {event.title ? <> · {event.title}</> : null}
                {event.meta ? <div className="kadr-cal-events__meta">{event.meta}</div> : null}
              </li>
            ))
          ) : (
            <li>{freeLine}</li>
          )}
        </ul>
      </div>
    </section>
  );
}

function ContactsPanel({
  links,
  isOwn,
  onAdd,
}: {
  links: { id: string; kind: string; url: string }[];
  isOwn: boolean;
  onAdd: () => void;
}) {
  const rows = CONTACT_KINDS.map((kind) => {
    const value = links.find((l) => l.kind === kind)?.url.trim() ?? "";
    return { kind, label: LINK_LABELS[kind], value, href: contactHref(kind, value) };
  });
  return (
    <section className="detail-side__panel">
      <div className="detail-side__title">Контакты</div>
      <dl className="detail-kv">
        {rows.map((row) => (
          <span key={row.kind} style={{ display: "contents" }}>
            <dt>{row.label}</dt>
            <dd>
              {row.value && row.href ? (
                <a className="link-accent" href={row.href}>
                  {row.value}
                </a>
              ) : isOwn ? (
                <button type="button" className="kadr-contact-add" onClick={onAdd}>
                  добавить
                </button>
              ) : (
                <span className="kadr-contact-empty">не указан</span>
              )}
            </dd>
          </span>
        ))}
      </dl>
    </section>
  );
}

function HeroTitle({
  person,
  education,
}: {
  person: PersonProfile;
  education?: string | string[] | null;
}) {
  const plan = useVisiblePlan(person);
  const isActor = person.profession === "actor" || person.profession === "actress";
  const student = isActor && personIsStudent(person.slug, education);
  const planBadge = plan === "standard" ? null : PLAN_META[plan].badge;
  return (
    <div className="kadr-hero-title">
      <h1 className="detail-hero__title">{person.name}</h1>
      {planBadge || isActor ? (
        <span className="kadr-hero-chips">
          {planBadge ? <span className={`kadr-plan-pill kadr-plan-pill--${plan}`}>{planBadge}</span> : null}
          {isActor ? (
            <span className={`kadr-kind-chip${student ? " is-student" : ""}`}>{student ? "Студент" : "Проф."}</span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

function ActorLayout({ person, card }: { person: PersonProfile; card: PersonCard }) {
  const { cfg, role } = useDemoRole();
  const { pulses, profilePatches } = useWorkspace();
  const [editOpen, setEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<ProfileEditTab>("about");
  const [statusOpen, setStatusOpen] = useState(false);
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const isOwn = person.slug === profileSlug(cfg);
  const plan = useVisiblePlan(person);
  const patch = profilePatches[person.slug];
  const feminine = person.profession === "actress";
  const height = card.height || kvValue(card.params, "Рост");
  const manager = card.manager;
  const agencyName = person.agencyName;
  const agentName = person.agentName;
  const hasAgency = Boolean(agencyName || agentName);
  const agentSlug = (person.agencyId && AGENCY_PAGES[person.agencyId]?.agentSlug) || "soykina";
  const showreel = resolveShowreel(person, card);
  const pulse = pulses.find((p) => p.personSlug === person.slug);
  const availability = personAvailability(person.slug, pulses);
  const openLabel = availability ? availabilityLabel(availability, feminine) : "Статус не опубликован";
  const agencyLine = agencyName ? quotedAgency(agencyName) : null;
  const bio = patch?.bio ?? person.bio;
  const city = patch?.city ?? person.city;

  const defaults = useMemo(() => {
    // Подстановки из демо-карточки — только для самой демо-персоны; у остальных форма стартует с их собственных данных.
    const demo = person.slug === "vzmetnev" ? VZMETNEV_CARD : undefined;
    return {
      bio: person.bio || (demo ? DEMO_BIOS.vzmetnev : ""),
      city: person.city || "",
      params: card.params || demo?.params || [],
      appearance: card.appearance || demo?.appearance || [],
      languages: card.languages || demo?.languages || [],
      skills: card.skills || demo?.skills || [],
      education: card.education || demo?.education || "",
      showreel: card.showreel || demo?.showreel || { poster: "", title: "" },
      photos: (person.photos.length
        ? person.photos
        : person.imageUrl
          ? [{ id: `${person.slug}-hero`, url: person.imageUrl }]
          : []
      ).map((p) => ({ id: p.id, url: p.url })),
      schedule: normalizeSchedule(card.schedule || (demo ? demoActorSchedule() : emptySchedule())),
      credits: card.credits || demo?.credits || [],
      links: person.links.map((l) => ({ id: l.id, kind: l.kind, url: l.url })),
    };
  }, [person, card]);

  const photos = (patch?.photos
    ? patch.photos.map((p) => ({ id: p.id, personSlug: person.slug, url: p.url, sort: 0 }))
    : person.photos.length
      ? person.photos
      : person.imageUrl
        ? [{ id: `${person.slug}-hero`, personSlug: person.slug, url: person.imageUrl, sort: 0 }]
        : []);
  const links = patch?.links ?? person.links;

  return (
    <div className="page-scroll detail-page">
      <div className="detail-grid">
        <div>
          <section className={heroSectionClass(plan)}>
            <div className="detail-hero__body kadr-hero-body">
              <Avatar person={person} onOpen={setPhotoSrc} />
              <HeroTitle person={person} education={educationLines(card)} />
              <MetaLine bits={[person.role, city, ageLabel(person.birthDate), height, ...(card.heroMeta || [])]} />
              {bio ? (
                <p className="kadr-bio">{bio}</p>
              ) : agencyName && !/^главн/i.test(agencyName) ? (
                <p className="kadr-bio">
                  {person.role}
                  {city ? ` · ${city}` : ""} · {quotedAgency(agencyName)}
                </p>
              ) : null}
              <ProfileViewerActions
                personSlug={person.slug}
                personName={person.name}
                profession={person.profession}
                onEditProfile={() => {
                  setEditTab("about");
                  setEditOpen(true);
                }}
                onEditStatus={() => setStatusOpen(true)}
              />
              {manager ? (
                <div className="callout kadr-manager">
                  <div className="kadr-manager__who">
                    <span className="kadr-manager__ava">{initialsOf(manager.name)}</span>
                    <div>
                      <div className="object-type" style={{ marginBottom: 4 }}>
                        Агент
                      </div>
                      <div className="kadr-manager__name">{manager.name}</div>
                      {manager.org ? <div className="kadr-manager__meta">{manager.org}</div> : null}
                    </div>
                  </div>
                  <WriteButton
                    personSlug={agentSlug}
                    personName={manager.name}
                    profession="agent"
                    label="Написать агенту"
                    primary
                    className="kadr-manager__write"
                  />
                </div>
              ) : !hasAgency ? (
                <div className="callout kadr-manager kadr-manager--solo">
                  <div>
                    <div className="object-type" style={{ marginBottom: 4 }}>
                      Представительство
                    </div>
                    <div className="kadr-manager__name">Без агента</div>
                    <div className="kadr-manager__meta">Пишите напрямую</div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <Anketa card={card} />
          {showreel ? <ShowreelBlock data={showreel} /> : null}
          <Filmography credits={card.credits || []} />
          <PhotoGrid photos={photos} />
          {card.schedule ? <ScheduleBlock card={card} feminine={feminine} /> : null}
        </div>

        <aside className="detail-side">
          {isOwn ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Настроить профиль</div>
              <button
                type="button"
                className="btn-primary btn-block"
                onClick={() => {
                  setEditTab("about");
                  setEditOpen(true);
                }}
              >
                Открыть настройки
              </button>
              <p className="profile-pulse-side">
                Анкета, образование, шоурил, фото, график и фильмография
              </p>
            </section>
          ) : null}
          {isOwn ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Подписка</div>
              <p className="profile-pulse-side" style={{ marginTop: 0 }}>
                Сейчас {PLAN_META[plan].name}
                {plan === "standard" ? " · бесплатно" : " · до 4 октября"}
              </p>
              <button type="button" className="btn-secondary btn-block" onClick={() => openPlanModal()}>
                Все тарифы
              </button>
            </section>
          ) : null}
          <section className="detail-side__panel kadr-open-panel">
            <div className="detail-side__title kadr-open-title">{openLabel}</div>
            {isOwn ? (
              <button type="button" className="btn-primary btn-block" onClick={() => setStatusOpen(true)}>
                Обновить статус
              </button>
            ) : (
              <button type="button" className="btn-primary btn-block">
                Запросить доступность
              </button>
            )}
            {pulse?.text ? <p className="profile-pulse-side">{pulse.text}</p> : null}
          </section>
          {hasAgency ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Агентство</div>
              {person.agencyId ? (
                <Link href={withRole(`/agencies/${person.agencyId}`, role)} className="agency-door agency-door--side">
                  <span className="agency-door__name">{agencyName ? `«${agencyName.replace(/^«/, "").replace(/»$/, "")}»` : "Агентство"}</span>
                  {agentName ? <span className="agency-door__meta">{agentName}</span> : null}
                </Link>
              ) : agentName ? (
                <div className="kadr-side-person">
                  <span className="project-team-card__ava" style={{ background: "#3D6D99", width: 36, height: 36, fontSize: 11 }}>
                    {initialsOf(agentName)}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{agentName}</div>
                    {agencyLine ? (
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{agencyLine}</div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div style={{ fontWeight: 600, fontSize: 14 }}>{agencyName}</div>
              )}
              {person.agentEmail ? (
                <a href={`mailto:${person.agentEmail}`} className="btn-secondary btn-block" style={{ marginTop: 8 }}>
                  Написать агенту
                </a>
              ) : null}
            </section>
          ) : null}
          <ContactsPanel
            links={links}
            isOwn={isOwn}
            onAdd={() => {
              setEditTab("links");
              setEditOpen(true);
            }}
          />
        </aside>
      </div>
      {editOpen ? (
        <ProfileEditModal
          personSlug={person.slug}
          initial={patch || {}}
          defaults={defaults}
          initialTab={editTab}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
      {statusOpen ? <StatusModal onClose={() => setStatusOpen(false)} /> : null}
      {photoSrc ? <PhotoLightbox src={photoSrc} onClose={() => setPhotoSrc(null)} /> : null}
    </div>
  );
}

function CastingLayout({ person, card }: { person: PersonProfile; card: PersonCard }) {
  const plan = useVisiblePlan(person);
  const { castingsForCd, projectsForCd, getProject } = useWorkspace();
  const activeCastings = castingsForCd(person.slug).filter((c) => c.status !== "closed");
  const cdProjects = projectsForCd(person.slug);

  return (
    <div className="page-scroll detail-page">
      <div className="detail-grid">
        <div>
          <section className={heroSectionClass(plan)}>
            <div className="detail-hero__body kadr-hero-body">
              <Avatar person={person} />
              <HeroTitle person={person} />
              <MetaLine bits={[person.role, person.city, ...(card.heroMeta || [])]} />
              {person.bio ? <p className="kadr-bio">{person.bio}</p> : null}
              <ProfileViewerActions personSlug={person.slug} personName={person.name} profession={person.profession} />
            </div>
          </section>

          {card.stats?.length ? (
            <section className="kadr-stats-section" aria-label="Показатели">
              {card.stats.map((stat) => (
                <div className="studio-stat" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </section>
          ) : null}

          {activeCastings.length ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Активные кастинги</h2>
              </div>
              <div className="responses-list">
                {activeCastings.map((row) => {
                  const project = getProject(row.projectSlug);
                  return (
                    <Link
                      key={row.slug}
                      href={`/castings/${row.slug}`}
                      className="response-row"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <img
                        src={row.media}
                        alt=""
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }}
                      />
                      <div>
                        <div className="response-row__name">{row.title}</div>
                        <div className="response-row__meta">
                          {project ? `${project.title} · ${row.meta}` : row.meta}
                        </div>
                      </div>
                      <div className="response-row__stat">
                        <strong>{row.responses}</strong> откликов
                      </div>
                      {row.urgent ? <span className="tag tag-orange">Срочно</span> : <span className="tag tag-blue">Открыто</span>}
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}

          {cdProjects.length ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Проекты</h2>
              </div>
              <div>
                {cdProjects.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/projects/${p.slug}`}
                    className="kadr-film-row"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <span className="kadr-film-row__year">{p.year || "—"}</span>
                    <div>
                      <div className="kadr-film-row__title">{p.title}</div>
                      <div className="kadr-film-row__meta">
                        {p.studio} · {p.platform} · {p.status}
                      </div>
                    </div>
                    <span className="kadr-film-row__credit">
                      <strong>CD</strong>
                    </span>
                    <span className={p.kind.toLowerCase().includes("сериал") ? "tag tag-gray" : "tag tag-blue"}>
                      {p.kind.split(" · ")[0]}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <Filmography credits={card.credits || []} title="Фильмография" />
          )}

          {cdProjects.length && card.credits?.length ? (
            <Filmography credits={card.credits} title="Фильмография" />
          ) : null}
        </div>

        <aside className="detail-side">
          {card.terms?.length ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Контакты</div>
              <KvList rows={card.terms} />
            </section>
          ) : null}
          {card.chips?.length ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Специализация</div>
              <div className="search-filter__chips">
                {card.chips.map((chip, i) => (
                  <span className={i < 4 ? "search-chip is-on" : "search-chip"} key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
          {card.clients?.length ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Регулярные клиенты</div>
              {card.clients.map((client) => (
                <div className="response-row" key={client.name} style={{ gridTemplateColumns: "1fr", padding: "6px 0", border: "none" }}>
                  <div>
                    <div className="response-row__name">{client.name}</div>
                    {client.meta ? <div className="response-row__meta">{client.meta}</div> : null}
                  </div>
                </div>
              ))}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function AgentLayout({ person, card }: { person: PersonProfile; card: PersonCard }) {
  const { role, cfg } = useDemoRole();
  const isOwn = person.slug === profileSlug(cfg);
  const plan = useVisiblePlan(person);
  const agencyHref = person.agencyId ? `/agencies/${person.agencyId}` : null;

  return (
    <div className="page-scroll detail-page">
      <div className="detail-grid">
        <div>
          <section className={heroSectionClass(plan)}>
            <div className="detail-hero__body kadr-hero-body">
              <Avatar person={person} />
              <HeroTitle person={person} />
              <MetaLine bits={[person.role, person.agencyName ? `агентство «${person.agencyName}»` : null, person.city]} />
              {person.bio ? <p className="kadr-bio">{person.bio}</p> : null}
              <ProfileViewerActions personSlug={person.slug} personName={person.name} profession={person.profession} agencyId={person.agencyId} />
            </div>
          </section>

          {card.stats?.length ? (
            <section className="kadr-stats-section" aria-label="Показатели">
              {card.stats.map((stat) => (
                <div className="studio-stat" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </section>
          ) : null}

          {agencyHref ? (
            <section className="detail-block">
              <Link href={withRole(agencyHref, role)} className="agency-door">
                <span className="agency-door__kicker">Агентство</span>
                <span className="agency-door__name">«{person.agencyName || "Агентство"}»</span>
                <span className="agency-door__meta">
                  {[person.city, person.agencyWebsite ? goLabel(person.agencyWebsite) : null].filter(Boolean).join(" · ")}
                  {" · ростер и размещения"}
                </span>
              </Link>
            </section>
          ) : null}

          {card.clients?.length ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Артисты</h2>
              </div>
              {card.clients.map((client) => (
                <div className="response-row" key={client.name} style={{ gridTemplateColumns: "1fr", padding: "10px 0" }}>
                  <div>
                    <div className="response-row__name">{client.name}</div>
                    {client.meta ? <div className="response-row__meta">{client.meta}</div> : null}
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          <Filmography credits={card.credits || []} title="Кастинг" />

          {isOwn && card.castings?.length ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Запросы в работе</h2>
              </div>
              <div className="brief-list">
                {card.castings.map((row) => (
                  <Link key={row.title} href={withRole(row.href || "/castings", role)} className="brief-row">
                    <span>
                      <span className="brief-row__title">{row.title}</span>
                      <span className="brief-row__meta">
                        {row.meta}
                        {row.count ? ` · ${row.count} кандидатов` : ""}
                      </span>
                    </span>
                    {row.tag ? <span className="tag tag-blue">{row.tag}</span> : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
        <aside className="detail-side">
          <HideIfOwn personSlug={person.slug}>
            <section className="detail-side__panel kadr-open-panel">
              <div className="detail-side__title kadr-open-title">Открыта к запросам</div>
              <Link href={withRole(agencyHref || "/search", role)} className="btn-primary btn-block">
                Запросить актёра
              </Link>
            </section>
          </HideIfOwn>
          {card.terms?.length ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Контакты</div>
              <KvList rows={card.terms} stacked />
            </section>
          ) : null}
          {card.chips?.length ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Специализация</div>
              <div className="search-filter__chips">
                {card.chips.map((chip, i) => (
                  <span className={i < 4 ? "search-chip is-on" : "search-chip"} key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

