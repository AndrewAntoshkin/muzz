export const ROLE_STORE = "kadr-demo-role";

/** Product persona (вид пользователя). Privilege is `AccessId`, not this. */
export type RoleId = "actor" | "casting" | "agent";
export type UserKind = RoleId;

export type RoleNav = {
  id: string;
  label: string;
  href: string;
  count?: string;
  live?: boolean;
};

/** Bottom-tab destinations on mobile. Desktop `nav` is unchanged. */
export const MOBILE_TAB_IDS: Record<RoleId, string[]> = {
  actor: ["home", "castings", "projects", "responses"],
  casting: ["home", "projects", "castings", "responses"],
  agent: ["home", "roster", "castings", "responses"],
};

export function mobileTabsFor(cfg: DemoRole): RoleNav[] {
  return MOBILE_TAB_IDS[cfg.id]
    .map((id) => cfg.nav.find((item) => item.id === id))
    .filter((item): item is RoleNav => Boolean(item))
    .map((item) => {
      if (item.id === "responses" && cfg.id === "actor") return { ...item, label: "Отклики" };
      if (item.id === "roster") return { ...item, label: "Актёры" };
      if (item.id === "castings" && cfg.id === "casting") return { ...item, label: "Кастинги" };
      return item;
    });
}

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
      { id: "messages", label: "Сообщения", href: "/messages", count: "2", live: true },
    ],
    blockTitle: "Агентство",
    block: [],
    recent: [
      { href: "/castings/tihiy-yanvar-second", label: "Вторая мужская · «Тихий январь»", live: true },
      { href: "/people/kevorkova", label: "Анна Кеворкова", live: true },
      { href: "/people/vzmetnev", label: "Мой профиль", live: true },
    ],
    plus: [
      { action: "status", label: "Обновить статус" },
      { action: "profile", label: "Редактировать профиль" },
    ],
    hub: {
      lead: "Самопроба по «Тихому январю» отправлена.",
      metrics: [
        ["3", "кастинга в работе", "1 срочный"],
        ["2", "активных отклика", "1 в шорт-листе"],
        ["1", "самопроба", "отправлена"],
        ["2", "сообщения", "Кеворкова, Залинян"],
      ],
      feedTitle: "Кастинги для вас",
      feedLead: "Подходящие роли из открытых кастингов",
      peopleTitle: "Люди",
      peopleLead: "Кастинг-директора и коллеги",
    },
    now: [
      { kind: "Дедлайн", title: "Самопроба · вторая мужская", meta: "«Тихий январь» · до 6 июня · Sreda", urgent: true },
      { kind: "Hold", title: "Очные 10–14 июня", meta: "если пройдёте шорт-лист" },
    ],
    messages: [
      { img: "/assets/people/kevorkova.jpg", name: "Анна Кеворкова", text: "Школу давайте ещё раз: спокойнее, без давления в последней реплике.", time: "14:20", unread: true },
      { initials: "ТЗ", bg: "#6D3D3D", name: "Татевик Залинян", text: "Сцены кину сегодня. Как будет файл — сразу мне.", time: "09:50", unread: true },
      { initials: "МЛ", bg: "#5C4A45", name: "Маргарита Ленских", text: "Отвечу до пятницы, как будет ясно по январю.", time: "10:41" },
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
    name: "Анна Кеворкова",
    city: "Москва",
    avatar: "/assets/people/kevorkova.jpg",
    profile: "/people/kevorkova",
    nav: [
      { id: "home", label: "Главная", href: "/", live: true },
      { id: "projects", label: "Проекты", href: "/projects", live: true },
      { id: "castings", label: "Мои кастинги", href: "/castings", live: true },
      { id: "responses", label: "Отклики", href: "/responses", live: true },
      { id: "faces", label: "База", href: "/faces", live: true },
      { id: "messages", label: "Сообщения", href: "/messages", count: "2", live: true },
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
      lead: "142 отклика ждут разбора · пробы 10–14 июня.",
      metrics: [
        ["3", "кастинга открыты", "1 срочный"],
        ["142", "отклика", "«Тихий январь»"],
        ["18", "в шорт-листе", "нужно решение"],
        ["2", "сообщения", "Гнеушева, Устюгов"],
      ],
      feedTitle: "Активные кастинги",
      feedLead: "Ваши роли и входящие отклики",
      peopleTitle: "Ростер",
      peopleLead: "Актёры и их занятость",
    },
    now: [
      { kind: "Пробы", title: "Очные «Тихий январь»", meta: "10–14 июня · студия Sreda", urgent: true },
      { kind: "Шорт-лист", title: "18 кандидатов", meta: "решение до пятницы" },
    ],
    messages: [
      { img: "/assets/people/gneusheva.jpg", name: "Наталья Гнеушева", text: "Шоурил точно сегодня. Самопробу не обещаю на сегодня.", time: "10:31", unread: true },
      { img: "/assets/actors/akter1/ustyugov-aleksandr.jpg", name: "Александр Устюгов", text: "Если самопроба нужна до очных — скажите сегодня, сниму вечером.", time: "09:51", unread: true },
      { img: "/assets/actors/vzmetnev-avatar.jpg", name: "Александр Взметнев", text: "Школу давайте ещё раз: спокойнее, без давления.", time: "14:20" },
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
    firstName: "Наталья",
    name: "Наталья Гнеушева",
    city: "Москва",
    avatar: "/assets/people/gneusheva.jpg",
    profile: "/people/gneusheva",
    nav: [
      { id: "home", label: "Главная", href: "/", live: true },
      { id: "roster", label: "Мои актёры", href: "/search?mine=1", live: true },
      { id: "projects", label: "Проекты", href: "/projects", live: true },
      { id: "castings", label: "Кастинги", href: "/castings", live: true },
      { id: "responses", label: "Предложения", href: "/responses", live: true },
      { id: "messages", label: "Сообщения", href: "/messages", count: "3", live: true },
    ],
    blockTitle: "Агентство",
    block: [{ href: "/agencies/castingrus", name: "агентство Натальи Гнеушевой", live: true }],
    recent: [
      { href: "/castings/tihiy-yanvar-lead", label: "«Тихий январь»", live: true },
      { href: "/people/ustyugov-aleksandr", label: "Александр Устюгов", live: true },
      { href: "/people/kevorkova", label: "Анна Кеворкова", live: true },
    ],
    plus: [{ href: "/compose?type=propose", label: "Предложить актёра" }],
    hub: {
      lead: "Ростер · открытые кастинги под подбор.",
      metrics: [
        ["78", "в ростере", "к разбору"],
        ["8", "кастингов", "сегодня"],
        ["5", "предложений", "ждут ответа"],
        ["3", "сообщения", "CD и ростер"],
      ],
      feedTitle: "Кастинги для ростера",
      feedLead: "Роли, куда можно предложить ваших актёров",
      peopleTitle: "Ростер",
      peopleLead: "Ваши актёры и их занятость",
    },
    now: [
      { kind: "Кастинг", title: "«Тихий январь»", meta: "главная + вторая мужская" },
    ],
    messages: [
      { img: "/assets/actors/vzmetnev-avatar.jpg", name: "Александр Взметнев", text: "Если что-то конкретное — сюда, отвечу в тот же день.", time: "11:48", unread: true },
      { initials: "МЛ", bg: "#5C4A45", name: "Маргарита Ленских", text: "Если занятость не подтверждена — сразу пишите, не держите слот.", time: "09:18", unread: true },
      { img: "/assets/actors/akter1/ustyugov-aleksandr.jpg", name: "Александр Устюгов", text: "Июнь подтверждаю, кроме 12–13. 12-е после 15:00 лучше не надо.", time: "08:50", unread: true },
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
