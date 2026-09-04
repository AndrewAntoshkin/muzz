"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { KvPair } from "@/lib/person-card";
import type { ProfilePatch } from "@/lib/workspace";
import { useWorkspace } from "./useWorkspace";

type TabId = "about" | "params" | "appearance" | "languages" | "skills";

const TABS: { id: TabId; label: string }[] = [
  { id: "about", label: "Основное" },
  { id: "params", label: "Параметры" },
  { id: "appearance", label: "Внешность" },
  { id: "languages", label: "Языки" },
  { id: "skills", label: "Навыки" },
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="kadr-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function KvEditor({
  rows,
  onChange,
  addLabel,
}: {
  rows: KvPair[];
  onChange: (next: KvPair[]) => void;
  addLabel: string;
}) {
  return (
    <div className="proj-settings-kv">
      <div className="proj-settings-kv__head">
        <span>Поле</span>
        <span>Значение</span>
        <span aria-hidden>×</span>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="proj-settings-kv__row">
          <input
            className="proj-settings-input"
            value={row.label}
            onChange={(e) => onChange(rows.map((r, idx) => (idx === i ? { ...r, label: e.target.value } : r)))}
            placeholder="Поле"
          />
          <input
            className="proj-settings-input"
            value={row.value}
            onChange={(e) => onChange(rows.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))}
            placeholder="Значение"
          />
          <button
            type="button"
            className="proj-settings-remove"
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            aria-label="Удалить"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="proj-settings-add" onClick={() => onChange([...rows, { label: "", value: "" }])}>
        + {addLabel}
      </button>
    </div>
  );
}

export function ProfileEditModal({
  personSlug,
  initial,
  defaults,
  onClose,
  initialTab = "about",
}: {
  personSlug: string;
  initial: ProfilePatch;
  defaults: Required<Pick<ProfilePatch, "params" | "appearance" | "languages" | "skills">> & {
    bio: string;
    city: string;
  };
  onClose: () => void;
  initialTab?: TabId;
}) {
  const { saveProfilePatch } = useWorkspace();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [bio, setBio] = useState(initial.bio ?? defaults.bio);
  const [city, setCity] = useState(initial.city ?? defaults.city);
  const [params, setParams] = useState<KvPair[]>(initial.params ?? defaults.params);
  const [appearance, setAppearance] = useState<KvPair[]>(initial.appearance ?? defaults.appearance);
  const [languages, setLanguages] = useState<KvPair[]>(initial.languages ?? defaults.languages);
  const [skillsText, setSkillsText] = useState((initial.skills ?? defaults.skills).join(", "));
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = useMemo(() => TABS.find((t) => t.id === tab)?.label ?? "Профиль", [tab]);

  if (!mounted) return null;

  return createPortal(
    <div className="proj-settings-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="proj-settings-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="proj-settings-header">
          <div>
            <h2 id="profile-edit-title">Редактирование профиля</h2>
            <p>{title} · видно агентам и кастинг-директорам</p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>
        <div className="proj-settings-body">
          <nav className="proj-settings-tabs" aria-label="Разделы анкеты">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`proj-settings-tab${tab === t.id ? " is-active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="proj-settings-divider" />
          <div className="proj-settings-content">
            {tab === "about" ? (
              <div className="kadr-form">
                <Field label="Город">
                  <input value={city} onChange={(e) => setCity(e.target.value)} />
                </Field>
                <Field label="О себе">
                  <textarea rows={6} value={bio} onChange={(e) => setBio(e.target.value)} />
                </Field>
              </div>
            ) : null}
            {tab === "params" ? <KvEditor rows={params} onChange={setParams} addLabel="Параметр" /> : null}
            {tab === "appearance" ? (
              <KvEditor rows={appearance} onChange={setAppearance} addLabel="Поле внешности" />
            ) : null}
            {tab === "languages" ? (
              <KvEditor rows={languages} onChange={setLanguages} addLabel="Язык" />
            ) : null}
            {tab === "skills" ? (
              <div className="kadr-form">
                <Field label="Спецнавыки через запятую">
                  <textarea
                    rows={5}
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="Бокс, верховая езда, водительские B…"
                  />
                </Field>
              </div>
            ) : null}
          </div>
        </div>
        <footer className="proj-settings-footer">
          <p className="proj-settings-hint">Сохраняется локально в демо</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const skills = skillsText
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                saveProfilePatch(personSlug, {
                  bio: bio.trim(),
                  city: city.trim(),
                  params: params.filter((r) => r.label.trim() || r.value.trim()),
                  appearance: appearance.filter((r) => r.label.trim() || r.value.trim()),
                  languages: languages.filter((r) => r.label.trim() || r.value.trim()),
                  skills,
                });
                onClose();
              }}
            >
              Сохранить
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
