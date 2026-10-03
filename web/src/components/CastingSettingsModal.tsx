"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { decodeSlug } from "@/lib/workspace";
import type { CastingScene, ProjectDoc, TimelineItem, TimelineState } from "@/lib/productions";
import { useWorkspace } from "./useWorkspace";
import { FileDropzone, FileStoreRow, fileExt, fileKindLabel, persistFileUrl } from "./FileDropzone";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="kadr-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function factValue(facts: [string, string][], key: string) {
  return facts.find(([k]) => k.toLowerCase() === key.toLowerCase())?.[1] ?? "";
}

function buildFacts(input: {
  roleLabel: string;
  age: string;
  fee: string;
  platform: string;
  extra: [string, string][];
}): [string, string][] {
  const known = new Set(["роль", "возраст", "гонорар", "платформа"]);
  const rows: [string, string][] = [];
  if (input.roleLabel.trim()) rows.push(["Роль", input.roleLabel.trim()]);
  if (input.age.trim()) rows.push(["Возраст", input.age.trim()]);
  if (input.fee.trim()) rows.push(["Гонорар", input.fee.trim()]);
  if (input.platform.trim()) rows.push(["Платформа", input.platform.trim()]);
  for (const [k, v] of input.extra) {
    if (!k.trim() || known.has(k.trim().toLowerCase())) continue;
    if (v.trim()) rows.push([k.trim(), v.trim()]);
  }
  return rows;
}

function DocsListEditor({
  rows,
  onChange,
  onError,
}: {
  rows: ProjectDoc[];
  onChange: (next: ProjectDoc[]) => void;
  onError: (msg: string) => void;
}) {
  function update(idx: number, patch: Partial<ProjectDoc>) {
    onChange(rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  async function addFiles(files: File[]) {
    const added: ProjectDoc[] = [];
    for (const file of files) {
      const href = await persistFileUrl(file, "doc");
      added.push({
        href,
        label: file.name,
        value: fileExt(file.name) || "файл",
      });
    }
    if (added.length) onChange([...rows, ...added]);
  }

  return (
    <div className="file-store">
      <FileDropzone onFiles={(files) => void addFiles(files)} onError={onError} />
      {rows.length ? (
        <div className="file-store__list">
          {rows.map((row, i) => (
            <FileStoreRow
              key={`${row.label}-${i}`}
              name={row.label}
              kind={fileKindLabel(row.label, row.value)}
              href={row.href}
              onRename={(label) => update(i, { label })}
              onRemove={() => onChange(rows.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type CastingSettingsTab = "general" | "timeline" | "scenes" | "docs";

const TABS: { id: CastingSettingsTab; label: string }[] = [
  { id: "general", label: "Основное" },
  { id: "timeline", label: "Этапы" },
  { id: "scenes", label: "Сцены" },
  { id: "docs", label: "Документы" },
];

export function parseCastingSettingsTab(raw: string | null | undefined): CastingSettingsTab | null {
  return TABS.some((t) => t.id === raw) ? (raw as CastingSettingsTab) : null;
}

const TIMELINE_STATES: { id: TimelineState; label: string }[] = [
  { id: "done", label: "Пройден" },
  { id: "current", label: "Текущий" },
  { id: "future", label: "Далее" },
];

export function CastingSettingsModal({
  castingSlug,
  initialTab,
  onClose,
}: {
  castingSlug: string;
  initialTab?: CastingSettingsTab | null;
  onClose: () => void;
}) {
  const ws = useWorkspace();
  const castingKey = useMemo(() => decodeSlug(castingSlug), [castingSlug]);
  const casting = ws.getCasting(castingKey);
  const project = casting ? ws.getProject(casting.projectSlug) : null;

  const [tab, setTab] = useState<CastingSettingsTab>(initialTab || "general");
  const [title, setTitle] = useState(casting?.title ?? "");
  const [roleLabel, setRoleLabel] = useState(casting?.roleLabel ?? "");
  const [age, setAge] = useState(() => factValue(casting?.facts ?? [], "Возраст"));
  const [fee, setFee] = useState(() => factValue(casting?.facts ?? [], "Гонорар"));
  const [platform, setPlatform] = useState(
    () => factValue(casting?.facts ?? [], "Платформа") || project?.platform || "",
  );
  const [deadline, setDeadline] = useState(casting?.deadline ?? "");
  const [published, setPublished] = useState(casting?.published ?? "");
  const [text, setText] = useState(casting?.text ?? "");
  const [urgent, setUrgent] = useState(Boolean(casting?.urgent));
  const [timeline, setTimeline] = useState<TimelineItem[]>(() => casting?.timeline?.map((r) => ({ ...r })) ?? []);
  const [scenes, setScenes] = useState<CastingScene[]>(() => casting?.scenes?.map((s) => ({ ...s })) ?? []);
  const [scenesPdf, setScenesPdf] = useState(casting?.scenesPdf ?? "");
  const [docs, setDocs] = useState<ProjectDoc[]>(() => casting?.docs?.map((d) => ({ ...d })) ?? []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!ws.ready || !casting) return null;

  function updateTimeline(idx: number, patch: Partial<TimelineItem>) {
    setTimeline(timeline.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }

  function updateScene(idx: number, patch: Partial<CastingScene>) {
    setScenes(scenes.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }

  async function addSceneFiles(files: File[]) {
    const added: CastingScene[] = [];
    for (const file of files) {
      const href = await persistFileUrl(file, "doc");
      added.push({
        num: String(scenes.length + added.length + 1).padStart(2, "0"),
        title: file.name.replace(/\.[^.]+$/, ""),
        meta: "",
        duration: "",
        href,
      });
    }
    if (added.length) setScenes([...scenes, ...added]);
  }

  async function replaceScenesPdf(files: File[]) {
    const file = files[0];
    if (!file) return;
    setScenesPdf(await persistFileUrl(file, "doc"));
  }

  function handleSave() {
    if (!casting) return;
    const extra = (casting.facts ?? []).filter(
      ([k]) => !["роль", "возраст", "гонорар", "платформа"].includes(k.toLowerCase()),
    );
    ws.updateCasting(castingKey, {
      title: title.trim() || casting.title,
      roleLabel: roleLabel.trim() || casting.roleLabel,
      text: text.trim(),
      deadline: deadline.trim() || casting.deadline,
      published: published.trim() || undefined,
      urgent: urgent || undefined,
      facts: buildFacts({ roleLabel, age, fee, platform, extra }),
      timeline: timeline.filter((r) => r.title || r.date),
      scenes: scenes.filter((s) => s.title || s.href),
      scenesPdf: scenesPdf || undefined,
      docs: docs.filter((d) => d.label || d.href),
    });
    onClose();
  }

  return createPortal(
    <div className="proj-settings-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="proj-settings-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="proj-settings-header">
          <div>
            <h2>Настройки кастинга</h2>
            <p>
              {casting.title}
              {project ? ` · ${project.title}` : ""}
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>

        <div className="proj-settings-body">
          <nav className="proj-settings-tabs" aria-label="Разделы кастинга">
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
                <Field label="Название роли">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Главная роль · актриса 28–34"
                  />
                </Field>
                <Field label="О роли">
                  <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
                </Field>
                <div className="kadr-form__row">
                  <Field label="Тип роли">
                    <input
                      value={roleLabel}
                      onChange={(e) => setRoleLabel(e.target.value)}
                      placeholder="Главная женская"
                    />
                  </Field>
                  <Field label="Возраст">
                    <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="28–34" />
                  </Field>
                </div>
                <div className="kadr-form__row">
                  <Field label="Гонорар">
                    <input
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      placeholder="2.4–3.2 ₽ млн за проект"
                    />
                  </Field>
                  <Field label="Платформа">
                    <input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Кинопоиск" />
                  </Field>
                </div>
                <div className="kadr-form__row">
                  <Field label="Опубликовано">
                    <input value={published} onChange={(e) => setPublished(e.target.value)} placeholder="21 мая" />
                  </Field>
                  <Field label="Дедлайн">
                    <input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="6 июня" />
                  </Field>
                </div>
                <label className="kadr-check">
                  <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
                  Срочный набор
                </label>
              </div>
            ) : null}

            {tab === "timeline" ? (
              <div className="kadr-form">
                <p className="proj-settings-hint">Этапы кастинга — дата, название и статус.</p>
                <div className="proj-settings-cards">
                  {timeline.map((item, i) => (
                    <div key={i} className="proj-settings-card">
                      <div className="proj-settings-card__head">
                        <span className="proj-settings-card__title">Этап {i + 1}</span>
                        <button
                          type="button"
                          className="proj-settings-remove"
                          onClick={() => setTimeline(timeline.filter((_, j) => j !== i))}
                          aria-label="Удалить"
                        >
                          ×
                        </button>
                      </div>
                      <div className="kadr-form__row">
                        <Field label="Дата">
                          <input
                            value={item.date}
                            onChange={(e) => updateTimeline(i, { date: e.target.value })}
                            placeholder="6 июня"
                          />
                        </Field>
                        <Field label="Статус">
                          <select
                            value={item.state ?? "future"}
                            onChange={(e) => updateTimeline(i, { state: e.target.value as TimelineState })}
                          >
                            {TIMELINE_STATES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <Field label="Название">
                        <input
                          value={item.title}
                          onChange={(e) => updateTimeline(i, { title: e.target.value })}
                          placeholder="Дедлайн самопроб"
                        />
                      </Field>
                      <Field label="Комментарий">
                        <input
                          value={item.meta ?? ""}
                          onChange={(e) => updateTimeline(i, { meta: e.target.value })}
                          placeholder="по приглашениям"
                        />
                      </Field>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="proj-settings-add"
                  onClick={() => setTimeline([...timeline, { date: "", title: "", meta: "", state: "future" }])}
                >
                  + Добавить этап
                </button>
              </div>
            ) : null}

            {tab === "scenes" ? (
              <div className="kadr-form">
                <p className="proj-settings-hint">Сцены для самопробы. PDF или изображение — до 8 МБ.</p>
                <FileDropzone
                  onFiles={(files) => void addSceneFiles(files)}
                  onError={ws.flash}
                  title="Добавить сцены файлами"
                  hint="каждый файл станет отдельной сценой"
                />
                <div className="proj-settings-cards">
                  {scenes.map((scene, i) => (
                    <div key={i} className="proj-settings-card">
                      <div className="proj-settings-card__head">
                        <span className="proj-settings-card__title">Сцена {scene.num || i + 1}</span>
                        <button
                          type="button"
                          className="proj-settings-remove"
                          onClick={() => setScenes(scenes.filter((_, j) => j !== i))}
                          aria-label="Удалить"
                        >
                          ×
                        </button>
                      </div>
                      <div className="kadr-form__row">
                        <Field label="Номер">
                          <input
                            value={scene.num}
                            onChange={(e) => updateScene(i, { num: e.target.value })}
                            placeholder="01"
                          />
                        </Field>
                        <Field label="Хронометраж">
                          <input
                            value={scene.duration}
                            onChange={(e) => updateScene(i, { duration: e.target.value })}
                            placeholder="1:45"
                          />
                        </Field>
                      </div>
                      <Field label="Название">
                        <input
                          value={scene.title}
                          onChange={(e) => updateScene(i, { title: e.target.value })}
                          placeholder="«Звонок из школы»"
                        />
                      </Field>
                      <Field label="Описание">
                        <input
                          value={scene.meta}
                          onChange={(e) => updateScene(i, { meta: e.target.value })}
                          placeholder="2 страницы · диалог"
                        />
                      </Field>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="proj-settings-add"
                  onClick={() =>
                    setScenes([
                      ...scenes,
                      {
                        num: String(scenes.length + 1).padStart(2, "0"),
                        title: "",
                        meta: "",
                        duration: "",
                      },
                    ])
                  }
                >
                  + Добавить сцену
                </button>
                <p className="proj-settings-section-title">Все сцены одним файлом</p>
                {scenesPdf ? (
                  <div className="file-store__list">
                    <FileStoreRow
                      name="Сцены для самопробы.pdf"
                      kind="PDF"
                      href={scenesPdf}
                      onRemove={() => setScenesPdf("")}
                    />
                  </div>
                ) : (
                  <FileDropzone
                    multiple={false}
                    accept=".pdf,application/pdf"
                    title="Загрузить сборник сцен"
                    hint="один PDF со всеми сценами"
                    onFiles={(files) => void replaceScenesPdf(files)}
                    onError={ws.flash}
                  />
                )}
              </div>
            ) : null}

            {tab === "docs" ? (
              <div className="kadr-form">
                <p className="proj-settings-hint">Документы кастинга. PDF, Word, Excel или изображение — до 8 МБ.</p>
                <DocsListEditor rows={docs} onChange={setDocs} onError={ws.flash} />
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
