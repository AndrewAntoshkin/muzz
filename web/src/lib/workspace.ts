import {
  CASTINGS,
  PROJECTS,
  type Casting,
  type Project,
} from "@/lib/productions";
import type { RoleId } from "@/lib/roles";

export const WORKSPACE_KEY = "kadr-workspace-v6";

export type Availability = "open" | "busy" | "hold";

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  open: "Открыт к предложениям",
  busy: "Занят на проекте",
  hold: "Hold · ограниченно",
};

export type ActorPulse = {
  id: string;
  personSlug: string;
  name: string;
  avatar: string;
  text: string;
  availability: Availability;
  updatedAt: number;
};

export type ProfilePatch = {
  bio?: string;
  city?: string;
  params?: { label: string; value: string }[];
  appearance?: { label: string; value: string }[];
  languages?: { label: string; value: string }[];
  skills?: string[];
};

export type AppStatus = "sent" | "shortlist" | "invited" | "declined";
export type AppKind = "apply" | "selftape" | "propose";

export type Application = {
  id: string;
  castingSlug: string;
  actorSlug: string;
  actorName: string;
  actorAvatar: string | null;
  kind: AppKind;
  note: string;
  status: AppStatus;
  source: "actor" | "agent";
  createdAt: number;
};

export type FeedPost = {
  id: string;
  authorRole: RoleId;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: number;
};

export type ChatPeer = {
  name: string;
  roleLabel: string;
  avatar?: string;
  initials?: string;
  bg?: string;
  profileHref?: string;
  extraHref?: string;
  extraLabel?: string;
};

export type ChatLine = {
  id: string;
  authorRole: RoleId | "studio";
  text: string;
  time: string;
  createdAt: number;
  card?: { title: string; meta: string; href: string };
};

export type ChatThread = {
  id: string;
  roles: RoleId[];
  views: Partial<Record<RoleId, ChatPeer>>;
  unreadFor: RoleId[];
  messages: ChatLine[];
};

export type WorkspaceSettings = {
  notifyEmail: boolean;
  notifyPush: boolean;
};

export type WorkspaceState = {
  v: 1;
  projects: Project[];
  castings: Casting[];
  applications: Application[];
  posts: FeedPost[];
  threads: ChatThread[];
  saved: string[];
  settings: WorkspaceSettings;
  pulses: ActorPulse[];
  profilePatches: Record<string, ProfilePatch>;
};

const COVERS = [
  "/assets/figma/post-01.png",
  "/assets/figma/post-04.png",
  "/assets/figma/post-06.png",
  "/assets/figma/hero-01.png",
];

export const STATUS_LABEL: Record<AppStatus, string> = {
  sent: "Отправлено",
  shortlist: "Шорт-лист",
  invited: "Приглашение на очные",
  declined: "Отклонено",
};

export const KIND_LABEL: Record<AppKind, string> = {
  apply: "Отклик",
  selftape: "Самопроба",
  propose: "Предложение агента",
};

function line(
  id: string,
  authorRole: ChatLine["authorRole"],
  text: string,
  time: string,
  createdAt: number,
  card?: ChatLine["card"],
): ChatLine {
  return { id, authorRole, text, time, createdAt, card };
}

export function seedState(): WorkspaceState {
  return {
    v: 1,
    projects: [],
    castings: [],
    applications: [
      {
        id: "app-ty-vz",
        castingSlug: "tihiy-yanvar-second",
        actorSlug: "vzmetnev",
        actorName: "Александр Взметнев",
        actorAvatar: "/assets/actors/vzmetnev-avatar.jpg",
        kind: "selftape",
        note: "Самопроба по сценам «Кухня» и «Школа». Ссылка в переписке с Лебедевой.",
        status: "shortlist",
        source: "actor",
        createdAt: Date.parse("2026-05-28T11:00:00Z"),
      },
      {
        id: "app-ty-ustyugov",
        castingSlug: "tihiy-yanvar-second",
        actorSlug: "ustyugov-aleksandr",
        actorName: "Александр Устюгов",
        actorAvatar: "/assets/actors/akter1/ustyugov-aleksandr.jpg",
        kind: "propose",
        note: "Предложение агента на вторую мужскую из ростера «Актёр 1».",
        status: "sent",
        source: "agent",
        createdAt: Date.parse("2026-05-27T15:00:00Z"),
      },
      {
        id: "app-ty-lerman",
        castingSlug: "tihiy-yanvar-lead",
        actorSlug: "lerman-olga",
        actorName: "Ольга Лерман",
        actorAvatar: "/assets/actors/akter1/lerman-olga.png",
        kind: "propose",
        note: "На главную женскую 28–34 из ростера «Актёр 1».",
        status: "invited",
        source: "agent",
        createdAt: Date.parse("2026-05-28T09:30:00Z"),
      },
      {
        id: "app-okno-chadov",
        castingSlug: "okno-hosts",
        actorSlug: "chadov-aleksej",
        actorName: "Алексей Чадов",
        actorAvatar: "/assets/actors/akter1/chadov-aleksej.jpeg",
        kind: "apply",
        note: "Опыт в разговорном жанре и доке.",
        status: "shortlist",
        source: "actor",
        createdAt: Date.parse("2026-05-22T10:00:00Z"),
      },
      {
        id: "app-okno-vz",
        castingSlug: "okno-hosts",
        actorSlug: "vzmetnev",
        actorName: "Александр Взметнев",
        actorAvatar: "/assets/actors/vzmetnev-avatar.jpg",
        kind: "apply",
        note: "Интересен формат ведущего, могу на Казань.",
        status: "sent",
        source: "actor",
        createdAt: Date.parse("2026-05-26T14:00:00Z"),
      },
      {
        id: "app-k14-lerman",
        castingSlug: "komnata-14-episode",
        actorSlug: "lerman-olga",
        actorName: "Ольга Лерман",
        actorAvatar: "/assets/actors/akter1/lerman-olga.png",
        kind: "apply",
        note: "",
        status: "declined",
        source: "actor",
        createdAt: Date.parse("2026-05-18T09:00:00Z"),
      },
      {
        id: "app-k14-shilovskaya",
        castingSlug: "komnata-14-episode",
        actorSlug: "shilovskaya-aglaya",
        actorName: "Аглая Шиловская",
        actorAvatar: "/assets/actors/akter1/shilovskaya-aglaya.jpg",
        kind: "propose",
        note: "Эпизод period 1950-е, свободна на смены.",
        status: "shortlist",
        source: "agent",
        createdAt: Date.parse("2026-05-20T11:00:00Z"),
      },
    ],
    posts: [
      {
        id: "post-cd-1",
        authorRole: "casting",
        authorName: "Анна Лебедева",
        authorAvatar: "/assets/figma/avatar-02.png",
        text: "Открыли кастинг на главную в «Тихом январе» (Sreda / Кинопоиск). Актриса 28–34, северная драма. Самопробы до 6 июня, очные 10–14. Пишите агентам или напрямую — разберу в порядке очереди.",
        createdAt: Date.parse("2026-05-27T09:00:00Z"),
      },
      {
        id: "post-ag-1",
        authorRole: "agent",
        authorName: "Анна Кеворкова",
        authorAvatar: "/assets/figma/avatar-01.png",
        text: "Ростер «Актёр 1» на июнь: Устюгов, Чадов, Лерман, Шиловская — свободны под сериал и короткий метр. Запросы на типажи 25–40 принимаю в Telegram.",
        createdAt: Date.parse("2026-05-26T16:20:00Z"),
      },
      {
        id: "post-ac-1",
        authorRole: "actor",
        authorName: "Александр Взметнев",
        authorAvatar: "/assets/actors/vzmetnev-avatar.jpg",
        text: "Самопроба по «Тихому январю» ушла. С июля открыт: драма, военное, криминал. Showreel и занятость — в анкете.",
        createdAt: Date.parse("2026-05-28T12:30:00Z"),
      },
    ],
    saved: ["casting:tihiy-yanvar-second", "casting:okno-hosts"],
    settings: { notifyEmail: true, notifyPush: false },
    profilePatches: {},
    pulses: [
      {
        id: "pulse-vz-1",
        personSlug: "vzmetnev",
        name: "Александр Взметнев",
        avatar: "/assets/actors/vzmetnev-avatar.jpg",
        text: "Самопроба «Тихий январь» в шорт-листе. С июля открыт: драма, военное, криминал. Экспедиции до 3 недель.",
        availability: "open",
        updatedAt: Date.parse("2026-05-28T12:30:00Z"),
      },
    ],
    threads: [
      {
        id: "lebedeva-vzmetnev",
        roles: ["actor", "casting"],
        unreadFor: ["actor", "casting"],
        views: {
          actor: {
            name: "Анна Лебедева",
            roleLabel: "Кастинг-директор · «Тихий январь»",
            avatar: "/assets/figma/avatar-02.png",
            profileHref: "/people/lebedeva",
            extraHref: "/castings/tihiy-yanvar-second",
            extraLabel: "К кастингу",
          },
          casting: {
            name: "Александр Взметнев",
            roleLabel: "Актёр",
            avatar: "/assets/actors/vzmetnev-avatar.jpg",
            profileHref: "/people/vzmetnev",
          },
        },
        messages: [
          line(
            "t1-1",
            "casting",
            "Александр, здравствуйте! По «Тихому январю» открыта вторая мужская 30–40. По типажу вы попадаете — приглашаем на самопробу.",
            "14:22",
            Date.parse("2026-05-27T14:22:00Z"),
            {
              title: "Вторая мужская · 30–40 — «Тихий январь»",
              meta: "Sreda Production · до 6 июня",
              href: "/castings/tihiy-yanvar-second",
            },
          ),
          line(
            "t1-2",
            "actor",
            "Спасибо, посмотрел. Когда дедлайн самопробы?",
            "14:35",
            Date.parse("2026-05-27T14:35:00Z"),
          ),
          line(
            "t1-3",
            "casting",
            "6 июня. Сцены «Кухня» и «Школа» прикрепляю. Очные 10–14 июня, если попадёте в шорт-лист.",
            "14:40",
            Date.parse("2026-05-27T14:40:00Z"),
          ),
          line(
            "t1-4",
            "actor",
            "Самопроба готова, отправил ссылку.",
            "11:00",
            Date.parse("2026-05-28T11:00:00Z"),
          ),
          line(
            "t1-5",
            "casting",
            "Приняла, вы в шорт-листе. Держите 10–14 июня свободными — подтвержу слот завтра.",
            "12:08",
            Date.parse("2026-05-28T12:08:00Z"),
          ),
        ],
      },
      {
        id: "kevorkova-lebedeva",
        roles: ["agent", "casting"],
        unreadFor: ["agent", "casting"],
        views: {
          agent: {
            name: "Анна Лебедева",
            roleLabel: "Кастинг-директор · «Тихий январь»",
            avatar: "/assets/figma/avatar-02.png",
            profileHref: "/people/lebedeva",
            extraHref: "/castings/tihiy-yanvar-lead",
            extraLabel: "К кастингу",
          },
          casting: {
            name: "Анна Кеворкова",
            roleLabel: "Агент · «Актёр 1»",
            avatar: "/assets/figma/avatar-01.png",
            profileHref: "/people/kevorkova",
          },
        },
        messages: [
          line(
            "t2-1",
            "casting",
            "Нужна актриса 28–34 на главную и мужчина 30–40 на вторую. Есть кто из ростера?",
            "10:20",
            Date.parse("2026-05-28T10:20:00Z"),
          ),
          line(
            "t2-2",
            "agent",
            "На главную — Лерман и Шиловская. На вторую мужскую — Устюгов; Взметнев уже сам в шорт-листе у вас.",
            "11:05",
            Date.parse("2026-05-28T11:05:00Z"),
          ),
          line(
            "t2-3",
            "casting",
            "Лерман интересна — пришлите самопробу по сценам 12/27. Устюгова тоже беру в шорт-лист на вторую.",
            "12:40",
            Date.parse("2026-05-28T12:40:00Z"),
          ),
          line(
            "t2-4",
            "agent",
            "Самопробу Лерман отправила. Устюгов свободен 10–20 июня, договор типовой «Актёр 1».",
            "15:10",
            Date.parse("2026-05-28T15:10:00Z"),
          ),
        ],
      },
      {
        id: "kevorkova-vzmetnev",
        roles: ["agent", "actor"],
        unreadFor: ["actor"],
        views: {
          agent: {
            name: "Александр Взметнев",
            roleLabel: "Актёр",
            avatar: "/assets/actors/vzmetnev-avatar.jpg",
            profileHref: "/people/vzmetnev",
          },
          actor: {
            name: "Анна Кеворкова",
            roleLabel: "Агент · «Актёр 1»",
            avatar: "/assets/figma/avatar-01.png",
            profileHref: "/people/kevorkova",
          },
        },
        messages: [
          line(
            "t3-1",
            "actor",
            "Договор по «Августу» — когда подпишем? И по второй мужской в «Тихом январе» Лебедева ждёт самопробу.",
            "18:00",
            Date.parse("2026-05-27T18:00:00Z"),
          ),
          line(
            "t3-2",
            "agent",
            "Юристы Sreda обещали правки сегодня. Как пришлют — сразу вам. По «Тихому январю» сцены уже в чате с Анной, дедлайн 6 июня — успеваете.",
            "18:40",
            Date.parse("2026-05-27T18:40:00Z"),
          ),
          line(
            "t3-3",
            "agent",
            "Ещё: Студия Окно зовёт на очные 14 июня по «Окну». Если интересен док — ответьте, подтвержу занятость.",
            "09:15",
            Date.parse("2026-05-28T09:15:00Z"),
          ),
        ],
      },
      {
        id: "sreda-vzmetnev",
        roles: ["actor"],
        unreadFor: [],
        views: {
          actor: {
            name: "Sreda Production",
            roleLabel: "Студия · Кинопоиск",
            avatar: "/assets/figma/avatar-04.png",
          },
        },
        messages: [
          line(
            "t4-1",
            "studio",
            "Договор отправили на почту, проверьте пункт 4 и даты 10–14 июня.",
            "вчера",
            Date.parse("2026-05-27T16:00:00Z"),
          ),
        ],
      },
      {
        id: "okno-vzmetnev",
        roles: ["actor"],
        unreadFor: ["actor"],
        views: {
          actor: {
            name: "Студия Окно",
            roleLabel: "Документальный сериал · KION",
            initials: "СО",
            bg: "#3D5C4A",
            extraHref: "/castings/okno-hosts",
            extraLabel: "К кастингу",
          },
        },
        messages: [
          line(
            "t5-1",
            "studio",
            "Приглашаем на очные пробы 14 июня, Москва. Ищем эпизод в док-сериал — скиньте показ-карту.",
            "2 дня",
            Date.parse("2026-05-26T12:00:00Z"),
          ),
        ],
      },
      {
        id: "sreda-kevorkova",
        roles: ["agent"],
        unreadFor: [],
        views: {
          agent: {
            name: "Sreda Production",
            roleLabel: "Студия · занятость ростера",
            avatar: "/assets/figma/avatar-04.png",
          },
        },
        messages: [
          line(
            "t6-1",
            "studio",
            "Подтвердите занятость Устюгова на июнь.",
            "2 дня",
            Date.parse("2026-05-26T09:00:00Z"),
          ),
        ],
      },
      {
        id: "sreda-lebedeva",
        roles: ["casting"],
        unreadFor: [],
        views: {
          casting: {
            name: "Sreda Production",
            roleLabel: "Студия · «Тихий январь»",
            avatar: "/assets/figma/avatar-04.png",
            extraHref: "/projects/tihiy-yanvar",
            extraLabel: "К проекту",
          },
        },
        messages: [
          line(
            "t7-1",
            "studio",
            "Подтверждаю даты 10–14 июня. Шорт-лист нужен к пятнице.",
            "вчера",
            Date.parse("2026-05-27T17:00:00Z"),
          ),
        ],
      },
    ],
  };
}

export function cloneSeed(): WorkspaceState {
  return structuredClone(seedState());
}

export function loadWorkspace(): WorkspaceState {
  if (typeof window === "undefined") return cloneSeed();
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (!raw) {
      const seed = cloneSeed();
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as WorkspaceState;
    if (parsed?.v !== 1 || !Array.isArray(parsed.threads)) return cloneSeed();
    return {
      ...cloneSeed(),
      ...parsed,
      settings: { ...cloneSeed().settings, ...parsed.settings },
      pulses: Array.isArray(parsed.pulses) ? parsed.pulses : cloneSeed().pulses,
      profilePatches: parsed.profilePatches && typeof parsed.profilePatches === "object" ? parsed.profilePatches : {},
    };
  } catch {
    return cloneSeed();
  }
}

export function saveWorkspace(state: WorkspaceState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(state));
}

export function allProjects(state: WorkspaceState): Project[] {
  const overrides = new Map(state.projects.map((p) => [p.slug, p]));
  const extra = state.projects.filter((p) => !PROJECTS.some((s) => s.slug === p.slug));
  const seeds = PROJECTS.map((p) => {
    const over = overrides.get(p.slug);
    return over ? { ...p, ...over } : p;
  });
  return [...extra, ...seeds];
}

export function allCastings(state: WorkspaceState): Casting[] {
  const extra = state.castings.filter((c) => !CASTINGS.some((s) => s.slug === c.slug));
  return [...extra, ...CASTINGS];
}

export function findProject(state: WorkspaceState, slug: string) {
  return allProjects(state).find((p) => p.slug === slug) ?? null;
}

export function findCasting(state: WorkspaceState, slug: string) {
  return allCastings(state).find((c) => c.slug === slug) ?? null;
}

export function castingsOfProject(state: WorkspaceState, projectSlug: string) {
  return allCastings(state).filter((c) => c.projectSlug === projectSlug);
}

export function projectsOfCd(state: WorkspaceState, cdSlug: string) {
  const list = allCastings(state);
  const fromCastings = new Set(list.filter((c) => c.cdSlug === cdSlug).map((c) => c.projectSlug));
  return allProjects(state).filter((p) => p.cdSlug === cdSlug || fromCastings.has(p.slug));
}

export function castingsOfCd(state: WorkspaceState, cdSlug: string) {
  return allCastings(state).filter((c) => c.cdSlug === cdSlug);
}

export function responseCount(state: WorkspaceState, casting: Casting) {
  const extra = state.applications.filter((a) => a.castingSlug === casting.slug).length;
  const seeded = CASTINGS.some((c) => c.slug === casting.slug);
  return seeded ? casting.responses + extra : extra;
}

export function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function slugify(text: string) {
  const base = text
    .toLowerCase()
    .replace(/[«»"']/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "item"}-${Date.now().toString(36)}`;
}

export function nowTime() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function coverFor(index: number) {
  return COVERS[index % COVERS.length];
}

export function lastLine(thread: ChatThread) {
  return thread.messages[thread.messages.length - 1] ?? null;
}

export function threadsFor(state: WorkspaceState, role: RoleId) {
  return state.threads
    .filter((t) => t.roles.includes(role) && t.views[role])
    .slice()
    .sort((a, b) => (lastLine(b)?.createdAt ?? 0) - (lastLine(a)?.createdAt ?? 0));
}

export function unreadCount(state: WorkspaceState, role: RoleId) {
  return threadsFor(state, role).filter((t) => t.unreadFor.includes(role)).length;
}
