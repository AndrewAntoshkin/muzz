"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FaceCard } from "@/lib/people";
import { CITY_FILTERS, PROFESSION_FILTERS, peopleCountLabel } from "@/lib/labels";
import { IconCaret, IconCheck, IconFaces, IconPin } from "./icons";
import { DropdownMenu } from "./DropdownMenu";
import { PersonCard } from "./PersonCard";

export function FacesCatalog({
  people,
  title = "Поиск",
  lead = "Все люди в «Кадре»: актёры, кастинг-директора и агенты.",
  initialProfession = "",
}: {
  people: FaceCard[];
  title?: string;
  lead?: string;
  initialProfession?: string;
}) {
  const [q, setQ] = useState("");
  const [profession, setProfession] = useState(initialProfession);
  const [city, setCity] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | "profession" | "city">(null);
  const [visible, setVisible] = useState(96);
  const professionBtn = useRef<HTMLButtonElement>(null);
  const cityBtn = useRef<HTMLButtonElement>(null);

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    return people.filter((p) => {
      if (profession && p.profession !== profession) return false;
      if (city && p.city !== city) return false;
      if (verifiedOnly && !p.verified) return false;
      if (query) {
        const hay = `${p.name} ${p.role} ${p.city}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [people, q, profession, city, verifiedOnly]);

  useEffect(() => {
    setVisible(96);
  }, [q, profession, city, verifiedOnly]);

  const shown = items.slice(0, visible);

  const professionLabel =
    PROFESSION_FILTERS.find((f) => f.value === profession && f.value)?.label || "Профессия";
  const cityLabel = CITY_FILTERS.find((f) => f.value === city && f.value)?.label || "Город";

  function reset() {
    setQ("");
    setProfession("");
    setCity("");
    setVerifiedOnly(false);
    setOpenMenu(null);
  }

  return (
    <div className="page-scroll catalog-page" id="faces-catalog">
      {lead ? <p className="catalog-page__lead catalog-page__lead--solo">{lead}</p> : null}

      <label className="catalog-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          placeholder="Имя, профессия или город…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={title}
        />
      </label>

      <div className="catalog-toolbar" data-faces-filters>
        <div className={`filter-chip${openMenu === "profession" ? " is-open" : ""}`}>
          <button
            ref={professionBtn}
            type="button"
            className={`filter-chip__btn${profession ? " is-on" : ""}`}
            aria-haspopup="listbox"
            aria-expanded={openMenu === "profession"}
            onClick={() => setOpenMenu((m) => (m === "profession" ? null : "profession"))}
          >
            <IconFaces />
            <span>{professionLabel}</span>
            <IconCaret />
          </button>
          <DropdownMenu
            open={openMenu === "profession"}
            anchorRef={professionBtn}
            className="filter-chip__menu"
            onClose={() => setOpenMenu(null)}
          >
            {PROFESSION_FILTERS.map((opt) => (
              <button
                key={opt.value || "all"}
                type="button"
                className={`filter-chip__opt${profession === opt.value ? " is-on" : ""}`}
                role="option"
                onClick={() => {
                  setProfession(opt.value);
                  setOpenMenu(null);
                }}
              >
                {opt.label}
              </button>
            ))}
          </DropdownMenu>
        </div>

        <div className={`filter-chip${openMenu === "city" ? " is-open" : ""}`}>
          <button
            ref={cityBtn}
            type="button"
            className={`filter-chip__btn${city ? " is-on" : ""}`}
            aria-haspopup="listbox"
            aria-expanded={openMenu === "city"}
            onClick={() => setOpenMenu((m) => (m === "city" ? null : "city"))}
          >
            <IconPin />
            <span>{cityLabel}</span>
            <IconCaret />
          </button>
          <DropdownMenu
            open={openMenu === "city"}
            anchorRef={cityBtn}
            className="filter-chip__menu"
            onClose={() => setOpenMenu(null)}
          >
            {CITY_FILTERS.map((opt) => (
              <button
                key={opt.value || "all"}
                type="button"
                className={`filter-chip__opt${city === opt.value ? " is-on" : ""}`}
                role="option"
                onClick={() => {
                  setCity(opt.value);
                  setOpenMenu(null);
                }}
              >
                {opt.label}
              </button>
            ))}
          </DropdownMenu>
        </div>

        <button
          type="button"
          className={`filter-chip__btn${verifiedOnly ? " is-on" : ""}`}
          onClick={() => setVerifiedOnly((v) => !v)}
        >
          <IconCheck />
          Только проверенные
        </button>
        <button type="button" className="catalog-toolbar__reset" onClick={reset}>
          Сбросить
        </button>
        <span className="catalog-search__count">{peopleCountLabel(items.length)}</span>
      </div>

      <div className="catalog-results">
        <div id="faces-grid" className="faces-grid" aria-live="polite">
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
