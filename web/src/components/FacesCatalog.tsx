"use client";

import { useEffect, useMemo, useState } from "react";
import type { FaceCard } from "@/lib/people";
import {
  ACTOR_PROFESSION_FILTERS,
  CITY_FILTERS,
  PROFESSION_FILTERS,
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
  title = "Поиск",
  lead = "Все люди в «Кадре»: актёры, кастинг-директора и агенты.",
  initialProfession = "",
  professionFilters,
  placeholder = "Имя, профессия или город…",
  wide = false,
  dense = false,
}: {
  people: FaceCard[];
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
  const filters = professionFilters ?? PROFESSION_FILTERS;

  const items = useMemo(() => {
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

  useEffect(() => {
    setVisible(96);
  }, [q, profession, city]);

  const shown = items.slice(0, visible);

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
        countLabel={peopleCountLabel(items.length)}
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
        {visible < items.length ? (
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
