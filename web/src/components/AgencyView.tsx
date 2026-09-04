"use client";

import Link from "next/link";
import type { AgencyPage } from "@/lib/agencies";
import type { FaceCard, PersonProfile } from "@/lib/people";
import { assetSrc, initialsOf } from "@/lib/labels";
import { profileSlug, withRole } from "@/lib/roles";
import { PersonCard } from "./PersonCard";
import { useAuth } from "./AuthProvider";
import { WriteButton } from "./ProfileViewerActions";

export function AgencyView({
  agency,
  roster,
  featured,
  agent,
}: {
  agency: AgencyPage;
  roster: FaceCard[];
  featured: FaceCard[];
  agent: PersonProfile | null;
}) {
  const { role, cfg } = useAuth();
  const isOwnAgency = role === "agent" && profileSlug(cfg) === agency.agentSlug;
  const rosterHref = isOwnAgency ? "/search?mine=1" : `/search?agency=${agency.id}`;
  const faces = featured.length ? featured : roster.slice(0, 8);
  const rosterCount = Math.max(roster.length, Number.parseInt(agency.stats[0]?.value || "0", 10) || faces.length);
  const agentSrc = assetSrc(agent?.imageUrl);
  const agentInitials = agent ? agent.initials || initialsOf(agent.name) : "";

  return (
    <div className="page-scroll detail-page agency-page">
      <section className="agency-hero">
        <div className="agency-mark" aria-hidden>
          А1
        </div>
        <div>
          <p className="agency-kicker">Актёрское агентство</p>
          <h1 className="agency-title">«{agency.name}»</h1>
          <p className="agency-meta">
            {agency.city} · с {agency.founded} · {rosterCount} в ростере
          </p>
          <p className="agency-about">{agency.about}</p>
        </div>
      </section>

      <section className="kadr-stats-section" aria-label="Показатели">
        {agency.stats.map((stat) => (
          <div className="studio-stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <div className="detail-grid">
        <div>
          {agent ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Агент</h2>
              </div>
              <div className="agency-agent-row">
                <Link href={withRole(`/people/${agent.slug}`, role)} className="agency-agent">
                  {agentSrc ? (
                    <img src={agentSrc} alt="" />
                  ) : (
                    <span className="agency-agent__ava">{agentInitials}</span>
                  )}
                  <span className="agency-agent__text">
                    <span className="agency-agent__name">{agent.name}</span>
                    <span className="agency-agent__role">Ведущий агент · {agency.city}</span>
                  </span>
                </Link>
                {isOwnAgency ? (
                  <Link href={withRole(`/people/${agent.slug}`, role)} className="btn-secondary">
                    Мой профиль
                  </Link>
                ) : (
                  <WriteButton
                    personSlug={agent.slug}
                    label={role === "casting" ? "Запросить актёра" : "Написать агенту"}
                    primary
                  />
                )}
              </div>
            </section>
          ) : null}

          <section className="detail-block" id="agency-roster">
            <div className="detail-block__head">
              <h2 className="detail-block__title">Ростер</h2>
              <Link href={withRole(rosterHref, role)} className="detail-block__link">
                Все {rosterCount}
              </Link>
            </div>
            {faces.length ? (
              <div className="agency-roster faces-grid">
                {faces.map((person) => (
                  <PersonCard key={person.slug} person={person} />
                ))}
              </div>
            ) : (
              <p className="agency-empty">Ростер пока не загружен.</p>
            )}
          </section>

          {agency.placements.length ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Размещения</h2>
              </div>
              <div className="agency-places">
                {agency.placements.map((row) => (
                  <div className="agency-place" key={`${row.year}-${row.title}`}>
                    <span className="agency-place__year">{row.year}</span>
                    <div>
                      <div className="agency-place__title">{row.title}</div>
                      <div className="agency-place__meta">{row.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="detail-side">
          {agency.platforms.length ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Площадки</div>
              <div className="agency-platforms">
                {agency.platforms.map((p) => (
                  <div className="agency-platform" key={p.name} title={p.name}>
                    <img src={p.logo} alt={p.name} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {agency.chips.length ? (
            <section className="detail-side__panel">
              <div className="detail-side__title">Специализация</div>
              <div className="search-filter__chips">
                {agency.chips.map((chip, i) => (
                  <span className={i < 3 ? "search-chip is-on" : "search-chip"} key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="detail-side__panel">
            <div className="detail-side__title">Контакты</div>
            <div className="agency-contacts">
              {agency.contacts.map((row) => (
                <div className="agency-contact" key={row.label}>
                  <div className="agency-contact__label">{row.label}</div>
                  <div className="agency-contact__value">
                    {row.href ? (
                      <a className="link-accent" href={row.href} {...(row.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
