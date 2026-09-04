export const ROLE_STORE = "kadr-demo-role";

export type RoleId = "actor" | "casting" | "agent";

export type RoleNav = {
  id: string;
  label: string;
  href: string;
  count?: string;
  live?: boolean;
};

export type DemoRole = {
  id: RoleId;
  label: string;
  firstName: string;
  name: string;
  city: string;
  avatar: string;
  profile: string;
  nav: RoleNav[];
  blockTitle: string;
  block: { href: string; name: string; live?: boolean }[];
  recent: { href: string; label: string; live?: boolean }[];
  plus: { href?: string; action?: "status" | "profile"; label: string }[];
  hub: {
    lead: string;
    metrics: [string, string, string][];
    feedTitle: string;
    feedLead: string;
    peopleTitle: string;
    peopleLead: string;
  };
  now: { kind: string; title: string; meta: string; urgent?: boolean }[];
  messages: {
    initials?: string;
    bg?: string;
    img?: string;
    name: string;
    text: string;
    time: string;
    unread?: boolean;
  }[];
  events: [string, string, string, string, string][];
};

export const DEMO_ROLES: Record<RoleId, DemoRole> = {
  actor: {
    id: "actor",
    label: "Актёр",
    firstName: "Александр",
    name: "Александр Взметнев",
    city: "Москва",
    avatar: "/assets/actors/vzmetnev-avatar.jpg",
    profile: "/people/vzmetnev",
    nav: [
      { id: "home", label: "Главная", href: "/", live: true },
      { id: "castings", label: "Кастинги", href: "/castings", live: true },
      { id: "projects", label: "Проекты", href: "/projects", live: true },
      { id: "responses", label: "Мои отклики", href: "/responses", live: true },
      { id: "messages", label: "Сообщения", href: "/messages", count: "3", live: true },
    ],
    blockTitle: "Агентство",
    block: [{ href: "/agencies/akter1", name: "«Актёр 1»", live: true }],
    recent: [
      { href: "/castings/tihiy-yanvar-second", label: "Вторая мужская · «Тихий январь»", live: true },
      { href: "/people/lebedeva", label: "Анна Лебедева", live: true },
      { href: "/people/vzmetnev", label: "Мой профиль", live: true },
    ],
    plus: [
      { action: "status", label: "Обновить статус" },
      { action: "profile", label: "Редактировать профиль" },
    ],
    hub: {
      lead: "Вторая мужская «Тихий январь» в шорт-листе · 2 непрочитанных · с июля открыт.",
      metrics: [
        ["3", "кастинга в работе", "1 срочный"],
        ["2", "активных отклика", "1 в шорт-листе"],
        ["1", "самопроба до дедлайна", "6 июня"],
        ["2", "сообщения", "Лебедева · Кеворкова"],
      ],
      feedTitle: "Кастинги для вас",
      feedLead: "Подходящие роли из открытых кастингов",
      peopleTitle: "Люди",
      peopleLead: "Кастинг-директора, агент и коллеги",
    },
    now: [
      { kind: "Дедлайн", title: "Самопроба · вторая мужская", meta: "«Тихий январь» · до 6 июня · Sreda", urgent: true },
      { kind: "Hold", title: "Очные 10–14 июня", meta: "если пройдёте шорт-лист" },
      { kind: "Сообщение", title: "Анна Кеворкова", meta: "«Окно» · очные 14 июня" },
    ],
    messages: [
      { initials: "АЛ", bg: "#5C4A45", name: "Анна Лебедева", text: "Приняла, вы в шорт-листе. Подтвержу слот завтра.", time: "2 ч", unread: true },
      { img: "/assets/figma/avatar-01.png", name: "Анна Кеворкова", text: "Студия Окно зовёт на очные 14 июня.", time: "вчера" },
      { initials: "СО", bg: "#3D5C4A", name: "Студия Окно", text: "Приглашаем на очные пробы 14 июня, Москва.", time: "2 дня" },
    ],
    events: [
      ["10", "июн", "Мастер-класс: самопроба для платформ", "Онлайн · кастинг-директора Кинопоиска", "2026-06-10"],
      ["18", "июн", "Премия «Золотой орёл» · номинации", "Москва", "2026-06-18"],
      ["1", "окт", "Фестиваль «Маяк»", "Геленджик · открытие сезона", "2026-10-01"],
    ],
  },
  casting: {
    id: "casting",
    label: "Кастинг-директор",
    firstName: "Анна",
    name: "Анна Лебедева",
    city: "Москва",
    avatar: "/assets/figma/avatar-02.png",
    profile: "/people/lebedeva",
    nav: [
      { id: "home", label: "Главная", href: "/", live: true },
      { id: "projects", label: "Проекты", href: "/projects", live: true },
      { id: "castings", label: "Мои кастинги", href: "/castings", live: true },
      { id: "responses", label: "Отклики", href: "/responses", live: true },
      { id: "faces", label: "База", href: "/faces", live: true },
      { id: "messages", label: "Сообщения", href: "/messages", count: "3", live: true },
    ],
    blockTitle: "Агентства",
    block: [{ href: "/agencies/akter1", name: "«Актёр 1»", live: true }],
    recent: [
      { href: "/castings/tihiy-yanvar-lead", label: "«Тихий январь»", live: true },
      { href: "/search", label: "Поиск по базе", live: true },
      { href: "/people/vzmetnev", label: "Александр Взметнев", live: true },
    ],
    plus: [
      { href: "/compose?type=casting", label: "Кастинг" },
      { href: "/compose?type=project", label: "Проект" },
      { href: "/compose?type=post", label: "Пост в ленту" },
    ],
    hub: {
      lead: "142 отклика на «Тихий январь» · шорт-лист к пятнице · пробы 10–14 июня.",
      metrics: [
        ["3", "кастинга открыты", "1 срочный"],
        ["142", "отклика", "«Тихий январь»"],
        ["18", "в шорт-листе", "нужно решение"],
        ["2", "чата", "агент · студия"],
      ],
      feedTitle: "Активные кастинги",
      feedLead: "Ваши роли и входящие отклики",
      peopleTitle: "База",
      peopleLead: "Актёры и агенты — каталог с фильтрами",
    },
    now: [
      { kind: "Пробы", title: "Очные «Тихий январь»", meta: "10–14 июня · студия Sreda", urgent: true },
      { kind: "Шорт-лист", title: "18 кандидатов", meta: "решение до пятницы" },
      { kind: "Агент", title: "Кеворкова", meta: "Лерман + Устюгов предложены" },
    ],
    messages: [
      { img: "/assets/actors/vzmetnev-avatar.jpg", name: "Александр Взметнев", text: "Самопроба готова, отправил ссылку.", time: "1 ч", unread: true },
      { initials: "МК", bg: "#5C4A45", name: "Мария Коваль", text: "Подтверждаю даты 10–14 июня.", time: "вчера" },
      { initials: "АК", bg: "#3D6D99", name: "Анна Кеворкова", text: "Могу предложить Устюгова на вторую роль.", time: "2 дня" },
    ],
    events: [
      ["10", "июн", "Мастер-класс: самопроба для платформ", "Онлайн · CD Кинопоиска", "2026-06-10"],
      ["14", "июн", "Очные пробы «Тихий январь»", "Москва · студия Sreda", "2026-06-14"],
      ["20", "июн", "Союз кастинг-директоров", "Москва · закрытое", "2026-06-20"],
    ],
  },
  agent: {
    id: "agent",
    label: "Агент",
    firstName: "Анна",
    name: "Анна Кеворкова",
    city: "Москва",
    avatar: "/assets/figma/avatar-01.png",
    profile: "/people/kevorkova",
    nav: [
      { id: "home", label: "Главная", href: "/", live: true },
      { id: "roster", label: "Мои актёры", href: "/search?mine=1", live: true },
      { id: "projects", label: "Проекты", href: "/projects", live: true },
      { id: "castings", label: "Кастинги", href: "/castings", live: true },
      { id: "responses", label: "Предложения", href: "/responses", live: true },
      { id: "messages", label: "Сообщения", href: "/messages", count: "3", live: true },
    ],
    blockTitle: "Агентство",
    block: [{ href: "/agencies/akter1", name: "агентство «Актёр 1»", live: true }],
    recent: [
      { href: "/castings/tihiy-yanvar-lead", label: "«Тихий январь»", live: true },
      { href: "/people/ustyugov-aleksandr", label: "Александр Устюгов", live: true },
      { href: "/people/vzmetnev", label: "Александр Взметнев", live: true },
    ],
    plus: [{ href: "/compose?type=propose", label: "Предложить актёра" }],
    hub: {
      lead: "Запрос Лебедевой на 28–34 · 8 кастингов под ростер · договор «Август» на подписи.",
      metrics: [
        ["78", "в ростере", "«Актёр 1»"],
        ["8", "кастингов", "к разбору"],
        ["5", "предложений", "ждут ответа"],
        ["2", "запроса CD", "Лебедева · Окно"],
      ],
      feedTitle: "Кастинги для ростера",
      feedLead: "Роли, куда можно предложить ваших актёров",
      peopleTitle: "Ростер",
      peopleLead: "Ваши актёры и вся база — в поиске",
    },
    now: [
      { kind: "Запрос", title: "Лебедева · 28–34", meta: "главная · «Тихий январь»", urgent: true },
      { kind: "Договор", title: "«Август» · Взметнев", meta: "правки от Sreda сегодня" },
      { kind: "Кастинг", title: "8 ролей под ростер", meta: "Устюгов, Чадов, Лерман" },
    ],
    messages: [
      { img: "/assets/figma/avatar-02.png", name: "Анна Лебедева", text: "Нужна актриса 28–34 на главную и мужчина 30–40 на вторую.", time: "40 мин", unread: true },
      { img: "/assets/actors/vzmetnev-avatar.jpg", name: "Александр Взметнев", text: "Договор по «Августу» — когда подпишем?", time: "вчера" },
      { initials: "СУ", bg: "#5C4A45", name: "Sreda", text: "Нужно подтверждение занятости Устюгова на июнь.", time: "2 дня" },
    ],
    events: [
      ["10", "июн", "Самопробы «Тихий январь»", "Срок для ростера", "2026-06-10"],
      ["14", "июн", "Очные пробы · Sreda", "Москва · ваши актёры в шорт-листе", "2026-06-14"],
      ["20", "июн", "Встреча агентств", "Москва", "2026-06-20"],
    ],
  },
};

export const ROLE_SWITCH: [RoleId, string][] = [
  ["actor", "Актёр"],
  ["casting", "Кастинг-директор"],
  ["agent", "Агент"],
];

export function parseRole(raw: string | null | undefined): RoleId {
  if (raw === "casting" || raw === "agent") return raw;
  return "actor";
}

export function profileSlug(cfg: Pick<DemoRole, "profile">) {
  return cfg.profile.replace(/^\/people\//, "");
}

export function roleAgencyId(role: RoleId) {
  return role === "agent" ? "akter1" : "";
}

export function switchRoleHref(pathname: string, searchParams: URLSearchParams, nextRole: RoleId) {
  const u = new URL(pathname, "http://kadr.local");
  searchParams.forEach((value, key) => {
    if (key !== "role") u.searchParams.set(key, value);
  });
  u.searchParams.set("role", nextRole);
  return u.pathname + u.search;
}

export function withRole(href: string, role: RoleId) {
  const [path, hash] = href.split("#");
  const u = new URL(path, "http://kadr.local");
  u.searchParams.set("role", role);
  return u.pathname + u.search + (hash ? `#${hash}` : "");
}
