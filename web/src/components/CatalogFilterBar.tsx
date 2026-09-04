"use client";

import { useRef, useState, type ReactNode } from "react";
import { IconCaret } from "./icons";
import { DropdownMenu } from "./DropdownMenu";

export type CatalogFilterOption = { value: string; label: string };

export function CatalogSearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <label className="catalog-search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
    </label>
  );
}

function FilterDropdown({
  icon,
  label,
  value,
  options,
  open,
  onToggle,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  options: readonly CatalogFilterOption[];
  open: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  const btn = useRef<HTMLButtonElement>(null);
  return (
    <div className={`filter-chip${open ? " is-open" : ""}`}>
      <button
        ref={btn}
        type="button"
        className={`filter-chip__btn${value ? " is-on" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={onToggle}
      >
        {icon}
        <span>{label}</span>
        <IconCaret />
      </button>
      <DropdownMenu open={open} anchorRef={btn} className="filter-chip__menu" onClose={onToggle}>
        {options.map((opt) => (
          <button
            key={opt.value || "all"}
            type="button"
            className={`filter-chip__opt${value === opt.value ? " is-on" : ""}`}
            role="option"
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </DropdownMenu>
    </div>
  );
}

export function CatalogFilterBar({
  filters,
  toggle,
  onReset,
  countLabel,
}: {
  filters: {
    id: string;
    icon: ReactNode;
    placeholder: string;
    value: string;
    options: readonly CatalogFilterOption[];
    onChange: (value: string) => void;
  }[];
  toggle?: { icon: ReactNode; label: string; on: boolean; onToggle: () => void };
  onReset: () => void;
  countLabel: string;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <div className="catalog-toolbar">
      {filters.map((f) => {
        const active = f.options.find((o) => o.value === f.value && o.value)?.label || f.placeholder;
        return (
          <FilterDropdown
            key={f.id}
            icon={f.icon}
            label={active}
            value={f.value}
            options={f.options}
            open={openMenu === f.id}
            onToggle={() => setOpenMenu((m) => (m === f.id ? null : f.id))}
            onChange={(value) => {
              f.onChange(value);
              setOpenMenu(null);
            }}
          />
        );
      })}
      {toggle ? (
        <button
          type="button"
          className={`filter-chip__btn${toggle.on ? " is-on" : ""}`}
          onClick={toggle.onToggle}
        >
          {toggle.icon}
          {toggle.label}
        </button>
      ) : null}
      <button type="button" className="catalog-toolbar__reset" onClick={onReset}>
        Сбросить
      </button>
      <span className="catalog-search__count">{countLabel}</span>
    </div>
  );
}
