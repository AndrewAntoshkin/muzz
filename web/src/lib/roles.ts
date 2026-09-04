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
  plus: { href?: string; label: string }[];
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
      { id: "responses", label: "Мои отклики", href: "/responses", live: true },
      { id: "messages", label: "Сообщения", href: "/messages", count: "3", live: true },
    ],
    blockTitle: "Агентство",
    block: [{ href: "/people/kevorkova", name: "MS Talents · агент", live: true }],
    recent: [
      { href: "/castings/tihiy-yanvar-lead", label: "«Тихий январь»", live: true },
      { href: "/people/lebedeva", label: "Анна Лебедева", live: true },
      { href: "/people/vzmetnev", label: "Мой профиль", live: true },
    ],
    plus: [{ href: "/compose?type=post", label: "Пост в ленту" }],
    hub: {
      lead: "3 кастинга ждут самопробы · 2 непрочитанных сообщения.",
      metrics: [
        ["12", "кастингов подобрано", "3 срочных"],
        ["4", "активных отклика", "1 приглашение"],
        ["2", "самопробы до дедлайна", "6 июня"],
        ["3", "новых сообщения", "Анна Л., Sreda"],
      ],
      feedTitle: "Кастинги для вас",
      feedLead: "Подходящие роли из открытых кастингов",
      peopleTitle: "Люди",
      peopleLead: "Кастинг-директора и коллеги. Проекты и кастинги — в Поиске.",
    },
    now: [
      { kind: "До дедлайна", title: "Самопроба «Тихий январь»", meta: "осталось 12 дней · Sreda · Кинопоиск", urgent: true },
      { kind: "Сообщение", title: "Анна Лебедева", meta: "«Жду самопробу до 6 июня…» · 2 ч назад" },
    ],
    messages: [
      { initials: "АЛ", bg: "#5C4A45", name: "Анна Лебедева", text: "Жду самопробу до 6 июня — сцены во вложении.", time: "2 ч", unread: true },
      { img: "/assets/figma/avatar-01.png", name: "Ксения Воронина", text: "Прислали правки по договору, посмотри пункт 4.", time: "вчера" },
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
      { id: "messages", label: "Сообщения", href: "/messages", count: "3", live: true },
    ],
    blockTitle: "Проекты",
    block: [
      { href: "/projects/tihiy-yanvar", name: "«Тихий январь»", live: true },
      { href: "/projects/okno", name: "«Окно»", live: true },
      { href: "/projects/komnata-14", name: "«Комната 14»", live: true },
    ],
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
      lead: "142 отклика ждут разбора · пробы 10–14 июня.",
      metrics: [
        ["3", "кастинга в работе", "1 срочный"],
        ["142", "новых отклика", "«Тихий январь»"],
        ["18", "в шорт-листе", "нужно решение"],
        ["3", "сообщения", "актёры и студии"],
      ],
      feedTitle: "Активные кастинги",
      feedLead: "Ваши роли и входящие отклики",
      peopleTitle: "База",
      peopleLead: "Все люди — через поиск сверху",
    },
    now: [
      { kind: "Пробы", title: "Очные «Тихий январь»", meta: "10–14 июня · студия Sreda", urgent: true },
      { kind: "Отклики", title: "18 в шорт-листе", meta: "нужно решение до пятницы" },
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
      { id: "castings", label: "Кастинги", href: "/castings", live: true },
      { id: "responses", label: "Предложения", href: "/responses", live: true },
      { id: "messages", label: "Сообщения", href: "/messages", count: "3", live: true },
    ],
    blockTitle: "Агентство",
    block: [{ href: "/people/kevorkova", name: "агентство «Актёр 1»", live: true }],
    recent: [
      { href: "/castings/tihiy-yanvar-lead", label: "«Тихий январь»", live: true },
      { href: "/people/ustyugov-aleksandr", label: "Александр Устюгов", live: true },
      { href: "/people/vzmetnev", label: "Александр Взметнев", live: true },
    ],
    plus: [{ href: "/compose?type=propose", label: "Предложить актёра" }],
    hub: {
      lead: "8 кастингов подходят ростеру · 2 запроса от кастинг-директоров.",
      metrics: [
        ["78", "актёров в ростере", "Актёр 1"],
        ["8", "кастингов к разбору", "сегодня"],
        ["5", "предложений отправлено", "ждут ответа"],
        ["2", "запроса на актёра", "от Анны Л."],
      ],
      feedTitle: "Кастинги для ростера",
      feedLead: "Роли, куда можно предложить ваших актёров",
      peopleTitle: "Ростер",
      peopleLead: "Ваши актёры и вся база — в поиске",
    },
    now: [
      { kind: "Запрос", title: "Лебедева ищет 28–34", meta: "главная · «Тихий январь»", urgent: true },
      { kind: "Кастинг", title: "8 ролей под ростер", meta: "Устюгов, Чадов, Лерман" },
    ],
    messages: [
      { img: "/assets/figma/avatar-02.png", name: "Анна Лебедева", text: "Нужна актриса 28–34 на главную, есть кто из ростера?", time: "40 мин", unread: true },
      { img: "/assets/actors/vzmetnev-avatar.jpg", name: "Александр Взметнев", text: "Договор по «Августу» — когда подпишем?", time: "вчера" },
      { initials: "Sreda", bg: "#3D5C4A", name: "Sreda Production", text: "Подтвердите занятость Устюгова на июнь.", time: "2 дня" },
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
