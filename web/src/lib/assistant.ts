import { canUseAssistant, type PlanId } from "@/lib/plans";
import type { Casting } from "@/lib/productions";
import type { RoleId } from "@/lib/roles";
import { allCastings, type WorkspaceState } from "@/lib/workspace";

export const ASSISTANT_KIND = "assistant" as const;
export const ASSISTANT_KIND_LABEL = "Ассистент";

export type AssistantEvent = {
  id: string;
  kind: typeof ASSISTANT_KIND;
  kindLabel: typeof ASSISTANT_KIND_LABEL;
  title: string;
  text: string;
  href: string;
  createdAt: number;
  timeLabel: string;
};

const FEMALE_SLUGS = new Set([
  "lerman-olga",
  "shilovskaya-aglaya",
  "kutepova-polina",
  "hmelnickaya-alyona",
]);

function startOfToday(now = Date.now()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isClosed(casting: Casting) {
  return /закрыт/i.test(casting.deadline);
}

function haystack(casting: Casting) {
  return `${casting.title} ${casting.roleLabel} ${casting.text}`.toLowerCase();
}

function roleGender(casting: Casting): "m" | "f" | "any" {
  const text = haystack(casting);
  const female = /женск|актрис/.test(text);
  const male = /мужск|актёр|актер/.test(text);
  if (female && !male) return "f";
  if (male && !female) return "m";
  return "any";
}

function actorLooksFemale(slug: string, state: WorkspaceState) {
  if (FEMALE_SLUGS.has(slug)) return true;
  const last = slug.split("-").pop() || slug;
  if (/(ova|eva|ina|skaya)$/i.test(last)) return true;
  const name = state.applications.find((app) => app.actorSlug === slug)?.actorName;
  const surname = name?.trim().split(/\s+/).pop() || "";
  return /(ова|ева|ина|ская)$/i.test(surname);
}

function pickActorCastings(state: WorkspaceState, meSlug: string): Casting[] {
  const want = actorLooksFemale(meSlug, state) ? "f" : "m";
  const open = allCastings(state).filter((casting) => !isClosed(casting));
  const scored = open.map((casting) => {
    const gender = roleGender(casting);
    let score = 0;
    if (casting.urgent) score += 5;
    if (gender === want) score += 3;
    else if (gender === "any") score += 1;
    else score -= 4;
    return { casting, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const preferred = scored.filter((row) => row.score >= 1).map((row) => row.casting);
  const pool = preferred.length >= 2 ? preferred : scored.map((row) => row.casting);
  if (!pool.length) return allCastings(state).slice(0, 3);
  return pool.slice(0, Math.min(4, Math.max(2, pool.length)));
}

function formatTitles(titles: string[]) {
  if (!titles.length) return "";
  if (titles.length === 1) return titles[0];
  if (titles.length === 2) return `${titles[0]} и ${titles[1]}`;
  return `${titles.slice(0, -1).join(", ")} и ${titles[titles.length - 1]}`;
}

function artistsPhrase(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "новый артист";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "новых артиста";
  return "новых артистов";
}

function lockedTeaser(): AssistantEvent {
  return {
    id: "assistant:locked",
    kind: ASSISTANT_KIND,
    kindLabel: ASSISTANT_KIND_LABEL,
    title: "Ассистент недоступен",
    text: "Ежедневная выборка кастингов — в Про и Премиум",
    href: "/",
    createdAt: startOfToday(),
    timeLabel: "сегодня",
  };
}

function actorDigest(state: WorkspaceState, meSlug: string): AssistantEvent {
  const picks = pickActorCastings(state, meSlug);
  const titles = picks.map((casting) => casting.title);
  const text = titles.length
    ? `На сегодня: ${formatTitles(titles)}.`
    : "Сегодня в ленте мало открытых ролей — можно посмотреть все кастинги.";
  return {
    id: "assistant:today:actor",
    kind: ASSISTANT_KIND,
    kindLabel: ASSISTANT_KIND_LABEL,
    title: "Подборка на сегодня",
    text,
    href: picks[0] ? `/castings/${picks[0].slug}` : "/castings",
    createdAt: startOfToday(),
    timeLabel: "сегодня",
  };
}

function castingDigest(state: WorkspaceState): AssistantEvent {
  const names = Array.from(
    new Set((state.pulses ?? []).map((pulse) => pulse.name.trim()).filter(Boolean)),
  );
  const listed = names.slice(0, 3);
  const n = names.length;
  const text = listed.length
    ? `Сегодня в Кадре: ${n} ${artistsPhrase(n)}. ${listed.join(", ")}.`
    : "Сегодня в Кадре пока тихо — новые артисты появятся в каталоге лиц.";
  return {
    id: "assistant:today:casting",
    kind: ASSISTANT_KIND,
    kindLabel: ASSISTANT_KIND_LABEL,
    title: "Новые лица",
    text,
    href: "/faces",
    createdAt: startOfToday(),
    timeLabel: "сегодня",
  };
}

/** Daily non-AI digest for the inbox (and hub card). Null for agents. */
export function assistantDigest(
  state: WorkspaceState,
  role: RoleId,
  meSlug: string,
  plan: PlanId,
): AssistantEvent | null {
  if (role !== "actor" && role !== "casting") return null;
  if (!canUseAssistant(plan)) return lockedTeaser();
  return role === "actor" ? actorDigest(state, meSlug) : castingDigest(state);
}
