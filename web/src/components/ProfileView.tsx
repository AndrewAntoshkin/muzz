import Link from "next/link";
import type { PersonProfile } from "@/lib/people";
import { VZMETNEV_CARD } from "@/lib/demo-profiles";
import { LINK_LABELS, assetSrc, initialsOf } from "@/lib/labels";
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
import { castingsForCd, getProject, projectsForCd } from "@/lib/productions";
import { AnketaTabs } from "./AnketaTabs";
import { IconVerified } from "./icons";
import { HideIfOwn, ProfileViewerActions } from "./ProfileViewerActions";

const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const VIDEO_KINDS = new Set(["vimeo", "youtube", "video"]);

function VerifiedBadge({ feminine }: { feminine?: boolean }) {
  const label = feminine ? "Проверена" : "Проверен";
  return (
    <span className="kadr-verified" title={label} aria-label={label}>
      <IconVerified />
    </span>
  );
}

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

function PhotoGrid({ photos }: { photos: PersonProfile["photos"] }) {
  if (!photos.length) return null;
  return (
    <section className="detail-block">
      <div className="detail-block__head">
        <h2 className="detail-block__title">Фото</h2>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{photos.length}</span>
      </div>
      <div className="kadr-photos">
        {photos.map((photo) => (
          <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
            <img src={photo.url} alt="" loading="lazy" />
          </a>
        ))}
      </div>
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
    params.length ? { title: "Параметры", rows: params } : null,
    card.appearance?.length ? { title: "Внешность", rows: card.appearance } : null,
    card.languages?.length ? { title: "Языки", rows: card.languages } : null,
  ].filter(Boolean) as { title: string; rows: KvPair[] }[];

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

function Avatar({ person }: { person: PersonProfile }) {
  const src = assetSrc(person.imageUrl);
  const initials = person.initials || initialsOf(person.name);
  if (src) return <img className="kadr-avatar" src={src} alt="" />;
  return (
    <div className="kadr-avatar kadr-avatar--fallback" style={{ background: person.bg || "#5C4A45" }}>
      {initials}
    </div>
  );
}

function quotedAgency(name: string) {
  const inner = name.replace(/^«/, "").replace(/»$/, "").trim();
  return `агентство «${inner}»`;
}

function cardFor(person: PersonProfile): PersonCard {
  const card = asCard(person.card);
  if (person.slug !== "vzmetnev") return card;
  return {
    ...card,
    showreel: card.showreel ?? VZMETNEV_CARD.showreel,
    schedule: card.schedule ?? VZMETNEV_CARD.schedule,
  };
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="hsla(0,0%,97%,0.95)" aria-hidden>
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

function juneDays(schedule: Schedule) {
  const days: { n: number; cls: string }[] = [26, 27, 28, 29, 30, 31].map((n) => ({ n, cls: "off" }));
  for (let d = 1; d <= 29; d++) {
    const bits: string[] = [];
    if (schedule.busy.includes(d)) bits.push("busy");
    if (schedule.hold.includes(d)) bits.push("hold");
    if (schedule.today === d) bits.push("today");
    days.push({ n: d, cls: bits.join(" ") });
  }
  return days;
}

function currentMonthDays() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const today = now.getDate();
  let pad = first.getDay() - 1;
  if (pad < 0) pad = 6;
  const prevLast = new Date(year, month, 0).getDate();
  const days: { n: number; cls: string }[] = [];
  for (let i = pad; i > 0; i--) days.push({ n: prevLast - i + 1, cls: "off" });
  for (let d = 1; d <= last.getDate(); d++) days.push({ n: d, cls: d === today ? "today" : "" });
  return days;
}

function ScheduleBlock({ card, feminine }: { card: PersonCard; feminine: boolean }) {
  const openLabel = feminine ? "Открыта к предложениям" : "Открыт к предложениям";
  const freeLine = feminine ? "Свободна для съёмок" : "Свободен для съёмок";
  const schedule = card.schedule;
  const days = schedule ? juneDays(schedule) : currentMonthDays();
  return (
    <section className="detail-block" id="schedule">
      <div className="detail-block__head">
        <h2 className="detail-block__title">График и доступность</h2>
        <span className="tag tag-green">{openLabel}</span>
      </div>
      <div className="kadr-cal-grid">
        <div>
          <div className="mini-cal">
            {WEEKDAYS.map((day) => (
              <span className="mini-cal__h" key={day}>
                {day}
              </span>
            ))}
            {days.map((day, i) => (
              <span className={day.cls ? `mini-cal__d ${day.cls}` : "mini-cal__d"} key={`${day.n}-${i}`}>
                {day.n}
              </span>
            ))}
          </div>
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
          {schedule?.events?.length ? (
            schedule.events.map((event) => (
              <li key={`${event.when}-${event.title}`}>
                <strong>{event.when}</strong> · {event.title}
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

function ActorLayout({ person, card }: { person: PersonProfile; card: PersonCard }) {
  const feminine = person.profession === "actress";
  const height = card.height || kvValue(card.params, "Рост");
  const manager = card.manager;
  const agencyName = person.agencyName;
  const agentName = person.agentName;
  const hasAgency = Boolean(agencyName || agentName);
  const showreel = resolveShowreel(person, card);
  const openLabel = feminine ? "Открыта к предложениям" : "Открыт к предложениям";
  const agencyLine = agencyName ? quotedAgency(agencyName) : null;

  return (
    <div className="page-scroll detail-page">
      <div className="detail-grid">
        <div>
          <section className="detail-hero">
            <div className="detail-hero__body kadr-hero-body">
              <Avatar person={person} />
              <div className="kadr-hero-title">
                <h1 className="detail-hero__title">{person.name}</h1>
                {person.verified ? <VerifiedBadge feminine={feminine} /> : null}
              </div>
              <MetaLine bits={[person.role, person.city, ageLabel(person.birthDate), height, ...(card.heroMeta || [])]} />
              {person.bio ? (
                <p className="kadr-bio">{person.bio}</p>
              ) : agencyName && !/^главн/i.test(agencyName) ? (
                <p className="kadr-bio">
                  {person.role}
                  {person.city ? ` · ${person.city}` : ""} · {quotedAgency(agencyName)}
                </p>
              ) : null}
              <div className="detail-hero__actions">
                <button type="button" className="btn-primary">
                  Пригласить на кастинг
                </button>
                <button type="button" className="btn-secondary">
                  Запросить доступность
                </button>
                {person.sourceUrl ? (
                  <a href={person.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                    Анкета агентства
                  </a>
                ) : null}
              </div>
              {manager ? (
                <div className="callout kadr-manager">
                  <div className="kadr-manager__who">
                    <span className="kadr-manager__ava">{initialsOf(manager.name)}</span>
                    <div>
                      <div className="object-type" style={{ marginBottom: 4 }}>
                        Менеджер
                      </div>
                      <div className="kadr-manager__name">{manager.name}</div>
                      {manager.org ? <div className="kadr-manager__meta">{manager.org}</div> : null}
                    </div>
                  </div>
                  <div className="kadr-manager__actions">
                    {manager.email ? (
                      <a href={`mailto:${manager.email}`} className="btn-primary">
                        Написать менеджеру
                      </a>
                    ) : null}
                    {manager.phone ? (
                      <a href={`tel:${manager.phone.replace(/[^\d+]/g, "")}`} className="btn-secondary">
                        {manager.phone}
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <Anketa card={card} />
          {showreel ? <ShowreelBlock data={showreel} /> : null}
          <Filmography credits={card.credits || []} />
          <PhotoGrid
            photos={
              person.photos.length
                ? person.photos
                : person.imageUrl
                  ? [{ id: `${person.slug}-hero`, personSlug: person.slug, url: person.imageUrl, sort: 0 }]
                  : []
            }
          />
          {card.schedule ? <ScheduleBlock card={card} feminine={feminine} /> : null}
        </div>

        <aside className="detail-side">
          <section className="detail-side__panel kadr-open-panel">
            <div className="detail-side__title kadr-open-title">{openLabel}</div>
            <button type="button" className="btn-primary btn-block">
              Запросить доступность
            </button>
          </section>
          {hasAgency ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Агентство</div>
              {agentName ? (
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
              {person.agencyWebsite ? (
                <a href={person.agencyWebsite} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-block" style={{ marginTop: 8 }}>
                  Сайт агентства
                </a>
              ) : person.sourceUrl ? (
                <a href={person.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-block" style={{ marginTop: 8 }}>
                  Источник анкеты
                </a>
              ) : null}
            </section>
          ) : null}
          {person.links.length ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Контакты</div>
              <dl className="detail-kv">
                {person.links.map((link) => (
                  <span key={link.id} style={{ display: "contents" }}>
                    <dt>{LINK_LABELS[link.kind] || link.kind}</dt>
                    <dd>
                      <a className="link-accent" href={link.url} target="_blank" rel="noopener noreferrer">
                        Перейти
                      </a>
                    </dd>
                  </span>
                ))}
              </dl>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function CastingLayout({ person, card }: { person: PersonProfile; card: PersonCard }) {
  const activeCastings = castingsForCd(person.slug);
  const cdProjects = projectsForCd(person.slug);

  return (
    <div className="page-scroll detail-page">
      <div className="detail-grid">
        <div>
          <section className="detail-hero">
            <div className="detail-hero__body kadr-hero-body">
              <Avatar person={person} />
              <div className="kadr-hero-title">
                <h1 className="detail-hero__title">{person.name}</h1>
                {person.verified ? <VerifiedBadge feminine /> : null}
              </div>
              <MetaLine bits={[person.role, person.city, ...(card.heroMeta || [])]} />
              {person.bio ? <p className="kadr-bio">{person.bio}</p> : null}
              <ProfileViewerActions personSlug={person.slug} profession={person.profession} />
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
            <Filmography credits={card.credits || []} title="Закрытые проекты" />
          )}
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
  return (
    <div className="page-scroll detail-page">
      <div className="detail-grid">
        <div>
          <section className="detail-hero">
            <div className="detail-hero__body kadr-hero-body">
              <Avatar person={person} />
              <div className="kadr-hero-title">
                <h1 className="detail-hero__title">{person.name}</h1>
                {person.verified ? <VerifiedBadge feminine /> : null}
              </div>
              <MetaLine bits={[person.role, ...(card.heroMeta || []), person.city]} />
              {person.bio ? <p className="kadr-bio">{person.bio}</p> : null}
              <ProfileViewerActions personSlug={person.slug} profession={person.profession} />
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

          <section className="detail-block">
            <div className="detail-block__head">
              <h2 className="detail-block__title">Агентство</h2>
            </div>
            <dl className="detail-kv">
              {person.agencyName ? (
                <>
                  <dt>Агентство</dt>
                  <dd>{person.agencyName}</dd>
                </>
              ) : null}
              {person.city ? (
                <>
                  <dt>Город</dt>
                  <dd>{person.city}</dd>
                </>
              ) : null}
              {person.agencyWebsite ? (
                <>
                  <dt>Сайт</dt>
                  <dd>
                    <a className="link-accent" href={person.agencyWebsite} target="_blank" rel="noopener noreferrer">
                      {goLabel(person.agencyWebsite)}
                    </a>
                  </dd>
                </>
              ) : null}
              {person.agentEmail ? (
                <>
                  <dt>Почта</dt>
                  <dd>
                    <a className="link-accent" href={`mailto:${person.agentEmail}`}>
                      {person.agentEmail}
                    </a>
                  </dd>
                </>
              ) : null}
            </dl>
          </section>
        </div>
        <aside className="detail-side">
          <HideIfOwn personSlug={person.slug}>
            <section className="detail-side__panel kadr-open-panel">
              <div className="detail-side__title kadr-open-title">Открыта к запросам</div>
              <button type="button" className="btn-primary btn-block">
                Запросить актёра
              </button>
            </section>
          </HideIfOwn>
        </aside>
      </div>
    </div>
  );
}

export function ProfileView({ person }: { person: PersonProfile }) {
  const card = cardFor(person);
  if (person.profession === "casting") return <CastingLayout person={person} card={card} />;
  if (person.profession === "agent") return <AgentLayout person={person} card={card} />;
  return <ActorLayout person={person} card={card} />;
}
