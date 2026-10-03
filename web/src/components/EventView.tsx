"use client";

import Link from "next/link";
import { Fragment } from "react";
import { withRole } from "@/lib/roles";
import type { IndustryEvent } from "@/lib/events";
import { useAuth } from "./AuthProvider";
import { useWorkspace } from "./useWorkspace";

function FactList({ rows }: { rows: { label: string; value: string }[] }) {
  if (!rows.length) return null;
  return (
    <dl className="feed-card__facts casting-detail__facts">
      {rows.map((row) => (
        <div className="feed-card__fact" key={`${row.label}-${row.value}`}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EventView({ event }: { event: IndustryEvent }) {
  const { role } = useAuth();
  const { toggleSaved, saved, flash } = useWorkspace();
  const savedKey = `event:${event.slug}`;
  const isSaved = saved.includes(savedKey);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash("Ссылка скопирована");
    } catch {
      flash("Не удалось скопировать ссылку");
    }
  }

  return (
    <div className="page-scroll detail-page event-detail">
      <div className="detail-grid">
        <div>
          <section className="detail-hero project-hero">
            <div className="detail-hero__body">
              <div className="project-hero__tags">
                <span className="tag tag-blue">{event.tag}</span>
                <span className="tag tag-gray">{event.kicker}</span>
              </div>
              <h1 className="detail-hero__title">{event.title}</h1>
              <div className="detail-hero__meta project-hero-meta">
                <p className="project-hero-meta__facts">
                  <span>{event.when}</span>
                  <span className="project-hero-meta__dot">·</span>
                  <span>{event.city}</span>
                  <span className="project-hero-meta__dot">·</span>
                  <span>{event.organizer}</span>
                </p>
              </div>
              <p className="project-logline">{event.summary}</p>
              <div className="detail-hero__actions">
                <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  {event.cta}
                </a>
                <button
                  type="button"
                  className={`btn-secondary${isSaved ? " is-on" : ""}`}
                  onClick={() => toggleSaved(savedKey)}
                >
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
              <h2 className="detail-block__title">О мероприятии</h2>
            </div>
            {event.about.map((p) => (
              <p className="project-logline-note" key={p.slice(0, 48)}>
                {p}
              </p>
            ))}
            <FactList rows={event.facts} />
          </section>

          <section className="detail-block">
            <div className="detail-block__head">
              <h2 className="detail-block__title">Программа</h2>
            </div>
            <div className="event-program">
              {event.program.map((item) => (
                <div className="event-program__row" key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          {event.people.length ? (
            <section className="detail-block">
              <div className="detail-block__head">
                <h2 className="detail-block__title">Кто ведёт</h2>
              </div>
              <div className="casting-team">
                {event.people.map((person) => {
                  const inner = (
                    <>
                      <span className="project-team-card__ava" style={{ background: "#3D5C4A" }}>
                        {person.name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join("")}
                      </span>
                      <div>
                        <div className="response-row__name">{person.name}</div>
                        <div className="response-row__meta">{person.role}</div>
                      </div>
                    </>
                  );
                  if (person.href) {
                    return (
                      <Link key={person.name} href={withRole(person.href, role)} className="casting-team__row">
                        {inner}
                      </Link>
                    );
                  }
                  return (
                    <div key={person.name} className="casting-team__row">
                      {inner}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="detail-side">
          <section className="detail-side__panel">
            <h3 className="detail-side__title">Где и когда</h3>
            <dl className="detail-kv">
              <dt>Даты</dt>
              <dd>{event.when}</dd>
              <dt>Город</dt>
              <dd>{event.city}</dd>
              <dt>Площадка</dt>
              <dd>{event.venue}</dd>
              <dt>Организатор</dt>
              <dd>{event.organizer}</dd>
            </dl>
          </section>
          <section className="detail-side__panel">
            <h3 className="detail-side__title">Контакты</h3>
            <dl className="detail-kv">
              {event.contacts.map((row) => (
                <Fragment key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </Fragment>
              ))}
            </dl>
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="casting-detail__side-link"
            >
              {event.sourceLabel} →
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
