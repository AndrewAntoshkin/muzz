export type ProjectKv = { label: string; value: string };

export type ProjectPartner = {
  name: string;
  meta: string;
  initials?: string;
  bg?: string;
};

export type ProjectTeamMember = {
  name: string;
  role: string;
  avatar?: string;
  initials?: string;
  bg?: string;
  href?: string;
};

export type ProjectDoc = {
  label: string;
  value: string;
};

export type TimelineState = "done" | "current" | "future";

export type TimelineItem = {
  date: string;
  title: string;
  meta?: string;
  state?: TimelineState;
};

export type ProjectOpening = {
  title: string;
  meta: string;
  initials: string;
  bg: string;
  responses: number;
  tag: "urgent" | "open" | "soon";
  href?: string;
};

export type ProjectUpdate = {
  author: string;
  time: string;
  text: string;
  avatar?: string;
  initials?: string;
  bg?: string;
  image?: string;
};

export type CastingScene = {
  num: string;
  title: string;
  meta: string;
  duration: string;
};

export type CastingApplicant = {
  name: string;
  meta: string;
  match: string;
  tag: string;
  tagKind: "green" | "blue" | "gray" | "orange";
  avatar?: string;
  href?: string;
};

export function timelineClass(state?: TimelineState) {
  if (state === "done") return "timeline-item done";
  if (state === "future") return "timeline-item future";
  return "timeline-item";
}

export function scheduleTimeline(project: Project): TimelineItem[] {
  const rows = project.schedule?.filter((r) => r.value) ?? [];
  if (!rows.length) return [];
  const current =
    project.status === "Релиз"
      ? rows.length - 1
      : project.status === "Постпродакшн"
        ? Math.min(2, rows.length - 1)
        : project.status === "В производстве"
          ? Math.min(1, rows.length - 1)
          : 0;
  return rows.map((row, i) => ({
    date: row.value,
    title: row.label,
    state: (i < current ? "done" : i > current ? "future" : "current") as TimelineState,
  }));
}

export type ProjectBlockId =
  | "facts"
  | "team"
  | "status"
  | "budget"
  | "distribution"
  | "partners"
  | "docs";

export type ProjectBlocks = Partial<Record<ProjectBlockId, boolean>>;

export const PROJECT_BLOCK_META: { id: ProjectBlockId; label: string }[] = [
  { id: "facts", label: "Сводка под логлайном" },
  { id: "team", label: "Команда" },
  { id: "status", label: "Статус производства" },
  { id: "budget", label: "Бюджет и финансирование" },
  { id: "distribution", label: "Прокат и платформа" },
  { id: "partners", label: "Партнёры производства" },
  { id: "docs", label: "Документы и юр." },
];

export const DEFAULT_PROJECT_BLOCKS: Record<ProjectBlockId, boolean> = {
  facts: true,
  team: false,
  status: true,
  budget: false,
  distribution: false,
  partners: false,
  docs: false,
};

export function projectBlocks(project: Project): Record<ProjectBlockId, boolean> {
  return { ...DEFAULT_PROJECT_BLOCKS, ...project.blocks };
}

export type ProjectDraft = {
  title: string;
  studio: string;
  platform: string;
  kind: string;
  city: string;
  logline: string;
  text: string;
  status?: string;
  year?: string;
  shifts?: string;
  client?: string;
  budget?: string;
  nature?: string;
  pavilion?: string;
  cdName?: string;
  shiftsDone?: string;
  scenesDone?: string;
  spent?: string;
  schedule?: ProjectKv[];
  financing?: ProjectKv[];
  distribution?: ProjectKv[];
  partners?: ProjectPartner[];
  docs?: ProjectDoc[];
  team?: ProjectTeamMember[];
  openings?: ProjectOpening[];
  updates?: ProjectUpdate[];
  blocks?: ProjectBlocks;
};

export type Project = {
  slug: string;
  title: string;
  studio: string;
  studioAvatar: string;
  platform: string;
  kind: string;
  status: string;
  city: string;
  cover: string;
  logline: string;
  text: string;
  year: string;
  shifts?: string;
  cdSlug?: string;
  client?: string;
  budget?: string;
  nature?: string;
  pavilion?: string;
  cdName?: string;
  shiftsDone?: string;
  scenesDone?: string;
  spent?: string;
  schedule?: ProjectKv[];
  financing?: ProjectKv[];
  distribution?: ProjectKv[];
  partners?: ProjectPartner[];
  docs?: ProjectDoc[];
  team?: ProjectTeamMember[];
  openings?: ProjectOpening[];
  updates?: ProjectUpdate[];
  blocks?: ProjectBlocks;
};

const KV_SPLIT = /\s+[—–-]\s+|:\s+/;

export function parseKvLines(raw: string): ProjectKv[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(KV_SPLIT);
      if (parts.length >= 2) {
        return { label: parts[0].trim(), value: parts.slice(1).join(" — ").trim() };
      }
      return { label: line, value: "" };
    })
    .filter((row) => row.label);
}

export function parsePartners(raw: string): ProjectPartner[] {
  return parseKvLines(raw)
    .filter((row) => row.value)
    .map((row) => ({ name: row.label, meta: row.value }));
}

export function kvToLines(rows?: ProjectKv[]) {
  return rows?.map((row) => `${row.label} — ${row.value}`).join("\n") ?? "";
}

export function kvValue(rows: ProjectKv[] | undefined, label: string) {
  return rows?.find((row) => row.label === label)?.value ?? "";
}

export function mergeNamed<T extends { name: string }>(raw: string, prev: T[] | undefined, map: (name: string, meta: string, old?: T) => T): T[] {
  return parseKvLines(raw)
    .filter((row) => row.value)
    .map((row) => map(row.label, row.value, prev?.find((item) => item.name === row.label)));
}

export function parseFraction(s?: string) {
  if (!s) return null;
  const m = s.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  const done = Number(m[1]);
  const total = Number(m[2]);
  if (!total) return null;
  return { done, total, pct: Math.min(100, Math.round((done / total) * 100)) };
}

export const PROJECT_STATUSES = [
  "Препродакшн",
  "Кастинг",
  "В производстве",
  "Постпродакшн",
  "Релиз",
] as const;

export type Casting = {
  slug: string;
  projectSlug: string;
  title: string;
  roleLabel: string;
  text: string;
  meta: string;
  deadline: string;
  responses: number;
  urgent?: boolean;
  media: string;
  facts: [string, string][];
  cdSlug: string;
  cdName: string;
  published?: string;
  timeline?: TimelineItem[];
  scenes?: CastingScene[];
  applicants?: CastingApplicant[];
  docs?: ProjectDoc[];
};

export const PROJECTS: Project[] = [
  {
    slug: "tihiy-yanvar",
    title: "«Тихий январь»",
    studio: "Sreda Production",
    studioAvatar: "/assets/figma/avatar-04.png",
    platform: "Кинопоиск",
    kind: "Полный метр · драма",
    status: "Препродакшн",
    city: "Москва, Мурманск",
    cover: "/assets/figma/post-01.png",
    logline:
      "Северная драма о провинциальной учительнице, чья дочь исчезает после метели.",
    text: "Снимаем зимой: низкое солнце, метель, павильонные интерьеры школы и квартиры. Референсы: «Левиафан», «Нелюбовь», «Манчестер у моря». Окно проката: кинотеатры → Кинопоиск через 45 дней. Фестивальная стратегия: «Кинотавр», ММКФ.",
    year: "2026",
    shifts: "34",
    cdSlug: "lebedeva",
    client: "Кинопоиск Студия",
    budget: "145 ₽ млн",
    nature: "Мурманск",
    pavilion: "Москва",
    cdName: "Анна Лебедева",
    schedule: [
      { label: "Препрод", value: "янв — мар 2026" },
      { label: "Съёмки", value: "апр — май 2026" },
      { label: "Постпрод", value: "июн — сен 2026" },
      { label: "Релиз", value: "Кинопоиск / прокат 2026" },
    ],
    financing: [
      { label: "Фонд кино", value: "80 ₽ млн" },
      { label: "Кинопоиск Студия", value: "50 ₽ млн" },
      { label: "Sreda Production", value: "15 ₽ млн" },
    ],
    distribution: [
      { label: "Кинотеатры", value: "осень 2026" },
      { label: "Платформа", value: "Кинопоиск · +45 дней" },
      { label: "Международно", value: "через Antipode Sales" },
    ],
    partners: [
      { name: "Кинопоиск Студия", meta: "Заказчик · платформа", initials: "КП", bg: "#181818" },
      { name: "Sreda Production", meta: "Продюсерская компания", initials: "SR", bg: "#2c2c2b" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Сценарий v2", value: "PDF" },
      { label: "График смен", value: "PDF" },
    ],
    team: [
      { name: "Анна Белова", role: "Режиссёр", initials: "АБ", bg: "#4A3D5C" },
      {
        name: "Анна Лебедева",
        role: "Кастинг-директор",
        avatar: "/assets/figma/avatar-02.png",
        href: "/people/lebedeva",
      },
      { name: "Мария Коваль", role: "Продюсер", avatar: "/assets/figma/avatar-04.png" },
      {
        name: "Александр Взметнев",
        role: "Актёр · в рассмотрении",
        avatar: "/assets/actors/vzmetnev-avatar.jpg",
        href: "/people/vzmetnev",
      },
    ],
    updates: [
      {
        author: "Анна Лебедева",
        avatar: "/assets/figma/avatar-02.png",
        time: "2 дня назад",
        text: "Открыли кастинг главной женской. Самопробы до 6 июня, очные 10–14 июня на площадке Sreda. Ищем внутреннюю сдержанность, не плакальщицу.",
      },
    ],
  },
  {
    slug: "posle-shtorma",
    title: "«После шторма»",
    studio: "Trace Films",
    studioAvatar: "/assets/figma/avatar-01.png",
    platform: "Okko",
    kind: "Полный метр · драма",
    status: "В производстве",
    city: "Краснодарский край",
    cover: "/assets/figma/hero-01.png",
    logline:
      "После шторма рыбак находит на побережье чужого ребёнка — и понимает, что вернуть его некому. История о том, как чужая беда становится способом понять собственную.",
    text: "Камерная драма с акцентом на ландшафт. Снимаем зимой, после шторма — естественное освещение, ветер, песок, серое море. Референсы: «Манчестер у моря», «Маяк», ранний Звягинцев. Заказчик — Okko Studios, копрод — Трикстер. Окно проката: кинотеатры (Москино + независимый прокат) → Okko через 45 дней. Фестивальная стратегия: «Маяк», ММКФ, Венеция (Orizzonti).",
    year: "2026",
    shifts: "47",
    client: "Okko Studios",
    budget: "168 ₽ млн",
    nature: "Краснодарский край",
    shiftsDone: "32 / 47",
    scenesDone: "156 / 218",
    spent: "57%",
    schedule: [
      { label: "Препрод", value: "фев — апр 2026" },
      { label: "Съёмки", value: "апр — июн 2026" },
      { label: "Постпрод", value: "июл — окт 2026" },
      { label: "Релиз", value: "ММКФ 2026 / прокат 2027" },
    ],
    financing: [
      { label: "Фонд кино", value: "70 ₽ млн" },
      { label: "Okko Studios", value: "62 ₽ млн" },
      { label: "Trace Films", value: "26 ₽ млн" },
      { label: "Трикстер", value: "10 ₽ млн" },
    ],
    distribution: [
      { label: "Кинотеатры", value: "декабрь 2026" },
      { label: "Платформа", value: "Okko · с фев 2027" },
      { label: "ТВ-окно", value: "Первый канал · 2028" },
      { label: "Международно", value: "через Antipode Sales" },
    ],
    partners: [
      { name: "Okko Studios", meta: "Заказчик · платформа", initials: "OKKO", bg: "#181818" },
      { name: "Cinelab Rentals", meta: "ARRI · оптика · KADR15", initials: "CL", bg: "#2c2c2b" },
      { name: "Mosfilm Sound", meta: "Atmos · постпрод · −20%", initials: "MS", bg: "#3D6D99" },
      { name: "Москино", meta: "Прокат · локейшн-поддержка", initials: "МК", bg: "#5C4A45" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Сценарий v3", value: "PDF" },
      { label: "График смен", value: "PDF" },
      { label: "Бюджет", value: "XLSX" },
    ],
    team: [
      { name: "Ксения Воронина", role: "Продюсер", avatar: "/assets/figma/avatar-01.png" },
      { name: "Анна Белова", role: "Режиссёр", initials: "АБ", bg: "#4A3D5C" },
      { name: "Дмитрий Карпов", role: "Оператор-пост.", avatar: "/assets/figma/avatar-04.png" },
      {
        name: "Александр Взметнев",
        role: "Актёр · главная м.",
        avatar: "/assets/actors/vzmetnev-avatar.jpg",
        href: "/people/vzmetnev",
      },
      { name: "Мария Коваль", role: "Актриса · главная ж.", avatar: "/assets/figma/avatar-02.png" },
      { name: "Артём Сухов", role: "Монтаж", initials: "АС", bg: "#5C5340" },
      { name: "Игорь Петров", role: "Гафер", initials: "ИП", bg: "#3D5C4A" },
      { name: "Ольга Семёнова", role: "Костюм", initials: "ОС", bg: "#5C3D48" },
    ],
    openings: [
      {
        title: "Колорист · DaVinci Resolve Studio",
        meta: "Постпрод 4 нед · бюджет 1.2 ₽ млн · удалёнка ок · DCP для проката",
        initials: "К",
        bg: "#2C2C2B",
        responses: 8,
        tag: "urgent",
      },
      {
        title: "PR · фестивальная стратегия",
        meta: "Подача на «Маяк», ММКФ, Венеция (Orizzonti), Locarno",
        initials: "PR",
        bg: "#3D6D99",
        responses: 3,
        tag: "open",
      },
      {
        title: "Композитор",
        meta: "Оригинальный саундтрек · 18–22 мин · бюджет 1.8 ₽ млн + права",
        initials: "См",
        bg: "#5C4A45",
        responses: 11,
        tag: "open",
      },
      {
        title: "VFX-супервайзер",
        meta: "Лёгкий клин-ап, удаление техники, погодные эффекты",
        initials: "VFX",
        bg: "#3D5C4A",
        responses: 5,
        tag: "soon",
      },
    ],
    updates: [
      {
        author: "Ксения Воронина",
        avatar: "/assets/figma/avatar-01.png",
        time: "3 дня назад",
        text: "Закончили основной блок на побережье. 32 из 47 смен в коробке. Идём на 2 дня впереди графика — спасибо команде и Дмитрию за работу при −4° и ветре 18 м/с.",
        image: "/assets/figma/post-02.png",
      },
      {
        author: "Анна Белова",
        initials: "АБ",
        bg: "#4A3D5C",
        time: "9 дней назад",
        text: "Первый просмотр сцены с ребёнком — играет вообще не как репетировали и это лучше, чем я придумывала. Оставляем.",
      },
    ],
    blocks: {
      facts: true,
      team: true,
      status: true,
      budget: true,
      distribution: true,
      partners: true,
      docs: false,
    },
  },
  {
    slug: "okno",
    title: "«Окно»",
    studio: "Студия Окно",
    studioAvatar: "/assets/figma/avatar-04.png",
    platform: "KION",
    kind: "Документальный сериал",
    status: "Кастинг",
    city: "Москва, Казань",
    cover: "/assets/figma/post-06.png",
    logline: "Док-сериал о людях в окнах чужих городов. 6 серий по 45 минут.",
    text: "Handheld, доступный свет, интервью в жилых интерьерах. Финансирование ИРИ. Ведущие с опытом в доке и разговорном жанре — кастинг открыт.",
    year: "2026",
    cdSlug: "lebedeva",
    client: "KION",
    budget: "48 ₽ млн",
    nature: "Москва, Казань",
    cdName: "Анна Лебедева",
    schedule: [
      { label: "Препрод", value: "май — июн 2026" },
      { label: "Съёмки", value: "июл — сен 2026" },
      { label: "Постпрод", value: "окт — дек 2026" },
      { label: "Релиз", value: "KION · 2027" },
    ],
    financing: [
      { label: "ИРИ", value: "28 ₽ млн" },
      { label: "KION", value: "20 ₽ млн" },
    ],
    distribution: [
      { label: "Платформа", value: "KION · 2027" },
      { label: "ТВ-окно", value: "не закреплено" },
    ],
    partners: [
      { name: "KION", meta: "Заказчик · платформа", initials: "KION", bg: "#181818" },
      { name: "ИРИ", meta: "Финансирование", initials: "ИРИ", bg: "#3D6D99" },
    ],
    team: [
      {
        name: "Анна Лебедева",
        role: "Кастинг-директор",
        avatar: "/assets/figma/avatar-02.png",
        href: "/people/lebedeva",
      },
    ],
  },
  {
    slug: "komnata-14",
    title: "«Комната 14»",
    studio: "Анна Лебедева",
    studioAvatar: "/assets/figma/avatar-02.png",
    platform: "фестиваль",
    kind: "Короткий метр · period",
    status: "Кастинг",
    city: "Москва",
    cover: "/assets/figma/post-04.png",
    logline: "Короткий метр, 1950-е. Подача на «Святую Анну» и «Окно в Европу».",
    text: "22 минуты. Period-декор, парики, спецгрим. Павильон и натура в Москве. Несколько эпизодических ролей — кастинг открыт.",
    year: "2026",
    shifts: "8",
    cdSlug: "lebedeva",
    client: "независимое",
    budget: "4.8 ₽ млн",
    nature: "Москва",
    pavilion: "Москва",
    cdName: "Анна Лебедева",
    schedule: [
      { label: "Препрод", value: "май 2026" },
      { label: "Съёмки", value: "июн 2026" },
      { label: "Постпрод", value: "июл — авг 2026" },
      { label: "Релиз", value: "«Святая Анна» 2026" },
    ],
    financing: [
      { label: "Минкульт", value: "3.2 ₽ млн" },
      { label: "Краудфандинг", value: "1.6 ₽ млн" },
    ],
    distribution: [
      { label: "Фестивали", value: "«Святая Анна», «Окно в Европу», Beat Film" },
    ],
    team: [
      {
        name: "Анна Лебедева",
        role: "Кастинг-директор",
        avatar: "/assets/figma/avatar-02.png",
        href: "/people/lebedeva",
      },
    ],
  },
];

export const CASTINGS: Casting[] = [
  {
    slug: "tihiy-yanvar-lead",
    projectSlug: "tihiy-yanvar",
    title: "Главная роль · актриса 28–34",
    roleLabel: "Главная женская",
    text: "Драма о жизни в северном городе. Героиня — учительница, 28–34 года. Очные кастинги 10–14 июня. Прокат на Кинопоиске и в кинотеатрах.",
    meta: "Полный метр · Кинопоиск · Москва, Мурманск",
    deadline: "6 июня",
    responses: 142,
    urgent: true,
    media: "/assets/figma/post-01.png",
    facts: [
      ["Роль", "Главная женская"],
      ["Возраст", "28–34"],
      ["Гонорар", "2.4–3.2 ₽ млн за проект"],
      ["Платформа", "Кинопоиск"],
    ],
    cdSlug: "lebedeva",
    cdName: "Анна Лебедева",
    published: "21 мая",
    timeline: [
      { date: "21 мая", title: "Объявление и сбор самопроб", meta: "142 отклика", state: "done" },
      { date: "6 июня", title: "Дедлайн самопроб", meta: "12 дней осталось", state: "current" },
      { date: "10–14 июня", title: "Очные пробы · Москва", meta: "студия Sreda · по приглашениям", state: "future" },
      { date: "20 июня", title: "Шорт-лист утверждается", meta: "с режиссёром и продюсером", state: "future" },
      { date: "1 июля", title: "Старт препрода", meta: "съёмки с 5 августа", state: "future" },
    ],
    scenes: [
      { num: "01", title: "«Звонок из школы» · с режиссёром", meta: "2 страницы · диалог с директором школы · крупный план", duration: "1:45" },
      { num: "02", title: "«Метель» · монолог", meta: "1 страница · 1 на 1, без партнёра · средний план", duration: "1:10" },
      { num: "03", title: "«Поезд» · парная", meta: "3 страницы · партнёр — мужчина 35–45 · общий план", duration: "2:30" },
    ],
    applicants: [
      {
        name: "Мария Коваль",
        meta: "Актриса · 31 · Москва · «Слово пацана 2», «Стая» (Okko)",
        match: "96%",
        tag: "В шорт-лист",
        tagKind: "green",
        avatar: "/assets/figma/avatar-02.png",
      },
      {
        name: "Анна Прокопьева",
        meta: "Актриса · 29 · СПб · «Дайте Иванова 3» (KION)",
        match: "88%",
        tag: "На просмотре",
        tagKind: "blue",
        avatar: "/assets/figma/avatar-01.png",
      },
      {
        name: "Елена Сергеева",
        meta: "Актриса · 33 · Москва · «Король и Шут» (Кинопоиск)",
        match: "74%",
        tag: "Новая",
        tagKind: "gray",
        avatar: "/assets/figma/avatar-04.png",
      },
    ],
    docs: [
      { label: "Договор-образец", value: "PDF" },
      { label: "NDA", value: "PDF" },
      { label: "Release-форма", value: "DOCX" },
      { label: "График смен", value: "PDF" },
    ],
  },
  {
    slug: "tihiy-yanvar-second",
    projectSlug: "tihiy-yanvar",
    title: "Вторая мужская · 30–40",
    roleLabel: "Вторая мужская",
    text: "Муж героини / коллега по школе. Нужен устойчивый типаж 30–40, опыт в драме, готовность к натуре в Мурманске. Самопробы до 6 июня, очные 10–14 июня.",
    meta: "Полный метр · Кинопоиск · Москва, Мурманск",
    deadline: "6 июня",
    responses: 64,
    urgent: true,
    media: "/assets/figma/post-01.png",
    facts: [
      ["Роль", "Вторая мужская"],
      ["Возраст", "30–40"],
      ["Гонорар", "1.1–1.6 ₽ млн за проект"],
      ["Платформа", "Кинопоиск"],
    ],
    cdSlug: "lebedeva",
    cdName: "Анна Лебедева",
    published: "22 мая",
    timeline: [
      { date: "22 мая", title: "Открыт кастинг", meta: "64 отклика", state: "done" },
      { date: "6 июня", title: "Дедлайн самопроб", meta: "параллельно с главной", state: "current" },
      { date: "10–14 июня", title: "Очные пробы · Москва", meta: "студия Sreda", state: "future" },
    ],
    scenes: [
      { num: "01", title: "«Кухня» · парная", meta: "2 страницы · диалог с героиней", duration: "1:50" },
      { num: "02", title: "«Школа» · деловой", meta: "1 страница · короткий конфликт", duration: "1:05" },
    ],
    applicants: [
      {
        name: "Александр Взметнев",
        meta: "Актёр · 32 · Москва · «Мажор», «Любовь СССР»",
        match: "91%",
        tag: "В шорт-лист",
        tagKind: "green",
        avatar: "/assets/actors/vzmetnev-avatar.jpg",
        href: "/people/vzmetnev",
      },
      {
        name: "Александр Устюгов",
        meta: "Актёр · ростер «Актёр 1»",
        match: "84%",
        tag: "Предложение агента",
        tagKind: "blue",
        avatar: "/assets/actors/akter1/ustyugov-aleksandr.jpg",
        href: "/people/ustyugov-aleksandr",
      },
    ],
  },
  {
    slug: "okno-hosts",
    projectSlug: "okno",
    title: "Ведущие · док-сериал «Окно»",
    roleLabel: "Ведущие",
    text: "6 серий по 45 мин, Москва и Казань. Ищем ведущих с опытом в доке и разговорном жанре.",
    meta: "Документальный сериал · KION",
    deadline: "12 июня",
    responses: 23,
    media: "/assets/figma/post-06.png",
    facts: [
      ["Роль", "Ведущие"],
      ["Серии", "6 × 45 мин"],
      ["Платформа", "KION"],
    ],
    cdSlug: "lebedeva",
    cdName: "Анна Лебедева",
  },
  {
    slug: "komnata-14-episode",
    projectSlug: "komnata-14",
    title: "Эпизоды · «Комната 14»",
    roleLabel: "Эпизоды",
    text: "Короткий метр, period 1950-е. Несколько эпизодических ролей, павильон и натура.",
    meta: "Короткий метр · period · Москва",
    deadline: "30 мая",
    responses: 57,
    media: "/assets/figma/post-04.png",
    facts: [
      ["Тип", "Эпизод"],
      ["Смены", "8"],
      ["Формат", "короткий метр"],
    ],
    cdSlug: "lebedeva",
    cdName: "Анна Лебедева",
  },
];

export function getProject(slug: string) {
  return PROJECTS.find((p) => p.slug === slug) ?? null;
}

export function getCasting(slug: string) {
  return CASTINGS.find((c) => c.slug === slug) ?? null;
}

export function castingsForProject(projectSlug: string) {
  return CASTINGS.filter((c) => c.projectSlug === projectSlug);
}

export function projectsForCd(cdSlug: string) {
  const fromCastings = new Set(CASTINGS.filter((c) => c.cdSlug === cdSlug).map((c) => c.projectSlug));
  return PROJECTS.filter((p) => p.cdSlug === cdSlug || fromCastings.has(p.slug));
}

export function castingsForCd(cdSlug: string) {
  return CASTINGS.filter((c) => c.cdSlug === cdSlug);
}
