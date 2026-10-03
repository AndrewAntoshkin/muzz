"use client";

import { useEffect, useMemo, useState } from "react";
import type { FaceCard } from "@/lib/people";
import { fetchFaces } from "@/lib/people-query";
import {
  ACTOR_PROFESSION_FILTERS,
  CITY_FILTERS,
  PROFESSION_FILTERS,
  compareFacesByPlan,
  peopleCountLabel,
} from "@/lib/labels";
import { IconFaces, IconPin } from "./icons";
import {
  CatalogFilterBar,
  CatalogSearchField,
  type CatalogFilterOption,
} from "./CatalogFilterBar";
import { PersonCard } from "./PersonCard";

export function FacesCatalog({
  people,
  peopleTotal,
  remote = false,
  title = "Поиск",
  lead = "Все люди в «Кадре»: актёры, кастинг-директора и агенты.",
  initialProfession = "",
  professionFilters,
  placeholder = "Имя, профессия или город…",
  wide = false,
  dense = false,
}: {
  people: FaceCard[];
  peopleTotal?: number;
  remote?: boolean;
  title?: string;
  lead?: string;
  initialProfession?: string;
  professionFilters?: readonly CatalogFilterOption[];
  placeholder?: string;
  wide?: boolean;
  dense?: boolean;
}) {
  const [q, setQ] = useState("");
  const [profession, setProfession] = useState(initialProfession);
  const [city, setCity] = useState("");
  const [visible, setVisible] = useState(96);
  const [remoteItems, setRemoteItems] = useState(people);
  const [remoteTotal, setRemoteTotal] = useState(peopleTotal ?? people.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const filters = professionFilters ?? PROFESSION_FILTERS;
  const kind = filters === ACTOR_PROFESSION_FILTERS ? "actors" : "all";

  const localItems = useMemo(() => {
    const query = q.trim().toLowerCase();
    return people.filter((p) => {
      if (profession && p.profession !== profession) return false;
      if (city && p.city !== city) return false;
      if (query) {
        const hay = `${p.name} ${p.role} ${p.city}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [people, q, profession, city]);

  const items = remote ? remoteItems : localItems;
  const ranked = useMemo(() => [...items].sort(compareFacesByPlan), [items]);
  const total = remote ? remoteTotal : localItems.length;
  const shown = remote ? ranked : ranked.slice(0, visible);

  useEffect(() => {
    if (!remote) {
      setVisible(96);
      return;
    }
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchFaces({ q, profession, city, kind, limit: 96, offset: 0 })
        .then((data) => {
          if (ac.signal.aborted) return;
          setRemoteItems(data.items);
          setRemoteTotal(data.total);
        })
        .catch(() => {
          if (!ac.signal.aborted) {
            setRemoteItems([]);
            setRemoteTotal(0);
          }
        });
    }, 200);
    return () => {
      ac.abort();
      window.clearTimeout(timer);
    };
  }, [q, profession, city, remote, kind]);

  function reset() {
    setQ("");
    setProfession("");
    setCity("");
  }

  return (
    <div className={`page-scroll catalog-page${wide ? " catalog-page--wide" : ""}`} id="faces-catalog">
      {lead ? (
        <header className="catalog-page__head catalog-page__head--row">
          <p className="catalog-page__lead catalog-page__lead--solo">{lead}</p>
        </header>
      ) : null}

      <CatalogSearchField value={q} onChange={setQ} placeholder={placeholder} ariaLabel={title} />
      <CatalogFilterBar
        filters={[
          {
            id: "profession",
            icon: <IconFaces />,
            placeholder: filters === ACTOR_PROFESSION_FILTERS ? "Роль" : "Профессия",
            value: profession,
            options: filters,
            onChange: setProfession,
          },
          {
            id: "city",
            icon: <IconPin />,
            placeholder: "Город",
            value: city,
            options: CITY_FILTERS,
            onChange: setCity,
          },
        ]}
        onReset={reset}
        countLabel={peopleCountLabel(total)}
      />

      <div className="catalog-results">
        <div
          id="faces-grid"
          className={`faces-grid${dense ? " faces-grid--5" : ""}`}
          aria-live="polite"
        >
          {shown.length ? (
            shown.map((p) => <PersonCard key={p.slug} person={p} />)
          ) : (
            <p className="faces-empty">Никого не найдено. Сбросьте фильтры или измените запрос.</p>
          )}
        </div>
        {remote && items.length < total ? (
          <button
            type="button"
            className="btn-secondary"
            style={{ margin: "20px auto", display: "block" }}
            disabled={loadingMore}
            onClick={() => {
              setLoadingMore(true);
              void fetchFaces({ q, profession, city, kind, limit: 96, offset: items.length })
                .then((data) => {
                  setRemoteItems((cur) => {
                    const have = new Set(cur.map((p) => p.slug));
                    return [...cur, ...data.items.filter((p) => !have.has(p.slug))];
                  });
                  setRemoteTotal(data.total);
                })
                .finally(() => setLoadingMore(false));
            }}
          >
            {loadingMore ? "Загрузка…" : `Показать ещё (${total - items.length})`}
          </button>
        ) : !remote && visible < items.length ? (
          <button
            type="button"
            className="btn-secondary"
            style={{ margin: "20px auto", display: "block" }}
            onClick={() => setVisible((n) => n + 96)}
          >
            Показать ещё ({items.length - visible})
          </button>
        ) : null}
      </div>
    </div>
  );
}
