/** Три роли MVP: актёр, кастинг-директор, агент. */
(function (global) {
  const STORE = "kadr-demo-role";

  const ROLES = {
    actor: {
      id: "actor",
      label: "Актёр",
      firstName: "Александр",
      name: "Александр Взметнев",
      city: "Москва",
      avatar: "assets/actors/vzmetnev-avatar.jpg",
      complete: 78,
      views: 12,
      profile: "profile.html",
      nav: [
        { id: "home", label: "Главная", href: "index.html" },
        { id: "castings", label: "Кастинги", href: "castings.html" },
        { id: "responses", label: "Мои отклики", href: "responses.html" },
        { id: "messages", label: "Сообщения", href: "messages.html", count: "1" },
      ],
      blockTitle: "Агентство",
      block: [],
      recent: [
        { href: "casting.html", label: "«Тихий январь»" },
        { href: "profile-casting.html", label: "Анна Кеворкова" },
        { href: "profile.html", label: "Мой профиль" },
      ],
      plus: [{ href: "#post", label: "Пост в ленту" }],
      hub: {
        lead: "Самопроба по «Тихому январю» отправлена.",
        metrics: [
          ["3", "кастинга в работе", "1 срочный"],
          ["2", "активных отклика", "1 в шорт-листе"],
          ["1", "самопроба", "отправлена"],
          ["1", "сообщение", "Кеворкова"],
        ],
        feedTitle: "Кастинги для вас",
        feedLead: "Подходящие роли из открытых кастингов",
        peopleTitle: "Люди",
        peopleLead: "Кастинг-директора и коллеги. Проекты и кастинги — в Поиске.",
      },
      now: [
        { kind: "Дедлайн", title: "Самопроба · вторая мужская", meta: "«Тихий январь» · до 6 июня · Sreda", urgent: true },
      ],
      messages: [
        { img: "assets/people/kevorkova.jpg", name: "Анна Кеворкова", text: "Самопробы", time: "1 ч", unread: true },
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
      avatar: "assets/people/kevorkova.jpg",
      complete: 87,
      views: 218,
      profile: "profile-casting.html",
      nav: [
        { id: "home", label: "Главная", href: "index.html" },
        { id: "projects", label: "Проекты", href: "projects.html" },
        { id: "castings", label: "Мои кастинги", href: "castings.html" },
        { id: "messages", label: "Сообщения", href: "messages.html", count: "1" },
      ],
      blockTitle: "Проекты",
      block: [
        { href: "studio.html", name: "Sreda Production" },
        { href: "studio.html?id=trace", name: "Trace Films" },
        { href: "studio.html?id=okno", name: "Студия Окно" },
      ],
      recent: [
        { href: "casting.html", label: "«Тихий январь»" },
        { href: "project.html", label: "«После шторма»" },
        { href: "search.html", label: "Поиск по базе" },
      ],
      plus: [
        { href: "casting.html?new=1", label: "Кастинг" },
        { href: "#post", label: "Пост в ленту" },
      ],
      hub: {
        lead: "142 отклика ждут разбора · пробы 10–14 июня.",
        metrics: [
          ["3", "кастинга в работе", "1 срочный"],
          ["142", "новых отклика", "«Тихий январь»"],
          ["18", "в шорт-листе", "нужно решение"],
          ["1", "сообщение", "актёр"],
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
        { img: "assets/actors/vzmetnev-avatar.jpg", name: "Александр Взметнев", text: "Самопробы", time: "1 ч", unread: true },
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
      avatar: "assets/people/gneusheva.jpg",
      complete: 82,
      views: 96,
      profile: "profile-agent.html",
      nav: [
        { id: "home", label: "Главная", href: "index.html" },
        { id: "roster", label: "Мои актёры", href: "search.html" },
        { id: "castings", label: "Кастинги", href: "castings.html" },
        { id: "messages", label: "Сообщения", href: "messages.html" },
      ],
      blockTitle: "Агентство",
      block: [{ href: "profile-agent.html", name: "агентство Натальи Гнеушевой" }],
      recent: [
        { href: "casting.html", label: "«Тихий январь»" },
        { href: "person.html?id=ustyugov-aleksandr", label: "Александр Устюгов" },
        { href: "profile.html", label: "Александр Взметнев" },
      ],
      plus: [{ href: "search.html", label: "Предложить актёра" }],
      hub: {
        lead: "8 кастингов подходят ростеру · 2 запроса от кастинг-директоров.",
        metrics: [
          ["78", "актёров в ростере", "к разбору"],
          ["8", "кастингов к разбору", "сегодня"],
          ["5", "предложений отправлено", "ждут ответа"],
          ["0", "новых сообщений", "пока пусто"],
        ],
        feedTitle: "Кастинги для ростера",
        feedLead: "Роли, куда можно предложить ваших актёров",
        peopleTitle: "Ростер",
        peopleLead: "Ваши актёры и вся база — в поиске",
      },
      now: [
        { kind: "Кастинг", title: "«Тихий январь»", meta: "главная + вторая мужская" },
      ],
      messages: [],
      events: [
        ["10", "июн", "Самопробы «Тихий январь»", "Срок для ростера", "2026-06-10"],
        ["14", "июн", "Очные пробы · Sreda", "Москва · ваши актёры в шорт-листе", "2026-06-14"],
        ["20", "июн", "Встреча агентств", "Москва", "2026-06-20"],
      ],
    },
  };

  function isRole(id) {
    return Boolean(ROLES[id]);
  }

  function parseRole(raw) {
    return isRole(raw) ? raw : "actor";
  }

  function readStored() {
    try {
      return parseRole(localStorage.getItem(STORE));
    } catch (_) {
      return "actor";
    }
  }

  function persist(id) {
    try {
      localStorage.setItem(STORE, id);
    } catch (_) {}
  }

  function applyToBody(id) {
    const role = ROLES[parseRole(id)];
    const b = document.body;
    b.setAttribute("data-profession", role.id);
    b.setAttribute("data-user-name", role.name);
    b.setAttribute("data-user-city", role.city);
    b.setAttribute("data-user-avatar", role.avatar);
    b.setAttribute("data-profile-complete", String(role.complete));
    b.setAttribute("data-profile-views", String(role.views));
    persist(role.id);
    return role;
  }

  function current() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("role");
    const id = isRole(fromUrl) ? fromUrl : readStored();
    return applyToBody(id);
  }

  function hrefWithRole(href, id) {
    try {
      const u = new URL(href, window.location.href);
      u.searchParams.set("role", id);
      return u.pathname + u.search + u.hash;
    } catch (_) {
      const join = href.includes("?") ? "&" : "?";
      return `${href}${join}role=${id}`;
    }
  }

  global.KadrRoles = { STORE, ROLES, parseRole, current, applyToBody, hrefWithRole, isRole };
})(typeof window !== "undefined" ? window : global);
