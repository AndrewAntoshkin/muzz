"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import type { FaceCard } from "@/lib/people";
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
  return (
    <form
      className="kadr-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        addPost(text.trim());
        onDone();
      }}
    >
      <Field label="Текст">
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Что происходит на площадке или в кастинге…" required />
      </Field>
      <button type="submit" className="btn-primary" disabled={!text.trim()}>
        Опубликовать
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
  const { addProject } = useWorkspace();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Препродакшн");
  const [studio, setStudio] = useState("Sreda Production");
  const [platform, setPlatform] = useState("Кинопоиск");
  const [kind, setKind] = useState("Полный метр · драма");
  const [city, setCity] = useState("Москва");
  const [year, setYear] = useState("2026");
  const [shifts, setShifts] = useState("");
  const [logline, setLogline] = useState("");
  const [text, setText] = useState("");
  const [client, setClient] = useState("");
  const [budget, setBudget] = useState("");
  const [nature, setNature] = useState("");
  const [pavilion, setPavilion] = useState("");
  const [cdName, setCdName] = useState("Анна Лебедева");
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
      onSubmit={(e) => {
        e.preventDefault();
        const slug = addProject({
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
        onDone(slug);
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
          <input value={studio} onChange={(e) => setStudio(e.target.value)} />
        </Field>
        <Field label="Платформа">
          <input value={platform} onChange={(e) => setPlatform(e.target.value)} />
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

      <button type="submit" className="btn-primary" disabled={!title.trim() || !logline.trim()}>
        Создать проект
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
  const { addCasting, projectsForCd, cfg } = useWorkspace();
  const mine = projectsForCd(profileSlug(cfg));
  const [projectSlug, setProjectSlug] = useState(presetProject || mine[0]?.slug || "");
  const [title, setTitle] = useState("");
  const [roleLabel, setRoleLabel] = useState("Главная женская");
  const [age, setAge] = useState("28–34");
  const [deadline, setDeadline] = useState("20 июня");
  const [text, setText] = useState("");

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
      onSubmit={(e) => {
        e.preventDefault();
        const slug = addCasting({ projectSlug, title, roleLabel, text, deadline, age });
        onDone(slug);
      }}
    >
      <Field label="Проект">
        <select value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)} required>
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
          <input value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} />
        </Field>
        <Field label="Возраст">
          <input value={age} onChange={(e) => setAge(e.target.value)} />
        </Field>
      </div>
      <Field label="Дедлайн">
        <input value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
      </Field>
      <Field label="О роли">
        <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} required />
      </Field>
      <button type="submit" className="btn-primary" disabled={!title.trim() || !text.trim() || !projectSlug}>
        Опубликовать кастинг
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

function ProposeForm({
  roster,
  presetCasting,
  onDone,
}: {
  roster: FaceCard[];
  presetCasting: string;
  onDone: () => void;
}) {
  const { proposeActor, castings, getProject, flash } = useWorkspace();
  const [castingSlug, setCastingSlug] = useState(presetCasting || castings[0]?.slug || "");
  const [actorSlug, setActorSlug] = useState("");
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");

  const selectedCasting = castings.find((c) => c.slug === castingSlug) ?? castings[0];
  const talentFilter = selectedCasting ? castingTalentFilter(selectedCasting) : "any";

  const rosterForCasting = useMemo(() => {
    if (talentFilter === "any") return roster;
    return roster.filter((p) => p.profession === talentFilter);
  }, [roster, talentFilter]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rosterForCasting;
    return rosterForCasting.filter((p) => `${p.name} ${p.role} ${p.city}`.toLowerCase().includes(query));
  }, [rosterForCasting, q]);

  const person =
    filtered.find((p) => p.slug === actorSlug) ??
    rosterForCasting.find((p) => p.slug === actorSlug) ??
    filtered[0] ??
    null;

  if (!roster.length) {
    return <p style={{ fontSize: 15, color: "var(--text-muted)" }}>Ростер агентства пока пуст.</p>;
  }

  return (
    <form
      className="kadr-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!person || !castingSlug) return;
        if (talentFilter !== "any" && person.profession !== talentFilter) {
          flash(
            talentFilter === "actress"
              ? "На эту роль нужны актрисы из ростера"
              : "На эту роль нужны актёры из ростера",
          );
          return;
        }
        if (proposeActor(castingSlug, person, note.trim())) onDone();
      }}
    >
      <Field label="Кастинг">
        <select
          value={castingSlug}
          onChange={(e) => {
            setCastingSlug(e.target.value);
            setActorSlug("");
          }}
          required
        >
          {castings.map((c) => {
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
      <Field label="Поиск по ростеру">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя актёра…" />
      </Field>
      {talentFilter !== "any" ? (
        <p className="compose-hint">
          {talentFilter === "actress"
            ? "Показаны актрисы — под типаж выбранной роли"
            : "Показаны актёры — под типаж выбранной роли"}
        </p>
      ) : null}
      <div className="kadr-picker">
        {filtered.length ? (
          filtered.slice(0, 24).map((p) => (
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
            В ростере нет подходящих по полу кандидатов на эту роль.
          </p>
        )}
      </div>
      <Field label="Комментарий кастинг-директору">
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Почему этот актёр на роль…" />
      </Field>
      <button type="submit" className="btn-primary" disabled={!person || !castingSlug}>
        Предложить
      </button>
    </form>
  );
}
