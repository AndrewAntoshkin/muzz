"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { todayMsk } from "@/lib/deadline";
import type { FaceCard } from "@/lib/people";
import { fetchFaces } from "@/lib/people-query";
import { parseKvLines, parsePartners, PROJECT_STATUSES } from "@/lib/productions";
import { profileSlug, withRole, type RoleId } from "@/lib/roles";
import { useWorkspace } from "./useWorkspace";

const COMPOSE_BY_ROLE: Record<RoleId, string[]> = {
  actor: ["post"],
  casting: ["project", "casting", "post"],
  agent: ["propose"],
};

export function ComposeView({ roster }: { roster: FaceCard[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const ws = useWorkspace();
  const { role } = ws;
  if (!ws.ready) {
    return (
      <div className="page-scroll detail-page">
        <section className="detail-block kadr-form-card">
          <p className="compose-hint">Загружаем ваши проекты…</p>
        </section>
      </div>
    );
  }
  const requested = params.get("type") || "post";
  const allowed = COMPOSE_BY_ROLE[role];
  const type = allowed.includes(requested) ? requested : allowed[0];
  const presetCasting = params.get("casting") || "";
  const presetProject = params.get("project") || "";

  return (
    <div className="page-scroll detail-page">
      <section className="detail-block kadr-form-card">
        {type === "project" ? (
          <ProjectForm
            onDone={(slug) => router.push(withRole(`/projects/${slug}`, role))}
          />
        ) : type === "casting" ? (
          <CastingForm
            presetProject={presetProject}
            onDone={(slug) => router.push(withRole(`/castings/${slug}`, role))}
          />
        ) : type === "propose" ? (
          <ProposeForm
            roster={roster}
            presetCasting={presetCasting}
            onDone={() => router.push(withRole("/responses", role))}
          />
        ) : (
          <PostForm onDone={() => router.push(withRole("/", role))} />
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="kadr-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function PostForm({ onDone }: { onDone: () => void }) {
  const { addPost } = useWorkspace();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="kadr-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim() || saving) return;
        setSaving(true);
        const ok = await addPost(text.trim());
        setSaving(false);
        if (ok) onDone();
      }}
    >
      <Field label="Текст">
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Что происходит на площадке или в кастинге…" required />
      </Field>
      <button type="submit" className="btn-primary" disabled={!text.trim() || saving}>
        {saving ? "Публикуем…" : "Опубликовать"}
      </button>
    </form>
  );
}

function blank(s: string) {
  const t = s.trim();
  return t || undefined;
}

function kvFrom(pairs: [string, string][]) {
  const rows = pairs.map(([label, value]) => ({ label, value: value.trim() })).filter((row) => row.value);
  return rows.length ? rows : undefined;
}

function ProjectForm({ onDone }: { onDone: (slug: string) => void }) {
  const { addProject, cfg } = useWorkspace();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Препродакшн");
  const [studio, setStudio] = useState("");
  const [platform, setPlatform] = useState("");
  const [kind, setKind] = useState("");
  const [city, setCity] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [shifts, setShifts] = useState("");
  const [logline, setLogline] = useState("");
  const [text, setText] = useState("");
  const [client, setClient] = useState("");
  const [budget, setBudget] = useState("");
  const [nature, setNature] = useState("");
  const [pavilion, setPavilion] = useState("");
  const [cdName, setCdName] = useState(cfg.name);
  const [shiftsDone, setShiftsDone] = useState("");
  const [scenesDone, setScenesDone] = useState("");
  const [spent, setSpent] = useState("");
  const [preprod, setPreprod] = useState("");
  const [shoot, setShoot] = useState("");
  const [post, setPost] = useState("");
  const [release, setRelease] = useState("");
  const [financing, setFinancing] = useState("");
  const [theatres, setTheatres] = useState("");
  const [platformWindow, setPlatformWindow] = useState("");
  const [tv, setTv] = useState("");
  const [international, setInternational] = useState("");
  const [partners, setPartners] = useState("");

  return (
    <form
      className="kadr-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        const slug = await addProject({
          title,
          studio,
          platform,
          kind,
          city,
          logline,
          text,
          status,
          year: blank(year),
          shifts: blank(shifts),
          client: blank(client),
          budget: blank(budget),
          nature: blank(nature),
          pavilion: blank(pavilion),
          cdName: blank(cdName),
          shiftsDone: blank(shiftsDone),
          scenesDone: blank(scenesDone),
          spent: blank(spent),
          schedule: kvFrom([
            ["Препрод", preprod],
            ["Съёмки", shoot],
            ["Постпрод", post],
            ["Релиз", release],
          ]),
          financing: (() => {
            const rows = parseKvLines(financing).filter((row) => row.value);
            return rows.length ? rows : undefined;
          })(),
          distribution: kvFrom([
            ["Кинотеатры", theatres],
            ["Платформа", platformWindow],
            ["ТВ-окно", tv],
            ["Международно", international],
          ]),
          partners: (() => {
            const rows = parsePartners(partners);
            return rows.length ? rows : undefined;
          })(),
        });
        setSaving(false);
        if (slug) onDone(slug);
      }}
    >
      <p className="kadr-form__legend">Проект</p>
      <Field label="Название">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Тихий январь" />
      </Field>
      <div className="kadr-form__row">
        <Field label="Этап">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {PROJECT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Год">
          <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" />
        </Field>
      </div>
      <div className="kadr-form__row">
        <Field label="Студия">
          <input value={studio} onChange={(e) => setStudio(e.target.value)} placeholder="Название студии" />
        </Field>
        <Field label="Платформа">
          <input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Кинотеатры, онлайн-кинотеатр, ТВ…" />
        </Field>
      </div>
      <div className="kadr-form__row">
        <Field label="Формат">
          <input value={kind} onChange={(e) => setKind(e.target.value)} />
        </Field>
        <Field label="Город">
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва, Мурманск" />
        </Field>
      </div>
      <Field label="Смены">
        <input value={shifts} onChange={(e) => setShifts(e.target.value)} placeholder="34" />
      </Field>

      <p className="kadr-form__legend">Описание</p>
      <Field label="Логлайн">
        <textarea rows={3} value={logline} onChange={(e) => setLogline(e.target.value)} required placeholder="Короткий хук истории — одно-два предложения." />
      </Field>
      <Field label="О съёмках">
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Стиль, референсы, окно проката, фестивальная стратегия."
        />
      </Field>

      <p className="kadr-form__legend">Производство</p>
      <div className="kadr-form__row">
        <Field label="Заказчик">
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Кинопоиск Студия" />
        </Field>
        <Field label="Бюджет">
          <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="145 ₽ млн" />
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
      <Field label="Кастинг-директор">
        <input value={cdName} onChange={(e) => setCdName(e.target.value)} />
      </Field>
      <div className="kadr-form__row">
        <Field label="Прогресс смен">
          <input value={shiftsDone} onChange={(e) => setShiftsDone(e.target.value)} placeholder="32 / 47" />
        </Field>
        <Field label="Сцены сняты">
          <input value={scenesDone} onChange={(e) => setScenesDone(e.target.value)} placeholder="156 / 218" />
        </Field>
      </div>

      <p className="kadr-form__legend">График</p>
      <div className="kadr-form__row">
        <Field label="Препрод">
          <input value={preprod} onChange={(e) => setPreprod(e.target.value)} placeholder="янв — мар 2026" />
        </Field>
        <Field label="Съёмки">
          <input value={shoot} onChange={(e) => setShoot(e.target.value)} placeholder="апр — май 2026" />
        </Field>
      </div>
      <div className="kadr-form__row">
        <Field label="Постпрод">
          <input value={post} onChange={(e) => setPost(e.target.value)} placeholder="июн — сен 2026" />
        </Field>
        <Field label="Релиз">
          <input value={release} onChange={(e) => setRelease(e.target.value)} placeholder="Кинопоиск / прокат 2026" />
        </Field>
      </div>

      <p className="kadr-form__legend">Финансирование и прокат</p>
      <Field label="Источники финансирования">
        <textarea
          rows={4}
          value={financing}
          onChange={(e) => setFinancing(e.target.value)}
          placeholder={"Фонд кино — 80 ₽ млн\nКинопоиск Студия — 50 ₽ млн"}
        />
      </Field>
      <p className="kadr-form__hint">По строке: источник — сумма</p>
      <Field label="Освоено">
        <input value={spent} onChange={(e) => setSpent(e.target.value)} placeholder="18%" />
      </Field>
      <div className="kadr-form__row">
        <Field label="Кинотеатры">
          <input value={theatres} onChange={(e) => setTheatres(e.target.value)} placeholder="осень 2026" />
        </Field>
        <Field label="Окно платформы">
          <input value={platformWindow} onChange={(e) => setPlatformWindow(e.target.value)} placeholder="Кинопоиск · +45 дней" />
        </Field>
      </div>
      <div className="kadr-form__row">
        <Field label="ТВ-окно">
          <input value={tv} onChange={(e) => setTv(e.target.value)} />
        </Field>
        <Field label="Международно">
          <input value={international} onChange={(e) => setInternational(e.target.value)} placeholder="через Antipode Sales" />
        </Field>
      </div>
      <Field label="Партнёры">
        <textarea
          rows={3}
          value={partners}
          onChange={(e) => setPartners(e.target.value)}
          placeholder={"Кинопоиск Студия — Заказчик · платформа\nSreda Production — Продюсерская компания"}
        />
      </Field>
      <p className="kadr-form__hint">По строке: название — роль в проекте</p>

      <button type="submit" className="btn-primary" disabled={!title.trim() || !logline.trim() || saving}>
        {saving ? "Создаём…" : "Создать проект"}
      </button>
    </form>
  );
}

function CastingForm({
  presetProject,
  onDone,
}: {
  presetProject: string;
  onDone: (slug: string) => void;
}) {
  const { addCasting, projectsForCd, me } = useWorkspace();
  const mine = projectsForCd(me.slug);
  // Выбор проекта считаем из данных, а не копируем в state при первом рендере: после обновления страницы
  // проекты приходят позже, и закешированное пустое значение раньше блокировало отправку формы.
  const [pickedProject, setPickedProject] = useState("");
  const projectSlug = mine.some((p) => p.slug === pickedProject)
    ? pickedProject
    : mine.some((p) => p.slug === presetProject)
      ? presetProject
      : (mine[0]?.slug ?? "");
  const [title, setTitle] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [age, setAge] = useState("");
  const [deadlineOn, setDeadlineOn] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const today = todayMsk();

  if (!mine.length) {
    return (
      <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
        Сначала создайте проект — кастинг всегда принадлежит проекту.
      </p>
    );
  }

  return (
    <form
      className="kadr-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        const slug = await addCasting({
          projectSlug,
          title: title.trim(),
          roleLabel: roleLabel.trim(),
          text: text.trim(),
          deadlineOn: deadlineOn || null,
          age: age.trim() || undefined,
        });
        setSaving(false);
        if (slug) onDone(slug);
      }}
    >
      <Field label="Проект">
        <select value={projectSlug} onChange={(e) => setPickedProject(e.target.value)} required>
          {mine.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Название роли">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Главная роль · актриса 28–34" />
      </Field>
      <div className="kadr-form__row">
        <Field label="Тип роли">
          <input value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} required placeholder="Главная женская" />
        </Field>
        <Field label="Возраст">
          <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="28–34" />
        </Field>
      </div>
      <Field label="Принимаем отклики до">
        <input type="date" value={deadlineOn} min={today} onChange={(e) => setDeadlineOn(e.target.value)} />
      </Field>
      <p className="compose-hint" style={{ marginTop: -8 }}>
        После этой даты кастинг закроется сам. Без даты отклики принимаются, пока вы не закроете кастинг вручную.
      </p>
      <Field label="О роли">
        <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} required />
      </Field>
      <button type="submit" className="btn-primary" disabled={!title.trim() || !roleLabel.trim() || !text.trim() || !projectSlug || saving}>
        {saving ? "Публикуем…" : "Опубликовать кастинг"}
      </button>
    </form>
  );
}

function castingTalentFilter(casting: { title: string; roleLabel?: string }): "actor" | "actress" | "any" {
  const hay = `${casting.title} ${casting.roleLabel ?? ""}`.toLowerCase();
  if (/актрис|женск/.test(hay)) return "actress";
  if (/мужск|вторая муж|актёр(?!с)/.test(hay)) return "actor";
  return "any";
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

function ProposeForm({
  roster,
  presetCasting,
  onDone,
}: {
  roster: FaceCard[];
  presetCasting: string;
  onDone: () => void;
}) {
  const { proposeActor, castings, getProject, flash, shortlist } = useWorkspace();
  const open = useMemo(() => castings.filter((c) => c.status !== "closed"), [castings]);
  const [pickedCasting, setPickedCasting] = useState(presetCasting);
  const castingSlug = open.some((c) => c.slug === pickedCasting) ? pickedCasting : (open[0]?.slug ?? "");
  const [actorSlug, setActorSlug] = useState("");
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const query = useDebounced(q.trim(), 250);
  const [found, setFound] = useState<FaceCard[] | null>(null);
  const [searching, setSearching] = useState(false);

  const selectedCasting = open.find((c) => c.slug === castingSlug);
  const talentFilter = selectedCasting ? castingTalentFilter(selectedCasting) : "any";

  // Поиск идёт по всему каталогу, а не по ростеру одного агентства: агент может предложить любого актёра.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- индикатор загрузки внешнего запроса
    setSearching(true);
    fetchFaces({ q: query || undefined, kind: "actors", profession: talentFilter === "any" ? undefined : talentFilter, limit: 24 })
      .then((res) => !cancelled && setFound(res.items))
      .catch(() => !cancelled && setFound([]))
      .finally(() => !cancelled && setSearching(false));
    return () => {
      cancelled = true;
    };
  }, [query, talentFilter]);

  const suggestions = useMemo(() => {
    const own = new Map<string, FaceCard>();
    for (const p of shortlist) {
      own.set(p.slug, {
        slug: p.slug,
        name: p.name,
        role: p.meta?.split(" · ")[0] ?? "",
        profession: "",
        city: "",
        imageUrl: p.photo || null,
        verified: false,
        hint: null,
        initials: null,
        bg: null,
        agencyId: null,
      });
    }
    for (const p of roster) if (!own.has(p.slug)) own.set(p.slug, p);
    return Array.from(own.values()).filter((p) => talentFilter === "any" || !p.profession || p.profession === talentFilter);
  }, [shortlist, roster, talentFilter]);

  const list = query ? (found ?? []) : suggestions.length ? suggestions : (found ?? []);
  const heading = query ? "Результаты поиска" : suggestions.length ? "Ваш шорт-лист и ростер" : "Из каталога";

  const person = list.find((p) => p.slug === actorSlug) ?? null;

  if (!open.length) {
    return <p style={{ fontSize: 15, color: "var(--text-muted)" }}>Сейчас нет открытых кастингов, на которые можно предложить актёра.</p>;
  }

  return (
    <form
      className="kadr-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!person || !castingSlug || saving) return;
        if (talentFilter !== "any" && person.profession && person.profession !== talentFilter) {
          flash(talentFilter === "actress" ? "На эту роль нужны актрисы" : "На эту роль нужны актёры");
          return;
        }
        setSaving(true);
        const ok = await proposeActor(castingSlug, person, note.trim());
        setSaving(false);
        if (ok) onDone();
      }}
    >
      <Field label="Кастинг">
        <select
          value={castingSlug}
          onChange={(e) => {
            setPickedCasting(e.target.value);
            setActorSlug("");
          }}
          required
        >
          {open.map((c) => {
            const project = getProject(c.projectSlug);
            return (
              <option key={c.slug} value={c.slug}>
                {c.title}
                {project ? ` — ${project.title}` : ""}
              </option>
            );
          })}
        </select>
      </Field>
      <Field label="Найти актёра в каталоге">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, город или типаж…" />
      </Field>
      {talentFilter !== "any" ? (
        <p className="compose-hint">
          {talentFilter === "actress" ? "Показаны актрисы — под выбранную роль" : "Показаны актёры — под выбранную роль"}
        </p>
      ) : null}
      <p className="compose-hint">{searching ? "Ищем…" : heading}</p>
      <div className="kadr-picker">
        {list.length ? (
          list.slice(0, 24).map((p) => (
            <button
              type="button"
              key={p.slug}
              className={p.slug === person?.slug ? "kadr-picker__item is-on" : "kadr-picker__item"}
              onClick={() => setActorSlug(p.slug)}
            >
              {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <span>{p.initials || p.name.slice(0, 1)}</span>}
              <em>{p.name}</em>
            </button>
          ))
        ) : (
          <p className="compose-hint" style={{ gridColumn: "1 / -1" }}>
            {searching ? "" : "Никого не нашли. Попробуйте другое имя."}
          </p>
        )}
      </div>
      <Field label="Комментарий кастинг-директору">
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Почему этот актёр на роль…" />
      </Field>
      <button type="submit" className="btn-primary" disabled={!person || !castingSlug || saving}>
        {saving ? "Отправляем…" : "Предложить"}
      </button>
    </form>
  );
}
