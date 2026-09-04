"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LINK_LABELS } from "@/lib/labels";
import type { Credit, KvPair, Schedule, Showreel } from "@/lib/person-card";
import type { ProfilePatch, ProfilePhoto } from "@/lib/workspace";
import { useWorkspace } from "./useWorkspace";

export type ProfileEditTab =
  | "about"
  | "params"
  | "appearance"
  | "languages"
  | "skills"
  | "education"
  | "credits"
  | "showreel"
  | "photos"
  | "schedule"
  | "links";

const TABS: { id: ProfileEditTab; label: string }[] = [
  { id: "about", label: "Основное" },
  { id: "params", label: "Параметры" },
  { id: "appearance", label: "Внешность" },
  { id: "languages", label: "Языки" },
  { id: "skills", label: "Навыки" },
  { id: "education", label: "Образование" },
  { id: "credits", label: "Фильмография" },
  { id: "showreel", label: "Шоурил" },
  { id: "photos", label: "Фото" },
  { id: "schedule", label: "График" },
  { id: "links", label: "Контакты" },
];

const LINK_KINDS = Object.keys(LINK_LABELS);
const CREDIT_KINDS = ["Кино", "Сериал"];
const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export type ProfileEditDefaults = Required<
  Pick<ProfilePatch, "params" | "appearance" | "languages" | "skills">
> & {
  bio: string;
  city: string;
  education: string;
  showreel: Showreel;
  photos: ProfilePhoto[];
  schedule: Schedule;
  credits: Credit[];
  links: NonNullable<ProfilePatch["links"]>;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="kadr-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function FileBtn({
  label,
  accept,
  onPick,
}: {
  label: string;
  accept: string;
  onPick: (file: File) => void;
}) {
  return (
    <label className="proj-settings-add kadr-file-btn">
      {label}
      <input
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPick(file);
        }}
      />
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

function CalEditor({ value, onChange }: { value: Schedule; onChange: (next: Schedule) => void }) {
  const days: { n: number; cls: string }[] = [26, 27, 28, 29, 30, 31].map((n) => ({ n, cls: "off" }));
  for (let d = 1; d <= 30; d++) {
    const bits: string[] = [];
    if (value.busy.includes(d)) bits.push("busy");
    if (value.hold.includes(d)) bits.push("hold");
    if (value.today === d) bits.push("today");
    days.push({ n: d, cls: bits.join(" ") });
  }

  function toggle(d: number, off: boolean) {
    if (off) return;
    const busy = value.busy.includes(d);
    const hold = value.hold.includes(d);
    if (!busy && !hold) onChange({ ...value, busy: [...value.busy, d].sort((a, b) => a - b) });
    else if (busy) {
      onChange({
        ...value,
        busy: value.busy.filter((x) => x !== d),
        hold: [...value.hold, d].sort((a, b) => a - b),
      });
    } else onChange({ ...value, hold: value.hold.filter((x) => x !== d) });
  }

  return (
    <div className="kadr-form">
      <p className="proj-settings-hint" style={{ margin: "0 0 10px" }}>
        Клик по дню: свободно → смена → hold → свободно
      </p>
      <div className="mini-cal kadr-settings-cal">
        {WEEKDAYS.map((day) => (
          <span className="mini-cal__h" key={day}>
            {day}
          </span>
        ))}
        {days.map((day, i) => (
          <button
            type="button"
            className={day.cls ? `mini-cal__d ${day.cls}` : "mini-cal__d"}
            key={`${day.n}-${i}`}
            onClick={() => toggle(day.n, day.cls === "off")}
          >
            {day.n}
          </button>
        ))}
      </div>
      <div className="kadr-cal-legend" style={{ marginTop: 10 }}>
        <span className="kadr-cal-legend__item">
          <span className="kadr-cal-legend__swatch kadr-cal-legend__swatch--busy" />
          смена
        </span>
        <span className="kadr-cal-legend__item">
          <span className="kadr-cal-legend__swatch kadr-cal-legend__swatch--hold" />
          hold
        </span>
      </div>
      <div className="proj-settings-section-title">События</div>
      {value.events.map((event, i) => (
        <div key={i} className="kadr-settings-event">
          <input
            className="proj-settings-input"
            value={event.when}
            placeholder="Когда"
            onChange={(e) =>
              onChange({
                ...value,
                events: value.events.map((ev, idx) => (idx === i ? { ...ev, when: e.target.value } : ev)),
              })
            }
          />
          <input
            className="proj-settings-input"
            value={event.title}
            placeholder="Событие"
            onChange={(e) =>
              onChange({
                ...value,
                events: value.events.map((ev, idx) => (idx === i ? { ...ev, title: e.target.value } : ev)),
              })
            }
          />
          <input
            className="proj-settings-input"
            value={event.meta}
            placeholder="Комментарий"
            onChange={(e) =>
              onChange({
                ...value,
                events: value.events.map((ev, idx) => (idx === i ? { ...ev, meta: e.target.value } : ev)),
              })
            }
          />
          <button
            type="button"
            className="proj-settings-remove"
            aria-label="Удалить"
            onClick={() => onChange({ ...value, events: value.events.filter((_, idx) => idx !== i) })}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="proj-settings-add"
        onClick={() => onChange({ ...value, events: [...value.events, { when: "", title: "", meta: "" }] })}
      >
        + Событие
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
  defaults: ProfileEditDefaults;
  onClose: () => void;
  initialTab?: ProfileEditTab;
}) {
  const { saveProfilePatch } = useWorkspace();
  const [tab, setTab] = useState<ProfileEditTab>(initialTab);
  const [bio, setBio] = useState(initial.bio ?? defaults.bio);
  const [city, setCity] = useState(initial.city ?? defaults.city);
  const [params, setParams] = useState<KvPair[]>(initial.params ?? defaults.params);
  const [appearance, setAppearance] = useState<KvPair[]>(initial.appearance ?? defaults.appearance);
  const [languages, setLanguages] = useState<KvPair[]>(initial.languages ?? defaults.languages);
  const [skillsText, setSkillsText] = useState((initial.skills ?? defaults.skills).join(", "));
  const [education, setEducation] = useState(initial.education ?? defaults.education);
  const [showreel, setShowreel] = useState<Showreel>(initial.showreel ?? defaults.showreel);
  const [photos, setPhotos] = useState<ProfilePhoto[]>(initial.photos ?? defaults.photos);
  const [schedule, setSchedule] = useState<Schedule>(initial.schedule ?? defaults.schedule);
  const [credits, setCredits] = useState<Credit[]>(initial.credits ?? defaults.credits);
  const [links, setLinks] = useState(initial.links ?? defaults.links);
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
            <h2 id="profile-edit-title">Настройка профиля</h2>
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
            {tab === "languages" ? <KvEditor rows={languages} onChange={setLanguages} addLabel="Язык" /> : null}
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
            {tab === "education" ? (
              <div className="kadr-form">
                <Field label="Образование — по одному месту на строку">
                  <textarea
                    rows={6}
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder={"ВГИК, актёрский факультет\nСтажировка в МХТ им. Чехова"}
                  />
                </Field>
              </div>
            ) : null}
            {tab === "credits" ? (
              <div className="kadr-form">
                {credits.map((row, i) => (
                  <div key={i} className="kadr-settings-credit">
                    <input
                      className="proj-settings-input"
                      value={row.year || ""}
                      placeholder="Год"
                      onChange={(e) =>
                        setCredits(credits.map((c, idx) => (idx === i ? { ...c, year: e.target.value } : c)))
                      }
                    />
                    <input
                      className="proj-settings-input"
                      value={row.title}
                      placeholder="Название"
                      onChange={(e) =>
                        setCredits(credits.map((c, idx) => (idx === i ? { ...c, title: e.target.value } : c)))
                      }
                    />
                    <select
                      className="proj-settings-input"
                      value={row.kind || "Кино"}
                      onChange={(e) =>
                        setCredits(credits.map((c, idx) => (idx === i ? { ...c, kind: e.target.value } : c)))
                      }
                    >
                      {CREDIT_KINDS.map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="proj-settings-remove"
                      aria-label="Удалить"
                      onClick={() => setCredits(credits.filter((_, idx) => idx !== i))}
                    >
                      ×
                    </button>
                    <input
                      className="proj-settings-input is-wide"
                      value={row.meta || ""}
                      placeholder="Жанр · платформа"
                      onChange={(e) =>
                        setCredits(credits.map((c, idx) => (idx === i ? { ...c, meta: e.target.value } : c)))
                      }
                    />
                    <input
                      className="proj-settings-input is-wide"
                      value={row.credit || ""}
                      placeholder="Роль"
                      onChange={(e) =>
                        setCredits(credits.map((c, idx) => (idx === i ? { ...c, credit: e.target.value } : c)))
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="proj-settings-add"
                  onClick={() =>
                    setCredits([...credits, { year: "", title: "", meta: "", credit: "", kind: "Кино" }])
                  }
                >
                  + Роль
                </button>
              </div>
            ) : null}
            {tab === "showreel" ? (
              <div className="kadr-form">
                {showreel.poster ? (
                  <img className="kadr-settings-poster" src={showreel.poster} alt="" />
                ) : null}
                <div className="kadr-file-row">
                  <FileBtn
                    label="Загрузить постер"
                    accept="image/*"
                    onPick={(file) => void readFile(file).then((url) => setShowreel({ ...showreel, poster: url }))}
                  />
                  <FileBtn
                    label="Загрузить ролик"
                    accept="video/*"
                    onPick={(file) => {
                      const href = URL.createObjectURL(file);
                      setShowreel({ ...showreel, href, title: showreel.title || file.name });
                    }}
                  />
                </div>
                <Field label="Ссылка на ролик">
                  <input
                    value={showreel.href || ""}
                    onChange={(e) => setShowreel({ ...showreel, href: e.target.value })}
                    placeholder="https://vimeo.com/…"
                  />
                </Field>
                <Field label="Название">
                  <input
                    value={showreel.title}
                    onChange={(e) => setShowreel({ ...showreel, title: e.target.value })}
                  />
                </Field>
                <Field label="Длительность">
                  <input
                    value={showreel.duration || ""}
                    onChange={(e) => setShowreel({ ...showreel, duration: e.target.value })}
                    placeholder="1:52"
                  />
                </Field>
                <Field label="Подпись">
                  <input
                    value={showreel.caption || ""}
                    onChange={(e) => setShowreel({ ...showreel, caption: e.target.value })}
                  />
                </Field>
              </div>
            ) : null}
            {tab === "photos" ? (
              <div className="kadr-form">
                <p className="proj-settings-hint" style={{ margin: 0 }}>
                  До 40 фото. В демо файлы хранятся локально.
                </p>
                <div className="kadr-settings-photos">
                  {photos.map((photo) => (
                    <div key={photo.id} className="kadr-settings-photo">
                      <img src={photo.url} alt="" />
                      <button
                        type="button"
                        className="proj-settings-remove"
                        aria-label="Удалить фото"
                        onClick={() => setPhotos(photos.filter((p) => p.id !== photo.id))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="kadr-file-row">
                  <FileBtn
                    label="Загрузить фото"
                    accept="image/*"
                    onPick={(file) => {
                      if (photos.length >= 40) return;
                      void readFile(file).then((url) =>
                        setPhotos([...photos, { id: `photo-${Date.now()}`, url }]),
                      );
                    }}
                  />
                </div>
                <Field label="Или ссылка на фото">
                  <input
                    placeholder="https://…"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const url = (e.target as HTMLInputElement).value.trim();
                      if (!url || photos.length >= 40) return;
                      setPhotos([...photos, { id: `photo-${Date.now()}`, url }]);
                      (e.target as HTMLInputElement).value = "";
                    }}
                  />
                </Field>
              </div>
            ) : null}
            {tab === "schedule" ? <CalEditor value={schedule} onChange={setSchedule} /> : null}
            {tab === "links" ? (
              <div className="kadr-form">
                {links.map((link, i) => (
                  <div key={link.id} className="kadr-settings-link">
                    <select
                      className="proj-settings-input"
                      value={link.kind}
                      onChange={(e) =>
                        setLinks(links.map((l, idx) => (idx === i ? { ...l, kind: e.target.value } : l)))
                      }
                    >
                      {LINK_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {LINK_LABELS[k]}
                        </option>
                      ))}
                    </select>
                    <input
                      className="proj-settings-input"
                      value={link.url}
                      placeholder="https://"
                      onChange={(e) =>
                        setLinks(links.map((l, idx) => (idx === i ? { ...l, url: e.target.value } : l)))
                      }
                    />
                    <button
                      type="button"
                      className="proj-settings-remove"
                      aria-label="Удалить"
                      onClick={() => setLinks(links.filter((_, idx) => idx !== i))}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="proj-settings-add"
                  onClick={() =>
                    setLinks([...links, { id: `link-${Date.now()}`, kind: "site", url: "" }])
                  }
                >
                  + Контакт
                </button>
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
                  education: education.trim(),
                  showreel: showreel.poster || showreel.href ? showreel : null,
                  photos,
                  schedule,
                  credits: credits.filter((c) => c.title.trim()),
                  links: links.filter((l) => l.url.trim()),
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
