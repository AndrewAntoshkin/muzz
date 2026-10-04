"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FaceCard } from "@/lib/people";
import { fetchFaces } from "@/lib/people-query";
import { peopleCountLabel } from "@/lib/labels";
import { withRole } from "@/lib/roles";
import { CatalogSearchField } from "./CatalogFilterBar";
import { PersonCard } from "./PersonCard";
import { useAuth } from "./AuthProvider";

const PAGE = 48;

/**
 * Generic agency page for ids that only exist in the `agencies` table. Roster is paged
 * (kinolift alone has ~18k people): first page comes from the server, the rest via
 * /api/people?agency=<id> with "Показать ещё".
 */
export function AgencyRosterView({
  agencyId,
  title,
  kicker,
  about,
  website,
  websiteLabel,
  isSource,
  initial,
  total,
}: {
  agencyId: string;
  title: string;
  kicker: string;
  about: string;
  website: string | null;
  websiteLabel: string;
  isSource: boolean;
  initial: FaceCard[];
  total: number;
}) {
  const { role } = useAuth();
  const [q, setQ] = useState("");
  const [items, setItems] = useState(initial);
  const [count, setCount] = useState(total);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      setFailed(false);
      void fetchFaces({ q, agency: agencyId, kind: "actors", limit: PAGE, offset: 0 })
        .then((data) => {
          if (ac.signal.aborted) return;
          setItems(data.items);
          setCount(data.total);
        })
        .catch(() => {
          if (!ac.signal.aborted) setFailed(true);
        });
    }, 250);
    return () => {
      ac.abort();
      window.clearTimeout(timer);
    };
  }, [q, agencyId]);

  async function more() {
    setLoading(true);
    setFailed(false);
    try {
      const data = await fetchFaces({ q, agency: agencyId, kind: "actors", limit: PAGE, offset: items.length });
      setItems((cur) => {
        const have = new Set(cur.map((p) => p.slug));
        return [...cur, ...data.items.filter((p) => !have.has(p.slug))];
      });
      setCount(data.total);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const mark = title
    .replace(/[«»"]/g, "")
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="page-scroll detail-page agency-page">
      <section className="agency-hero">
        <div className="agency-mark" aria-hidden>
          {mark}
        </div>
        <div>
          <p className="agency-kicker">{kicker}</p>
          <h1 className="agency-title">{title}</h1>
          <p className="agency-meta">
            {total} {isSource ? "в каталоге" : "в ростере"}
            {website ? (
              <>
                {" · "}
                <a className="link-accent" href={website} target="_blank" rel="noopener noreferrer">
                  {websiteLabel}
                </a>
              </>
            ) : null}
          </p>
          <p className="agency-about">{about}</p>
        </div>
      </section>

      <section className="detail-block" id="agency-roster">
        <div className="detail-block__head">
          <h2 className="detail-block__title">{isSource ? "Профили" : "Ростер"}</h2>
          <span className="detail-block__link" style={{ pointerEvents: "none" }}>
            {peopleCountLabel(count)}
          </span>
        </div>
        {total > PAGE ? (
          <CatalogSearchField value={q} onChange={setQ} placeholder="Имя или город…" ariaLabel="Поиск по ростеру" />
        ) : null}
        {items.length ? (
          <div className="agency-roster faces-grid" aria-live="polite">
            {items.map((person) => (
              <PersonCard key={person.slug} person={person} />
            ))}
          </div>
        ) : (
          <p className="agency-empty">{q ? "Никого не найдено." : "Ростер пока не загружен."}</p>
        )}
        {items.length < count ? (
          <button
            type="button"
            className="btn-secondary"
            style={{ margin: "20px auto", display: "block" }}
            disabled={loading}
            onClick={() => void more()}
          >
            {loading ? "Загрузка…" : `Показать ещё (${count - items.length})`}
          </button>
        ) : null}
        {failed ? <p className="agency-empty">Не удалось загрузить. Попробуйте ещё раз.</p> : null}
      </section>

      <p className="agency-empty">
        <Link href={withRole("/search", role)} className="link-accent">
          Вся база актёров
        </Link>
      </p>
    </div>
  );
}
