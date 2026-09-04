"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { decodeSlug } from "@/lib/workspace";
import {
  PROJECT_STATUSES,
  type ProjectKv,
  type ProjectOpening,
  type ProjectPartner,
  type ProjectTeamMember,
  type ProjectDoc,
} from "@/lib/productions";
import { useWorkspace } from "./useWorkspace";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="kadr-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ruWord(n: number, one: string, few: string, many: string) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

function KvListEditor({
  col1,
  col2,
  rows,
  onChange,
  onAdd,
  addLabel,
}: {
  col1: string;
  col2: string;
  rows: ProjectKv[];
  onChange: (next: ProjectKv[]) => void;
  onAdd: () => void;
  addLabel: string;
}) {
  function update(idx: number, patch: Partial<ProjectKv>) {
    onChange(rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  function remove(idx: number) {
    onChange(rows.filter((_, i) => i !== idx));
  }

  return (
    <div className="proj-settings-kv">
      <div className="proj-settings-kv__head">
        <span>{col1}</span>
        <span>{col2}</span>
        <span aria-hidden>×</span>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="proj-settings-kv__row">
          <input
            className="proj-settings-input"
            value={row.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder={col1}
          />
          <input
            className="proj-settings-input"
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder={col2}
          />
          <button type="button" className="proj-settings-remove" onClick={() => remove(i)} aria-label="Удалить">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="proj-settings-add" onClick={onAdd}>
        + {addLabel}
      </button>
    </div>
  );
}

function PartnerListEditor({
  rows,
  onChange,
}: {
  rows: ProjectPartner[];
  onChange: (next: ProjectPartner[]) => void;
}) {
  function update(idx: number, patch: Partial<ProjectPartner>) {
    onChange(rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  function remove(idx: number) {
    onChange(rows.filter((_, i) => i !== idx));
  }

  return (
    <div className="proj-settings-kv">
      <div className="proj-settings-kv__head">
        <span>Компания</span>
        <span>Роль в проекте</span>
        <span aria-hidden>×</span>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="proj-settings-kv__row">
          <input
            className="proj-settings-input"
            value={row.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Название"
          />
          <input
            className="proj-settings-input"
            value={row.meta}
            onChange={(e) => update(i, { meta: e.target.value })}
            placeholder="Заказчик · платформа"
          />
          <button type="button" className="proj-settings-remove" onClick={() => remove(i)} aria-label="Удалить">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="proj-settings-add" onClick={() => onChange([...rows, { name: "", meta: "" }])}>
        + Добавить партнёра
      </button>
    </div>
  );
}

type TabId =
  | "general"
  | "schedule"
  | "budget"
  | "distribution"
  | "partners"
  | "docs"
  | "castings"
  | "openings"
  | "team";

const TABS: { id: TabId; label: string }[] = [
  { id: "general", label: "Основное" },
  { id: "schedule", label: "Статус и график" },
  { id: "budget", label: "Бюджет" },
  { id: "distribution", label: "Прокат" },
  { id: "partners", label: "Партнёры" },
  { id: "docs", label: "Документы" },
  { id: "castings", label: "Кастинги" },
  { id: "openings", label: "Открытые позиции" },
  { id: "team", label: "Команда" },
];

export function ProjectSettingsModal({
  projectSlug,
  onClose,
}: {
  projectSlug: string;
  onClose: () => void;
}) {
  const ws = useWorkspace();
  const projectKey = useMemo(() => decodeSlug(projectSlug), [projectSlug]);
  const project = ws.getProject(projectKey);
  const allCastings = ws.castingsForProject(projectKey);

  const [tab, setTab] = useState<TabId>("general");

  const [logline, setLogline] = useState(project?.logline ?? "");
  const [text, setText] = useState(project?.text ?? "");
  const [status, setStatus] = useState(project?.status ?? "");
  const [city, setCity] = useState(project?.city ?? "");
  const [nature, setNature] = useState(project?.nature ?? "");
  const [pavilion, setPavilion] = useState(project?.pavilion ?? "");
  const [cdName, setCdName] = useState(project?.cdName ?? "");
  const [shifts, setShifts] = useState(project?.shifts ?? "");
  const [shiftsDone, setShiftsDone] = useState(project?.shiftsDone ?? "");
  const [scenesDone, setScenesDone] = useState(project?.scenesDone ?? "");

  const [schedule, setSchedule] = useState<ProjectKv[]>(() => project?.schedule?.map((r) => ({ ...r })) ?? []);
  const [budget, setBudget] = useState(project?.budget ?? "");
  const [spent, setSpent] = useState(project?.spent ?? "");
  const [financing, setFinancing] = useState<ProjectKv[]>(() => project?.financing?.map((r) => ({ ...r })) ?? []);
  const [distribution, setDistribution] = useState<ProjectKv[]>(
    () => project?.distribution?.map((r) => ({ ...r })) ?? [],
  );
  const [partners, setPartners] = useState<ProjectPartner[]>(() => project?.partners?.map((p) => ({ ...p })) ?? []);
  const [docs, setDocs] = useState<ProjectDoc[]>(() => project?.docs?.map((d) => ({ ...d })) ?? []);
  const [openings, setOpenings] = useState<ProjectOpening[]>(() => project?.openings?.map((o) => ({ ...o })) ?? []);
  const [team, setTeam] = useState<ProjectTeamMember[]>(() => project?.team?.map((m) => ({ ...m })) ?? []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!ws.ready || !project) return null;

  function updateOpening(idx: number, patch: Partial<ProjectOpening>) {
    setOpenings(openings.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }

  function updateTeamMember(idx: number, patch: Partial<ProjectTeamMember>) {
    setTeam(team.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }

  function handleSave() {
    ws.updateProject(projectKey, {
      logline: logline.trim(),
      text: text.trim(),
      status,
      city,
      nature: nature || undefined,
      pavilion: pavilion || undefined,
      cdName: cdName || undefined,
      shifts: shifts || undefined,
      shiftsDone: shiftsDone || undefined,
      scenesDone: scenesDone || undefined,
      schedule: schedule.filter((r) => r.label || r.value),
      budget: budget || undefined,
      spent: spent || undefined,
      financing: financing.filter((r) => r.label || r.value),
      distribution: distribution.filter((r) => r.label || r.value),
      partners: partners.filter((p) => p.name),
      docs: docs.filter((d) => d.label),
      openings: openings.filter((o) => o.title),
      team: team.filter((m) => m.name),
    });
    onClose();
  }

  return createPortal(
    <div className="proj-settings-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="proj-settings-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="proj-settings-header">
          <div>
            <h2>Настройки проекта</h2>
            <p>{project.title}</p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>

        <div className="proj-settings-body">
          <nav className="proj-settings-tabs" aria-label="Разделы проекта">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`proj-settings-tab${t.id === tab ? " is-active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="proj-settings-divider" aria-hidden />

          <div className="proj-settings-content">
            {tab === "general" ? (
              <div className="kadr-form">
                <Field label="Логлайн">
                  <textarea rows={2} value={logline} onChange={(e) => setLogline(e.target.value)} />
                </Field>
                <Field label="Описание">
                  <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
                </Field>
                <div className="kadr-form__row">
                  <Field label="Статус">
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      {PROJECT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Город">
                    <input value={city} onChange={(e) => setCity(e.target.value)} />
                  </Field>
                </div>
                <div className="kadr-form__row">
                  <Field label="Натура">
                    <input value={nature} onChange={(e) => setNature(e.target.value)} placeholder="Мурманск" />
                  </Field>
                  <Field label="Павильон">
                    <input value={pavilion} onChange={(e) => setPavilion(e.target.value)} placeholder="Москва" />
                  </Field>
                </div>
                <div className="kadr-form__row">
                  <Field label="Кастинг-директор">
                    <input value={cdName} onChange={(e) => setCdName(e.target.value)} />
                  </Field>
                  <Field label="Смен">
                    <input value={shifts} onChange={(e) => setShifts(e.target.value)} placeholder="34" />
                  </Field>
                </div>
                <div className="kadr-form__row">
                  <Field label="Прогресс смен">
                    <input value={shiftsDone} onChange={(e) => setShiftsDone(e.target.value)} placeholder="32 / 47" />
                  </Field>
                  <Field label="Сцены сняты">
                    <input value={scenesDone} onChange={(e) => setScenesDone(e.target.value)} placeholder="156 / 218" />
                  </Field>
                </div>
              </div>
            ) : null}

            {tab === "schedule" ? (
              <div className="kadr-form">
                <p className="proj-settings-hint">Этапы производства — название и период.</p>
                <KvListEditor
                  col1="Этап"
                  col2="Период"
                  rows={schedule}
                  onChange={setSchedule}
                  onAdd={() => setSchedule([...schedule, { label: "", value: "" }])}
                  addLabel="Добавить этап"
                />
              </div>
            ) : null}

            {tab === "budget" ? (
              <div className="kadr-form">
                <div className="kadr-form__row">
                  <Field label="Бюджет">
                    <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="145 ₽ млн" />
                  </Field>
                  <Field label="Освоено">
                    <input value={spent} onChange={(e) => setSpent(e.target.value)} placeholder="80 ₽ млн" />
                  </Field>
                </div>
                <p className="proj-settings-section-title">Источники финансирования</p>
                <KvListEditor
                  col1="Источник"
                  col2="Сумма"
                  rows={financing}
                  onChange={setFinancing}
                  onAdd={() => setFinancing([...financing, { label: "", value: "" }])}
                  addLabel="Добавить источник"
                />
              </div>
            ) : null}

            {tab === "distribution" ? (
              <div className="kadr-form">
                <p className="proj-settings-hint">Каналы дистрибуции и сроки.</p>
                <KvListEditor
                  col1="Канал"
                  col2="Срок"
                  rows={distribution}
                  onChange={setDistribution}
                  onAdd={() => setDistribution([...distribution, { label: "", value: "" }])}
                  addLabel="Добавить канал"
                />
              </div>
            ) : null}

            {tab === "partners" ? (
              <div className="kadr-form">
                <p className="proj-settings-hint">Партнёры производства.</p>
                <PartnerListEditor rows={partners} onChange={setPartners} />
              </div>
            ) : null}

            {tab === "docs" ? (
              <div className="kadr-form">
                <p className="proj-settings-hint">Документы и юридические статусы.</p>
                <KvListEditor
                  col1="Документ"
                  col2="Статус"
                  rows={docs}
                  onChange={setDocs}
                  onAdd={() => setDocs([...docs, { label: "", value: "" }])}
                  addLabel="Добавить документ"
                />
              </div>
            ) : null}

            {tab === "castings" ? (
              <div className="kadr-form">
                {allCastings.length ? (
                  <div>
                    <p className="proj-settings-section-title">Прикреплённые кастинги · {allCastings.length}</p>
                    <div className="responses-list">
                      {allCastings.map((c) => {
                        const n = ws.responseCount(c);
                        const initials = c.roleLabel
                          .split(/[·\s]+/)
                          .filter(Boolean)
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 3)
                          .toUpperCase();

                        return (
                          <div key={c.slug} className="response-row">
                            <span className="project-team-card__ava" style={{ background: "#2C2C2B" }}>
                              {initials}
                            </span>
                            <div>
                              <div className="response-row__name">{c.title}</div>
                              <div className="response-row__meta">
                                {c.roleLabel} · до {c.deadline}
                              </div>
                            </div>
                            <div className="response-row__stat">
                              <strong>{n}</strong> {ruWord(n, "отклик", "отклика", "откликов")}
                            </div>
                            {c.urgent ? (
                              <span className="tag tag-orange">Срочно</span>
                            ) : (
                              <span className="tag tag-blue">Открыто</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "openings" ? (
              <div className="kadr-form">
                <p className="proj-settings-hint">Вакансии в проекте.</p>
                <div className="proj-settings-cards">
                  {openings.map((o, i) => (
                    <div key={i} className="proj-settings-card">
                      <div className="proj-settings-card__head">
                        <span className="proj-settings-card__title">Позиция {i + 1}</span>
                        <button
                          type="button"
                          className="proj-settings-remove"
                          onClick={() => setOpenings(openings.filter((_, j) => j !== i))}
                          aria-label="Удалить"
                        >
                          ×
                        </button>
                      </div>
                      <Field label="Должность">
                        <input
                          value={o.title}
                          onChange={(e) => updateOpening(i, { title: e.target.value })}
                          placeholder="Главная женская"
                        />
                      </Field>
                      <Field label="Описание">
                        <input
                          value={o.meta}
                          onChange={(e) => updateOpening(i, { meta: e.target.value })}
                          placeholder="28–34 · Москва"
                        />
                      </Field>
                      <div className="kadr-form__row">
                        <Field label="Статус">
                          <select
                            value={o.tag}
                            onChange={(e) =>
                              updateOpening(i, { tag: e.target.value as ProjectOpening["tag"] })
                            }
                          >
                            <option value="open">Открыто</option>
                            <option value="urgent">Срочно</option>
                            <option value="soon">Скоро</option>
                          </select>
                        </Field>
                        <Field label="Инициалы">
                          <input
                            value={o.initials}
                            onChange={(e) => updateOpening(i, { initials: e.target.value })}
                            placeholder="ГЖ"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="proj-settings-add"
                  onClick={() =>
                    setOpenings([
                      ...openings,
                      { title: "", meta: "", initials: "", bg: "#2c2c2b", responses: 0, tag: "open" },
                    ])
                  }
                >
                  + Добавить позицию
                </button>
              </div>
            ) : null}

            {tab === "team" ? (
              <div className="kadr-form">
                <p className="proj-settings-hint">Участники съёмочной группы.</p>
                <div className="proj-settings-cards">
                  {team.map((m, i) => (
                    <div key={i} className="proj-settings-card">
                      <div className="proj-settings-card__head">
                        <span className="proj-settings-card__title">Участник {i + 1}</span>
                        <button
                          type="button"
                          className="proj-settings-remove"
                          onClick={() => setTeam(team.filter((_, j) => j !== i))}
                          aria-label="Удалить"
                        >
                          ×
                        </button>
                      </div>
                      <div className="kadr-form__row">
                        <Field label="Имя">
                          <input value={m.name} onChange={(e) => updateTeamMember(i, { name: e.target.value })} />
                        </Field>
                        <Field label="Должность">
                          <input value={m.role} onChange={(e) => updateTeamMember(i, { role: e.target.value })} />
                        </Field>
                      </div>
                      <div className="kadr-form__row">
                        <Field label="Инициалы">
                          <input
                            value={m.initials ?? ""}
                            onChange={(e) => updateTeamMember(i, { initials: e.target.value })}
                            placeholder="АБ"
                          />
                        </Field>
                        <Field label="Профиль">
                          <input
                            value={m.href ?? ""}
                            onChange={(e) => updateTeamMember(i, { href: e.target.value || undefined })}
                            placeholder="/people/slug"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="proj-settings-add"
                  onClick={() => setTeam([...team, { name: "", role: "", initials: "", bg: "#2c2c2b" }])}
                >
                  + Добавить участника
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <footer className="proj-settings-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Сохранить
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
