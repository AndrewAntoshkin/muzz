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
  href?: string;
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

const FILLED_BLOCKS: ProjectBlocks = {
  facts: true,
  team: true,
  status: true,
  budget: true,
  distribution: true,
  partners: true,
  docs: true,
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
  scenesPdf?: string;
  applicants?: CastingApplicant[];
  docs?: ProjectDoc[];
};

export const PROJECTS: Project[] = [
  {
    slug: "tihiy-yanvar",
    title: "«Тихий январь»",
    studio: "Sreda Production",
    studioAvatar: "/assets/logos/sreda.svg",
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
    blocks: FILLED_BLOCKS,
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
    pavilion: "натура",
    cdName: "Анна Лебедева",
    cdSlug: "lebedeva",
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
      {
        name: "Анна Лебедева",
        role: "Кастинг-директор",
        avatar: "/assets/figma/avatar-02.png",
        href: "/people/lebedeva",
      },
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
    text: "Handheld, доступный свет, интервью в жилых интерьерах. Финансирование ИРИ. Ищем ведущих с опытом в доке и разговорном жанре — кастинг открыт до 12 июня. Референсы: «Человек с киноаппаратом», ранний Герцог, «Интервью» Кустурицы в документальном регистре.",
    year: "2026",
    shifts: "24",
    cdSlug: "lebedeva",
    client: "KION",
    budget: "48 ₽ млн",
    nature: "Москва, Казань",
    pavilion: "не нужен",
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
      { label: "Платформа", value: "KION · весна 2027" },
      { label: "Фестивали", value: "Beat Film, Артдокфест" },
      { label: "ТВ-окно", value: "не закреплено" },
    ],
    partners: [
      { name: "KION", meta: "Заказчик · платформа", initials: "KION", bg: "#E50046" },
      { name: "ИРИ", meta: "Финансирование", initials: "ИРИ", bg: "#3D6D99" },
      { name: "Студия Окно", meta: "Продюсерская компания", initials: "СО", bg: "#2c2c2b" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Договор с ИРИ", value: "PDF" },
      { label: "Сценарная заявка", value: "PDF" },
    ],
    team: [
      { name: "Анна Кеворкова", role: "Шоураннер", avatar: "/assets/figma/avatar-01.png" },
      { name: "Павел Новиков", role: "Режиссёр", initials: "ПН", bg: "#4A3D5C" },
      {
        name: "Анна Лебедева",
        role: "Кастинг-директор",
        avatar: "/assets/figma/avatar-02.png",
        href: "/people/lebedeva",
      },
      { name: "Илья Морозов", role: "Оператор-пост.", initials: "ИМ", bg: "#3D5C4A" },
    ],
    updates: [
      {
        author: "Анна Лебедева",
        avatar: "/assets/figma/avatar-02.png",
        time: "4 дня назад",
        text: "Открыли кастинг ведущих. Нужны люди, которые умеют слушать, а не вести ток-шоу. Самопробы — разговор с героем у окна, 3 минуты.",
      },
    ],
    blocks: FILLED_BLOCKS,
  },
  {
    slug: "komnata-14",
    title: "«Комната 14»",
    studio: "Студия Окно",
    studioAvatar: "/assets/figma/avatar-04.png",
    platform: "фестиваль",
    kind: "Короткий метр · period",
    status: "Кастинг",
    city: "Москва",
    cover: "/assets/figma/post-04.png",
    logline: "Короткий метр, 1950-е. Женщина ждёт мужа в гостиничном номере — и понимает, что он уже не приедет.",
    text: "22 минуты. Period-декор, парики, спецгрим. Павильон и натура в Москве. Подача на «Святую Анну» и «Окно в Европу». Несколько эпизодических ролей — кастинг открыт до 30 мая.",
    year: "2026",
    shifts: "8",
    cdSlug: "lebedeva",
    client: "независимое",
    budget: "4.8 ₽ млн",
    nature: "Москва",
    pavilion: "Мосфильм · павильон 5",
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
      { label: "Платформа", value: "после фестивального окна" },
    ],
    partners: [
      { name: "Мосфильм", meta: "Павильон и костюм", initials: "МФ", bg: "#5C4A45" },
      { name: "Студия Окно", meta: "Продюсерская компания", initials: "СО", bg: "#2c2c2b" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Сценарий v4", value: "PDF" },
      { label: "График смен", value: "PDF" },
    ],
    team: [
      { name: "Вера Литвинова", role: "Режиссёр", initials: "ВЛ", bg: "#4A3D5C" },
      {
        name: "Анна Лебедева",
        role: "Кастинг-директор",
        avatar: "/assets/figma/avatar-02.png",
        href: "/people/lebedeva",
      },
      { name: "Ольга Семёнова", role: "Костюм · period", initials: "ОС", bg: "#5C3D48" },
      { name: "Никита Орлов", role: "Художник-постановщик", initials: "НО", bg: "#3D5C4A" },
    ],
    updates: [
      {
        author: "Вера Литвинова",
        initials: "ВЛ",
        bg: "#4A3D5C",
        time: "неделя назад",
        text: "Утвердили парикмахерскую и номер 14. Ищем эпизоды: портье, соседка, милиционер. Period должен быть точным, без стилизации «под СССР».",
      },
    ],
    blocks: FILLED_BLOCKS,
  },
  {
    slug: "avgust",
    title: "«Август»",
    studio: "Yellow, Black and White",
    studioAvatar: "/assets/logos/yellow-black-white.png",
    platform: "START",
    kind: "Сериал · драма",
    status: "Кастинг",
    city: "Москва",
    cover: "/assets/figma/post-02.png",
    logline: "Восемь серий о семье, которая узнаёт правду об отце только после его исчезновения в августе.",
    text: "Камерный сериал: павильонная квартира на Мосфильме и натура в Москве. Кастинг главной мужской открыт параллельно с «Тихим январём». Референсы: «Оставленные», «Наследники», «Метод».",
    year: "2026",
    shifts: "62",
    cdSlug: "lebedeva",
    cdName: "Анна Лебедева",
    client: "START",
    budget: "210 ₽ млн",
    nature: "Москва",
    pavilion: "Мосфильм",
    schedule: [
      { label: "Препрод", value: "июн — авг 2026" },
      { label: "Съёмки", value: "сен — ноя 2026" },
      { label: "Постпрод", value: "дек 2026 — мар 2027" },
      { label: "Релиз", value: "START · весна 2027" },
    ],
    financing: [
      { label: "START", value: "140 ₽ млн" },
      { label: "Yellow, Black and White", value: "50 ₽ млн" },
      { label: "ИРИ", value: "20 ₽ млн" },
    ],
    distribution: [
      { label: "Платформа", value: "START · 8 серий" },
      { label: "ТВ-окно", value: "не закреплено" },
      { label: "Международно", value: "через YBW International" },
    ],
    partners: [
      { name: "START", meta: "Заказчик · платформа", initials: "ST", bg: "#181818" },
      { name: "Yellow, Black and White", meta: "Продюсерская компания", initials: "YBW", bg: "#2c2c2b" },
      { name: "Мосфильм", meta: "Павильон · 18 смен", initials: "МФ", bg: "#5C4A45" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Сценарий 1–4 серии", value: "PDF" },
      { label: "Библия персонажей", value: "PDF" },
    ],
    team: [
      { name: "Сергей Федотов", role: "Шоураннер", initials: "СФ", bg: "#4A3D5C" },
      { name: "Мария Коваль", role: "Продюсер", avatar: "/assets/figma/avatar-04.png" },
      {
        name: "Анна Лебедева",
        role: "Кастинг-директор",
        avatar: "/assets/figma/avatar-02.png",
        href: "/people/lebedeva",
      },
      { name: "Артём Сухов", role: "Оператор-пост.", initials: "АС", bg: "#3D5C4A" },
    ],
    updates: [
      {
        author: "Анна Лебедева",
        avatar: "/assets/figma/avatar-02.png",
        time: "вчера",
        text: "Главная мужская 32–40: нужна внутренняя тишина, не пафос. Самопробы до 18 июня. Параллельно смотрим фактуру с «Тихого января».",
      },
    ],
    blocks: FILLED_BLOCKS,
  },
  {
    slug: "severnyy-veter",
    title: "«Северный ветер»",
    studio: "Bazelevs",
    studioAvatar: "/assets/logos/bazelevs.png",
    platform: "Кинопоиск",
    kind: "Полный метр · триллер",
    status: "В производстве",
    city: "СПб",
    cover: "/assets/figma/post-03.png",
    logline: "Лоцман в порту Петербурга понимает, что груз, который он проводит, — не нефть.",
    text: "Ночные съёмки в порту, дождь, крупные планы. Основной блок в работе, кастинг жены героя ещё открыт. Референсы: «Сицилиец», «Ночной портье», северный нуар.",
    year: "2026",
    shifts: "41",
    cdSlug: "sokolova",
    cdName: "Мария Соколова",
    client: "Кинопоиск Студия",
    budget: "190 ₽ млн",
    nature: "СПб · порт",
    pavilion: "Ленфильм",
    shiftsDone: "19 / 41",
    scenesDone: "88 / 194",
    spent: "44%",
    schedule: [
      { label: "Препрод", value: "янв — мар 2026" },
      { label: "Съёмки", value: "апр — июл 2026" },
      { label: "Постпрод", value: "авг — ноя 2026" },
      { label: "Релиз", value: "Кинопоиск / прокат 2027" },
    ],
    financing: [
      { label: "Кинопоиск Студия", value: "95 ₽ млн" },
      { label: "Фонд кино", value: "60 ₽ млн" },
      { label: "Bazelevs", value: "35 ₽ млн" },
    ],
    distribution: [
      { label: "Кинотеатры", value: "зима 2027" },
      { label: "Платформа", value: "Кинопоиск · +45 дней" },
      { label: "Международно", value: "через Bazelevs" },
    ],
    partners: [
      { name: "Кинопоиск Студия", meta: "Заказчик · платформа", initials: "КП", bg: "#FF5500" },
      { name: "Bazelevs", meta: "Продюсерская компания", initials: "BZ", bg: "#181818" },
      { name: "Порт СПб", meta: "Натура · ночные смены", initials: "ПС", bg: "#3D6D99" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Сценарий v5", value: "PDF" },
      { label: "График смен", value: "PDF" },
      { label: "Разрешение порта", value: "PDF" },
    ],
    team: [
      { name: "Игорь Бекмамбетов", role: "Продюсер", initials: "ИБ", bg: "#2c2c2b" },
      { name: "Кирилл Соколов", role: "Режиссёр", initials: "КС", bg: "#4A3D5C" },
      { name: "Мария Соколова", role: "Кастинг-директор", initials: "МС", bg: "#5C4A45" },
      { name: "Дмитрий Карпов", role: "Оператор-пост.", avatar: "/assets/figma/avatar-04.png" },
    ],
    openings: [
      {
        title: "Гафер · ночной порт",
        meta: "22 смены · дождь и дым · готовность к ночи",
        initials: "Г",
        bg: "#3D5C4A",
        responses: 6,
        tag: "urgent",
      },
      {
        title: "Каскадёр-координатор",
        meta: "Сцена на причале · 3 смены",
        initials: "Кк",
        bg: "#5C4A45",
        responses: 4,
        tag: "open",
      },
    ],
    updates: [
      {
        author: "Кирилл Соколов",
        initials: "КС",
        bg: "#4A3D5C",
        time: "2 дня назад",
        text: "Закрыли блок на причале. Туман сработал лучше, чем дыммашина. Жену лоцмана всё ещё ищем — 35–45, Петербург, без глянца.",
      },
    ],
    blocks: FILLED_BLOCKS,
  },
  {
    slug: "tretya-smena",
    title: "«Третья смена»",
    studio: "Mars Media",
    studioAvatar: "/assets/logos/mars-media.svg",
    platform: "Premier",
    kind: "Сериал · криминал",
    status: "Препродакшн",
    city: "Москва",
    cover: "/assets/figma/post-05.png",
    logline: "Три смены одного ОВД: дневная, ночная и та, о которой не пишут в рапортах.",
    text: "16 серий. Полицейская драма без героики: бумага, коридоры, усталость. Нужен наставник 45–55 — вторая мужская, кастинг открыт до 30 июня. Референсы: «Метод», «True Detective» s1, советский производственный детектив.",
    year: "2027",
    shifts: "96",
    cdSlug: "orlov",
    cdName: "Дмитрий Орлов",
    client: "Premier",
    budget: "320 ₽ млн",
    nature: "Москва",
    pavilion: "Мосфильм · павильоны 3 и 7",
    schedule: [
      { label: "Препрод", value: "июн — сен 2026" },
      { label: "Съёмки", value: "окт 2026 — фев 2027" },
      { label: "Постпрод", value: "мар — июл 2027" },
      { label: "Релиз", value: "Premier · осень 2027" },
    ],
    financing: [
      { label: "Premier", value: "180 ₽ млн" },
      { label: "Mars Media", value: "90 ₽ млн" },
      { label: "ИРИ", value: "50 ₽ млн" },
    ],
    distribution: [
      { label: "Платформа", value: "Premier · 16 серий" },
      { label: "ТВ-окно", value: "НТВ · 2028" },
    ],
    partners: [
      { name: "Premier", meta: "Заказчик · платформа", initials: "PR", bg: "#7B61FF" },
      { name: "Mars Media", meta: "Продюсерская компания", initials: "MM", bg: "#181818" },
      { name: "Мосфильм", meta: "Павильоны ОВД", initials: "МФ", bg: "#5C4A45" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Пилот + серия 2", value: "PDF" },
      { label: "Библия сериала", value: "PDF" },
    ],
    team: [
      { name: "Юлия Иванова", role: "Шоураннер", initials: "ЮИ", bg: "#4A3D5C" },
      { name: "Роман Борисов", role: "Продюсер", initials: "РБ", bg: "#3D6D99" },
      { name: "Дмитрий Орлов", role: "Кастинг-директор", initials: "ДО", bg: "#5C4A45" },
      { name: "Алексей Громов", role: "Консультант · МВД", initials: "АГ", bg: "#3D5C4A" },
    ],
    updates: [
      {
        author: "Дмитрий Орлов",
        initials: "ДО",
        bg: "#5C4A45",
        time: "5 дней назад",
        text: "Открыли кастинг наставника. Не «крепкий орешек» — человек, который устал врать в рапортах. 45–55, Москва.",
      },
    ],
    blocks: FILLED_BLOCKS,
  },
  {
    slug: "belaya-reka",
    title: "«Белая река»",
    studio: "СТВ",
    studioAvatar: "/assets/logos/ctb.png",
    platform: "IVI",
    kind: "Полный метр · драма",
    status: "Кастинг",
    city: "Казань",
    cover: "/assets/figma/post-07.png",
    logline: "Дочь возвращается в Казань на похороны матери и находит письма, которые меняют семью.",
    text: "Натура в Казани: набережная, старый центр, татарский двор. Язык — русский и татарский, дубляж не планируется. Главная женская 18–24, самопробы до 10 июня. Референсы: «Нелюбовь», «Про любовь», казанский свет августа.",
    year: "2026",
    shifts: "28",
    cdSlug: "shatskaya",
    cdName: "Елена Шацкая",
    client: "IVI Studio",
    budget: "95 ₽ млн",
    nature: "Казань",
    pavilion: "Казань · Корстон",
    schedule: [
      { label: "Препрод", value: "май — июл 2026" },
      { label: "Съёмки", value: "авг — сен 2026" },
      { label: "Постпрод", value: "окт — дек 2026" },
      { label: "Релиз", value: "IVI / прокат Поволжья 2027" },
    ],
    financing: [
      { label: "Фонд кино", value: "45 ₽ млн" },
      { label: "IVI Studio", value: "35 ₽ млн" },
      { label: "СТВ", value: "15 ₽ млн" },
    ],
    distribution: [
      { label: "Кинотеатры", value: "Поволжье · весна 2027" },
      { label: "Платформа", value: "IVI · +45 дней" },
      { label: "Фестивали", value: "«Кинотавр», Казань" },
    ],
    partners: [
      { name: "IVI Studio", meta: "Заказчик · платформа", initials: "IVI", bg: "#E85D04" },
      { name: "СТВ", meta: "Продюсерская компания", initials: "СТВ", bg: "#2c2c2b" },
      { name: "Минкульт РТ", meta: "Локейшн-поддержка", initials: "РТ", bg: "#3D6D99" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Сценарий v3", value: "PDF" },
      { label: "График натуры", value: "PDF" },
    ],
    team: [
      { name: "Ренат Давлетшин", role: "Режиссёр", initials: "РД", bg: "#4A3D5C" },
      { name: "Алина Сафина", role: "Продюсер", initials: "АС", bg: "#3D6D99" },
      { name: "Елена Шацкая", role: "Кастинг-директор", initials: "ЕШ", bg: "#5C4A45" },
      { name: "Ильдар Хайруллин", role: "Оператор-пост.", initials: "ИХ", bg: "#3D5C4A" },
    ],
    updates: [
      {
        author: "Елена Шацкая",
        initials: "ЕШ",
        bg: "#5C4A45",
        time: "3 дня назад",
        text: "Главная женская 18–24. Татарский приветствуется, не обязателен. Ищем не «инстаграмную дочь», а человека, который умеет молчать в кадре.",
      },
    ],
    blocks: FILLED_BLOCKS,
  },
  {
    slug: "nochnoy-reys",
    title: "«Ночной рейс»",
    studio: "1-2-3 Production",
    studioAvatar: "/assets/logos/1-2-3-production.svg",
    platform: "Wink",
    kind: "Сериал · детектив",
    status: "В производстве",
    city: "Сочи",
    cover: "/assets/figma/post-08.png",
    logline: "Водитель ночного автобуса Сочи—Красная Поляна каждый рейс везёт кого-то, кого нельзя везти.",
    text: "8 серий. Ночные смены, серпантин, дождь. Главная мужская в работе, добираем второго пилота. Права категории D не нужны — дублёр на площадке.",
    year: "2026",
    shifts: "48",
    cdSlug: "sokolova",
    cdName: "Мария Соколова",
    client: "Wink",
    budget: "140 ₽ млн",
    nature: "Сочи · Красная Поляна",
    pavilion: "Сочи · павильон автобуса",
    shiftsDone: "21 / 48",
    scenesDone: "74 / 162",
    spent: "41%",
    schedule: [
      { label: "Препрод", value: "мар — апр 2026" },
      { label: "Съёмки", value: "май — авг 2026" },
      { label: "Постпрод", value: "сен — ноя 2026" },
      { label: "Релиз", value: "Wink · зима 2027" },
    ],
    financing: [
      { label: "Wink", value: "90 ₽ млн" },
      { label: "1-2-3 Production", value: "35 ₽ млн" },
      { label: "Краснодарский край", value: "15 ₽ млн" },
    ],
    distribution: [
      { label: "Платформа", value: "Wink · 8 серий" },
      { label: "ТВ-окно", value: "не закреплено" },
    ],
    partners: [
      { name: "Wink", meta: "Заказчик · платформа", initials: "W", bg: "#0080CB" },
      { name: "1-2-3 Production", meta: "Продюсерская компания", initials: "123", bg: "#181818" },
      { name: "Кубаньавто", meta: "Автобусы и дублёры", initials: "КА", bg: "#3D5C4A" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Сценарий 1–8", value: "PDF" },
      { label: "Разрешение трассы", value: "PDF" },
    ],
    team: [
      { name: "Олег Миронов", role: "Шоураннер", initials: "ОМ", bg: "#4A3D5C" },
      { name: "Татьяна Белова", role: "Продюсер", initials: "ТБ", bg: "#3D6D99" },
      { name: "Мария Соколова", role: "Кастинг-директор", initials: "МС", bg: "#5C4A45" },
      { name: "Сергей Волков", role: "Оператор-пост.", initials: "СВ", bg: "#3D5C4A" },
    ],
    openings: [
      {
        title: "Второй пилот / дублёр водителя",
        meta: "Права D · ночные смены · 8 серий",
        initials: "ВП",
        bg: "#2C2C2B",
        responses: 9,
        tag: "open",
      },
    ],
    updates: [
      {
        author: "Татьяна Белова",
        initials: "ТБ",
        bg: "#3D6D99",
        time: "вчера",
        text: "Закрыли 21 смену. Серпантин в дождь — отдельный герой. Кастинг водителя ещё смотрим: 28–36, Сочи или готовность жить на площадке.",
      },
    ],
    blocks: FILLED_BLOCKS,
  },
  {
    slug: "stanciya",
    title: "«Станция»",
    studio: "Art Pictures",
    studioAvatar: "/assets/logos/art-pictures.svg",
    platform: "Okko",
    kind: "Полный метр · триллер",
    status: "Постпродакшн",
    city: "Москва",
    cover: "/assets/figma/post-09.png",
    logline: "Дежурный на закрытой станции метро слышит голоса из тоннеля, которого нет на схеме.",
    text: "Снято. Ищем инспектора МЧС на переозвучку и досъёмку двух сцен. Постпрод в CineLab, Atmos на Мосфильме. Релиз — Okko, зима 2027.",
    year: "2026",
    shifts: "36",
    cdSlug: "orlov",
    cdName: "Дмитрий Орлов",
    client: "Okko Studios",
    budget: "175 ₽ млн",
    nature: "Москва · метро",
    pavilion: "Мосфильм",
    shiftsDone: "36 / 36",
    scenesDone: "178 / 182",
    spent: "82%",
    schedule: [
      { label: "Препрод", value: "сен — ноя 2025" },
      { label: "Съёмки", value: "дек 2025 — мар 2026" },
      { label: "Постпрод", value: "апр — сен 2026" },
      { label: "Релиз", value: "Okko · зима 2027" },
    ],
    financing: [
      { label: "Okko Studios", value: "95 ₽ млн" },
      { label: "Фонд кино", value: "50 ₽ млн" },
      { label: "Art Pictures", value: "30 ₽ млн" },
    ],
    distribution: [
      { label: "Платформа", value: "Okko · зима 2027" },
      { label: "Кинотеатры", value: "ограниченный прокат · декабрь" },
      { label: "Фестивали", value: "ММКФ, «Маяк»" },
    ],
    partners: [
      { name: "Okko Studios", meta: "Заказчик · платформа", initials: "OKKO", bg: "#181818" },
      { name: "Art Pictures", meta: "Продюсерская компания", initials: "AP", bg: "#2c2c2b" },
      { name: "CineLab", meta: "Постпрод · колор", initials: "CL", bg: "#3D6D99" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Черновой монтаж", value: "ссылка" },
      { label: "Досъёмка · 2 сцены", value: "PDF" },
    ],
    team: [
      { name: "Андрей Новиков", role: "Режиссёр", initials: "АН", bg: "#4A3D5C" },
      { name: "Елена Фролова", role: "Продюсер", initials: "ЕФ", bg: "#3D6D99" },
      { name: "Дмитрий Орлов", role: "Кастинг-директор", initials: "ДО", bg: "#5C4A45" },
      { name: "Артём Сухов", role: "Монтаж", initials: "АС", bg: "#5C5340" },
    ],
    openings: [
      {
        title: "Инспектор МЧС · досъёмка",
        meta: "2 сцены + переозвучка · 40–50 лет",
        initials: "МЧС",
        bg: "#3D5C4A",
        responses: 19,
        tag: "urgent",
      },
    ],
    updates: [
      {
        author: "Артём Сухов",
        initials: "АС",
        bg: "#5C5340",
        time: "неделя назад",
        text: "Черновой готов. Две сцены с инспектором не держат — переснимаем и переозвучиваем. Кастинг открыт до 8 июня.",
      },
    ],
    blocks: FILLED_BLOCKS,
  },
  {
    slug: "les",
    title: "«Лес»",
    studio: "НМГ Студия",
    studioAvatar: "/assets/logos/nmg-studio.png",
    platform: "Premier",
    kind: "Полный метр · драма",
    status: "Кастинг",
    city: "Мурманск",
    cover: "/assets/figma/post-10.png",
    logline: "Егерь находит в заповеднике ребёнка без языка и решает не сдавать его сразу.",
    text: "Натура за Полярным кругом. Главная мужская 30–40: мало текста, много взгляда, готовность к холоду. Съёмки осенью, чтобы поймать короткий день. Референсы: «Левиафан», «The Hunt», северный вестерн без оружия.",
    year: "2026",
    shifts: "32",
    cdSlug: "lebedeva",
    cdName: "Анна Лебедева",
    client: "Premier",
    budget: "128 ₽ млн",
    nature: "Мурманск · заповедник",
    pavilion: "Мурманск · интерьеры избы",
    schedule: [
      { label: "Препрод", value: "июн — авг 2026" },
      { label: "Съёмки", value: "сен — окт 2026" },
      { label: "Постпрод", value: "ноя 2026 — фев 2027" },
      { label: "Релиз", value: "Premier · 2027" },
    ],
    financing: [
      { label: "Premier", value: "70 ₽ млн" },
      { label: "Фонд кино", value: "40 ₽ млн" },
      { label: "НМГ Студия", value: "18 ₽ млн" },
    ],
    distribution: [
      { label: "Платформа", value: "Premier · 2027" },
      { label: "Кинотеатры", value: "ограниченный прокат" },
      { label: "Фестивали", value: "«Кинотавр», Берлин (Forum)" },
    ],
    partners: [
      { name: "Premier", meta: "Заказчик · платформа", initials: "PR", bg: "#7B61FF" },
      { name: "НМГ Студия", meta: "Продюсерская компания", initials: "НМГ", bg: "#181818" },
      { name: "Заповедник", meta: "Натура · разрешения", initials: "ЗП", bg: "#3D5C4A" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Сценарий v2", value: "PDF" },
      { label: "Разрешение натуры", value: "PDF" },
    ],
    team: [
      { name: "Анна Белова", role: "Режиссёр", initials: "АБ", bg: "#4A3D5C" },
      { name: "Мария Коваль", role: "Продюсер", avatar: "/assets/figma/avatar-04.png" },
      {
        name: "Анна Лебедева",
        role: "Кастинг-директор",
        avatar: "/assets/figma/avatar-02.png",
        href: "/people/lebedeva",
      },
      { name: "Дмитрий Карпов", role: "Оператор-пост.", avatar: "/assets/figma/avatar-04.png" },
    ],
    updates: [
      {
        author: "Анна Лебедева",
        avatar: "/assets/figma/avatar-02.png",
        time: "6 дней назад",
        text: "Егерь 30–40. Не «герой тайги» — человек, который давно разучился разговаривать. Самопробы до 14 июня, готовность к Мурманску обязательна.",
      },
    ],
    blocks: FILLED_BLOCKS,
  },
  {
    slug: "kvartal",
    title: "«Квартал»",
    studio: "Plus Studio",
    studioAvatar: "/assets/logos/plus-studio.svg",
    platform: "START",
    kind: "Сериал · комедия",
    status: "Препродакшн",
    city: "СПб",
    cover: "/assets/figma/ad-01.png",
    logline: "Соседи одного двора в Петербурге пытаются не продать его девелоперу — и постоянно срываются.",
    text: "10 серий. Ансамблевая комедия, много эпизодов: сосед, консьерж, участковый. Натура — один двор на Васильевском. Референсы: «Кухня» без глянца, «The League», питерский двор как персонаж.",
    year: "2027",
    shifts: "55",
    cdSlug: "shatskaya",
    cdName: "Елена Шацкая",
    client: "START",
    budget: "180 ₽ млн",
    nature: "СПб · Васильевский",
    pavilion: "Ленфильм",
    schedule: [
      { label: "Препрод", value: "сен — дек 2026" },
      { label: "Съёмки", value: "янв — апр 2027" },
      { label: "Постпрод", value: "май — авг 2027" },
      { label: "Релиз", value: "START · осень 2027" },
    ],
    financing: [
      { label: "START", value: "120 ₽ млн" },
      { label: "Plus Studio", value: "40 ₽ млн" },
      { label: "Комитет по культуре СПб", value: "20 ₽ млн" },
    ],
    distribution: [
      { label: "Платформа", value: "START · 10 серий" },
      { label: "ТВ-окно", value: "не закреплено" },
    ],
    partners: [
      { name: "START", meta: "Заказчик · платформа", initials: "ST", bg: "#181818" },
      { name: "Plus Studio", meta: "Продюсерская компания", initials: "PS", bg: "#2c2c2b" },
      { name: "Ленфильм", meta: "Павильон двора", initials: "ЛФ", bg: "#3D6D99" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Пилот", value: "PDF" },
      { label: "Карта двора", value: "PDF" },
    ],
    team: [
      { name: "Илья Семёнов", role: "Шоураннер", initials: "ИС", bg: "#4A3D5C" },
      { name: "Дарья Волкова", role: "Продюсер", initials: "ДВ", bg: "#3D6D99" },
      { name: "Елена Шацкая", role: "Кастинг-директор", initials: "ЕШ", bg: "#5C4A45" },
      { name: "Пётр Алексеев", role: "Оператор-пост.", initials: "ПА", bg: "#3D5C4A" },
    ],
    updates: [
      {
        author: "Елена Шацкая",
        initials: "ЕШ",
        bg: "#5C4A45",
        time: "8 дней назад",
        text: "Эпизод «сосед» — возраст свободный, характерный, комедия. 2–4 смены. Не ищем стендап, ищем человека из этого двора.",
      },
    ],
    blocks: FILLED_BLOCKS,
  },
  {
    slug: "most",
    title: "«Мост»",
    studio: "Централ Партнершип",
    studioAvatar: "/assets/logos/central-partnership.png",
    platform: "кинотеатры",
    kind: "Полный метр · драма",
    status: "Релиз",
    city: "Москва",
    cover: "/assets/figma/ad-02.png",
    logline: "Инженер моста через Москву-реку узнаёт, что объект сдан с трещиной — и что об этом знали все.",
    text: "В прокате с сентября. Кастинг закрыт. Фестивальное окно: «Кинотавр», ограниченный международный. Карточка остаётся в архиве, чтобы актёры видели, с кем работали.",
    year: "2026",
    shifts: "38",
    cdSlug: "sokolova",
    cdName: "Мария Соколова",
    client: "Централ Партнершип",
    budget: "240 ₽ млн",
    nature: "Москва",
    pavilion: "Мосфильм",
    shiftsDone: "38 / 38",
    scenesDone: "210 / 210",
    spent: "100%",
    schedule: [
      { label: "Препрод", value: "янв — мар 2025" },
      { label: "Съёмки", value: "апр — июн 2025" },
      { label: "Постпрод", value: "июл — дек 2025" },
      { label: "Релиз", value: "кинотеатры · сен 2026" },
    ],
    financing: [
      { label: "Фонд кино", value: "110 ₽ млн" },
      { label: "Централ Партнершип", value: "90 ₽ млн" },
      { label: "Москва", value: "40 ₽ млн" },
    ],
    distribution: [
      { label: "Кинотеатры", value: "с 11 сентября 2026" },
      { label: "Платформа", value: "не закреплено · +90 дней" },
      { label: "Фестивали", value: "«Кинотавр» · конкурс" },
    ],
    partners: [
      { name: "Централ Партнершип", meta: "Прокат и продюсирование", initials: "ЦП", bg: "#181818" },
      { name: "Москино", meta: "Прокат · Москва", initials: "МК", bg: "#5C4A45" },
      { name: "Фонд кино", meta: "Финансирование", initials: "ФК", bg: "#3D6D99" },
    ],
    docs: [
      { label: "Прокатное удостоверение", value: "получено" },
      { label: "DCP", value: "сдан" },
      { label: "Постер", value: "PDF" },
    ],
    team: [
      { name: "Владимир Сергеев", role: "Режиссёр", initials: "ВС", bg: "#4A3D5C" },
      { name: "Наталья Орлова", role: "Продюсер", initials: "НО", bg: "#3D6D99" },
      { name: "Мария Соколова", role: "Кастинг-директор", initials: "МС", bg: "#5C4A45" },
      {
        name: "Александр Взметнев",
        role: "Актёр · главная м.",
        avatar: "/assets/actors/vzmetnev-avatar.jpg",
        href: "/people/vzmetnev",
      },
    ],
    updates: [
      {
        author: "Наталья Орлова",
        initials: "НО",
        bg: "#3D6D99",
        time: "12 дней назад",
        text: "Стартовали в 412 залах. Кастинг закрыт, карточка остаётся — если писать в команду, только через прокат.",
      },
    ],
    blocks: FILLED_BLOCKS,
  },
  {
    slug: "zerkalo-vody",
    title: "«Зеркало воды»",
    studio: "Водород",
    studioAvatar: "/assets/logos/vodorod.png",
    platform: "Кинопоиск",
    kind: "Полный метр · мелодрама",
    status: "Кастинг",
    city: "Сочи",
    cover: "/assets/figma/ad-03.png",
    logline: "Инструктор по дайвингу встречает женщину, которая ищет на дне то, чего там быть не должно.",
    text: "Съёмки на воде: открытое море и бассейн Мосфильма для диалогов. Вторая женская 25–32, навык плавания обязателен, сертификат PADI — плюс. Самопробы до 20 июня.",
    year: "2026",
    shifts: "30",
    cdSlug: "lebedeva",
    cdName: "Анна Лебедева",
    client: "Кинопоиск Студия",
    budget: "112 ₽ млн",
    nature: "Сочи",
    pavilion: "Мосфильм · бассейн",
    schedule: [
      { label: "Препрод", value: "июн — авг 2026" },
      { label: "Съёмки", value: "сен — окт 2026" },
      { label: "Постпрод", value: "ноя 2026 — янв 2027" },
      { label: "Релиз", value: "Кинопоиск · весна 2027" },
    ],
    financing: [
      { label: "Кинопоиск Студия", value: "70 ₽ млн" },
      { label: "Водород", value: "27 ₽ млн" },
      { label: "Краснодарский край", value: "15 ₽ млн" },
    ],
    distribution: [
      { label: "Платформа", value: "Кинопоиск · весна 2027" },
      { label: "Кинотеатры", value: "ограниченный прокат юга" },
    ],
    partners: [
      { name: "Кинопоиск Студия", meta: "Заказчик · платформа", initials: "КП", bg: "#FF5500" },
      { name: "Водород", meta: "Продюсерская компания", initials: "H2", bg: "#0080CB" },
      { name: "Dive Sochi", meta: "Лодки и страховка", initials: "DS", bg: "#3D6D99" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Сценарий v2", value: "PDF" },
      { label: "Страховка на воде", value: "PDF" },
    ],
    team: [
      { name: "Екатерина Морозова", role: "Режиссёр", initials: "ЕМ", bg: "#4A3D5C" },
      { name: "Игорь Смирнов", role: "Продюсер", initials: "ИС", bg: "#3D6D99" },
      {
        name: "Анна Лебедева",
        role: "Кастинг-директор",
        avatar: "/assets/figma/avatar-02.png",
        href: "/people/lebedeva",
      },
      { name: "Олег Панин", role: "Оператор-пост. · подводная", initials: "ОП", bg: "#3D5C4A" },
    ],
    updates: [
      {
        author: "Анна Лебедева",
        avatar: "/assets/figma/avatar-02.png",
        time: "4 дня назад",
        text: "Вторая женская 25–32. Плавать нужно по-настоящему — дублёр только на глубину. Самопроба: сцена на пирсе, без грима, мокрые волосы.",
      },
    ],
    blocks: FILLED_BLOCKS,
  },
  {
    slug: "dvoe",
    title: "«Двое»",
    studio: "KIT Film Studio",
    studioAvatar: "/assets/logos/kit-film-studio.png",
    platform: "KION",
    kind: "Короткий метр · драма",
    status: "Кастинг",
    city: "Казань",
    cover: "/assets/figma/ad-04.png",
    logline: "Близнецы в один день принимают противоположные решения — и жизнь расходится на две.",
    text: "18 минут, 6 смен. Ищем пару актёров, похожих по фактуре, не обязательно родственников. Казань, павильон и один двор. Подача на «Кинотавр. Короткий метр» и KION Shorts.",
    year: "2026",
    shifts: "6",
    cdSlug: "shatskaya",
    cdName: "Елена Шацкая",
    client: "KION",
    budget: "6.4 ₽ млн",
    nature: "Казань",
    pavilion: "Казань",
    schedule: [
      { label: "Препрод", value: "май — июн 2026" },
      { label: "Съёмки", value: "июл 2026" },
      { label: "Постпрод", value: "авг — сен 2026" },
      { label: "Релиз", value: "KION Shorts · осень 2026" },
    ],
    financing: [
      { label: "KION", value: "4.0 ₽ млн" },
      { label: "KIT Film Studio", value: "1.6 ₽ млн" },
      { label: "Минкульт РТ", value: "0.8 ₽ млн" },
    ],
    distribution: [
      { label: "Платформа", value: "KION Shorts" },
      { label: "Фестивали", value: "«Кинотавр. Короткий метр», «Святая Анна»" },
    ],
    partners: [
      { name: "KION", meta: "Заказчик · платформа", initials: "KION", bg: "#E50046" },
      { name: "KIT Film Studio", meta: "Продюсерская компания", initials: "KIT", bg: "#181818" },
    ],
    docs: [
      { label: "NDA", value: "подписан" },
      { label: "Сценарий", value: "PDF" },
      { label: "График смен", value: "PDF" },
    ],
    team: [
      { name: "Алина Сафина", role: "Режиссёр", initials: "АС", bg: "#4A3D5C" },
      { name: "Марат Галеев", role: "Продюсер", initials: "МГ", bg: "#3D6D99" },
      { name: "Елена Шацкая", role: "Кастинг-директор", initials: "ЕШ", bg: "#5C4A45" },
      { name: "Ильдар Хайруллин", role: "Оператор-пост.", initials: "ИХ", bg: "#3D5C4A" },
    ],
    updates: [
      {
        author: "Елена Шацкая",
        initials: "ЕШ",
        bg: "#5C4A45",
        time: "2 дня назад",
        text: "Парная роль. Не обязательно близнецы — нужна рифма по фактуре и возрасту. Самопробы парами или по отдельности, сведём сами.",
      },
    ],
    blocks: FILLED_BLOCKS,
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
      {
        num: "01",
        title: "«Звонок из школы» · с режиссёром",
        meta: "2 страницы · диалог с директором школы · крупный план",
        duration: "1:45",
        href: "/assets/castings/tihiy-yanvar/scene-lead-01-zvonok.pdf",
      },
      {
        num: "02",
        title: "«Метель» · монолог",
        meta: "1 страница · 1 на 1, без партнёра · средний план",
        duration: "1:10",
        href: "/assets/castings/tihiy-yanvar/scene-lead-02-metel.pdf",
      },
      {
        num: "03",
        title: "«Поезд» · парная",
        meta: "3 страницы · партнёр — мужчина 35–45 · общий план",
        duration: "2:30",
        href: "/assets/castings/tihiy-yanvar/scene-lead-03-poezd.pdf",
      },
    ],
    scenesPdf: "/assets/castings/tihiy-yanvar/scenes-lead-all.pdf",
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
      {
        num: "01",
        title: "«Кухня» · парная",
        meta: "2 страницы · диалог с героиней",
        duration: "1:50",
        href: "/assets/castings/tihiy-yanvar/scene-01-kuhnya.pdf",
      },
      {
        num: "02",
        title: "«Школа» · деловой",
        meta: "1 страница · короткий конфликт",
        duration: "1:05",
        href: "/assets/castings/tihiy-yanvar/scene-02-shkola.pdf",
      },
    ],
    scenesPdf: "/assets/castings/tihiy-yanvar/scenes-all.pdf",
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
  {
    slug: "avgust-lead",
    projectSlug: "avgust",
    title: "Главная мужская · «Август»",
    roleLabel: "Главная мужская",
    text: "Отец семейства, 32–40. Нужна внутренняя тишина и умение держать паузу. 8 серий, Москва, START.",
    meta: "Сериал · START · Москва",
    deadline: "18 июня",
    responses: 91,
    urgent: true,
    media: "/assets/figma/post-02.png",
    facts: [
      ["Роль", "Главная мужская"],
      ["Возраст", "32–40"],
      ["Гонорар", "1.8–2.4 ₽ млн за сезон"],
      ["Платформа", "START"],
    ],
    cdSlug: "lebedeva",
    cdName: "Анна Лебедева",
  },
  {
    slug: "severnyy-veter-wife",
    projectSlug: "severnyy-veter",
    title: "Главная женская · жена лоцмана",
    roleLabel: "Главная женская",
    text: "35–45, Петербург. Жена героя, которая первой понимает, что груз — не нефть. Натура, дождь, ночь.",
    meta: "Полный метр · Кинопоиск · СПб",
    deadline: "22 июня",
    responses: 47,
    media: "/assets/figma/post-03.png",
    facts: [
      ["Роль", "Главная женская"],
      ["Возраст", "35–45"],
      ["Гонорар", "1.4–1.9 ₽ млн за проект"],
      ["Платформа", "Кинопоиск"],
    ],
    cdSlug: "sokolova",
    cdName: "Мария Соколова",
  },
  {
    slug: "tretya-smena-mentor",
    projectSlug: "tretya-smena",
    title: "Вторая мужская · наставник",
    roleLabel: "Вторая мужская",
    text: "Опер 45–55, который учит новичков и сам связан с третьей сменой. 16 серий, Premier.",
    meta: "Сериал · Premier · Москва",
    deadline: "30 июня",
    responses: 38,
    media: "/assets/figma/post-05.png",
    facts: [
      ["Роль", "Вторая мужская"],
      ["Возраст", "45–55"],
      ["Гонорар", "900 тыс. – 1.3 ₽ млн за сезон"],
      ["Платформа", "Premier"],
    ],
    cdSlug: "orlov",
    cdName: "Дмитрий Орлов",
  },
  {
    slug: "belaya-reka-daughter",
    projectSlug: "belaya-reka",
    title: "Главная женская · дочь",
    roleLabel: "Главная женская",
    text: "18–24, Казань. Возвращается на похороны матери. Татарский приветствуется, не обязателен.",
    meta: "Полный метр · IVI · Казань",
    deadline: "10 июня",
    responses: 112,
    urgent: true,
    media: "/assets/figma/post-07.png",
    facts: [
      ["Роль", "Главная женская"],
      ["Возраст", "18–24"],
      ["Гонорар", "800 тыс. – 1.2 ₽ млн за проект"],
      ["Платформа", "IVI"],
    ],
    cdSlug: "shatskaya",
    cdName: "Елена Шацкая",
  },
  {
    slug: "nochnoy-reys-driver",
    projectSlug: "nochnoy-reys",
    title: "Главная мужская · водитель",
    roleLabel: "Главная мужская",
    text: "28–36, Сочи. Водитель ночного рейса. Права категории D не нужны — дублёр на площадке.",
    meta: "Сериал · Wink · Сочи",
    deadline: "25 июня",
    responses: 54,
    media: "/assets/figma/post-08.png",
    facts: [
      ["Роль", "Главная мужская"],
      ["Возраст", "28–36"],
      ["Гонорар", "1.1–1.5 ₽ млн за сезон"],
      ["Платформа", "Wink"],
    ],
    cdSlug: "sokolova",
    cdName: "Мария Соколова",
  },
  {
    slug: "stanciya-inspector",
    projectSlug: "stanciya",
    title: "Вторая мужская · инспектор МЧС",
    roleLabel: "Вторая мужская",
    text: "40–50. Досъёмка двух сцен и переозвучка. Уже снятый триллер Art Pictures для Okko.",
    meta: "Полный метр · Okko · Москва",
    deadline: "8 июня",
    responses: 19,
    urgent: true,
    media: "/assets/figma/post-09.png",
    facts: [
      ["Роль", "Вторая мужская"],
      ["Возраст", "40–50"],
      ["Гонорар", "350–480 тыс. за досъёмку"],
      ["Платформа", "Okko"],
    ],
    cdSlug: "orlov",
    cdName: "Дмитрий Орлов",
  },
  {
    slug: "les-hunter",
    projectSlug: "les",
    title: "Главная мужская · егерь",
    roleLabel: "Главная мужская",
    text: "30–40, Мурманск. Готовность к натуре за Полярным кругом, мало текста, много взгляда.",
    meta: "Полный метр · Premier · Мурманск",
    deadline: "14 июня",
    responses: 73,
    media: "/assets/figma/post-10.png",
    facts: [
      ["Роль", "Главная мужская"],
      ["Возраст", "30–40"],
      ["Гонорар", "1.6–2.1 ₽ млн за проект"],
      ["Платформа", "Premier"],
    ],
    cdSlug: "lebedeva",
    cdName: "Анна Лебедева",
  },
  {
    slug: "kvartal-neighbor",
    projectSlug: "kvartal",
    title: "Эпизод · сосед",
    roleLabel: "Эпизод",
    text: "Сосед из «Квартала», Петербург. 2–4 смены, характерный, комедия. Возраст свободный.",
    meta: "Сериал · START · СПб",
    deadline: "28 июня",
    responses: 86,
    media: "/assets/figma/ad-01.png",
    facts: [
      ["Тип", "Эпизод"],
      ["Смены", "2–4"],
      ["Платформа", "START"],
    ],
    cdSlug: "shatskaya",
    cdName: "Елена Шацкая",
  },
  {
    slug: "most-engineer",
    projectSlug: "most",
    title: "Главная мужская · инженер",
    roleLabel: "Главная мужская",
    text: "Проект в прокате. Роль закрыта — карточка остаётся в архиве фестивального окна.",
    meta: "Полный метр · кинотеатры · Москва",
    deadline: "закрыт",
    responses: 204,
    media: "/assets/figma/ad-02.png",
    facts: [
      ["Роль", "Главная мужская"],
      ["Статус", "Закрыт"],
      ["Платформа", "кинотеатры"],
    ],
    cdSlug: "sokolova",
    cdName: "Мария Соколова",
  },
  {
    slug: "zerkalo-vody-diver",
    projectSlug: "zerkalo-vody",
    title: "Вторая женская · дайвер",
    roleLabel: "Вторая женская",
    text: "25–32, Сочи. Инструктор по дайвингу. Навык плавания обязателен, сертификат — плюс.",
    meta: "Полный метр · Кинопоиск · Сочи",
    deadline: "20 июня",
    responses: 41,
    media: "/assets/figma/ad-03.png",
    facts: [
      ["Роль", "Вторая женская"],
      ["Возраст", "25–32"],
      ["Гонорар", "900 тыс. – 1.3 ₽ млн за проект"],
      ["Платформа", "Кинопоиск"],
    ],
    cdSlug: "lebedeva",
    cdName: "Анна Лебедева",
  },
  {
    slug: "dvoe-pair",
    projectSlug: "dvoe",
    title: "Парная роль · близнецы",
    roleLabel: "Главная · парная",
    text: "Два актёра, похожих по фактуре. Короткий метр, Казань, 6 смен. Не обязательно родственники.",
    meta: "Короткий метр · KION · Казань",
    deadline: "16 июня",
    responses: 29,
    media: "/assets/figma/ad-04.png",
    facts: [
      ["Роль", "Парная"],
      ["Смены", "6"],
      ["Платформа", "KION"],
    ],
    cdSlug: "shatskaya",
    cdName: "Елена Шацкая",
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
