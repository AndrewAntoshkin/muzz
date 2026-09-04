import type { PersonCard } from "./person-card";

/** Биографии трёх демо-персон (актёр / CD / агент). */
export const DEMO_BIOS = {
  vzmetnev:
    "Актёр театра и кино, Москва. В кадре с 2013 года: сериалы платформ и полный метр. Сильные стороны — драма, криминал, военное кино, характерные и вторые планы с текстом. Уверенно работает на натуре и в павильоне, готов к экспедициям. Представительство — MS Talents / агентство «Актёр 1».",
  lebedeva:
    "Кастинг-директор полного метра и сериала. 12 лет в профессии, член Союза кастинг-директоров России с 2018. Ведёт проекты для Кинопоиск Студии, Sreda, Trace, KION, Yellow Black White. Специализация — драма, period, криминальный сериал и дебютные главные. База ~4 280 актёров с разметкой по типажу, опыту и занятости.",
  kevorkova:
    "Агент актерского агентства «Актёр 1». Ведёт ростер для кино и сериалов, закрывает запросы кастинг-директоров платформ и независимых студий. Работает с занятостью, договорами и самопробами; отвечает в рабочее время в течение нескольких часов.",
} as const;

export const VZMETNEV_CARD: PersonCard = {
  height: "180 см",
  education: "ВГИК, актёрский факультет · мастерская; стажировка в МХТ им. Чехова",
  instagram: "@alexander_vzmetnev",
  manager: {
    name: "Анна Кеворкова",
    org: "Агентство «Актёр 1» · MS Talents",
    email: "anna@akter1.ru",
    phone: "+7 (495) 120-44-18",
  },
  params: [
    { label: "Рост", value: "180 см" },
    { label: "Вес", value: "76 кг" },
    { label: "Грудь", value: "102 см" },
    { label: "Талия", value: "82 см" },
    { label: "Бёдра", value: "98 см" },
    { label: "Размер одежды", value: "50 (M/L)" },
    { label: "Обувь", value: "43" },
    { label: "Одежда", value: "M–L" },
    { label: "Город", value: "Москва" },
  ],
  appearance: [
    { label: "Тип", value: "славянский" },
    { label: "Волосы", value: "тёмно-русые, короткие" },
    { label: "Глаза", value: "серо-зелёные" },
    { label: "Татуировки", value: "нет" },
    { label: "Шрамы", value: "нет" },
    { label: "Возр. диапазон", value: "28–38" },
    { label: "Тип внешности", value: "европейский" },
    { label: "Телосложение", value: "атлетическое" },
    { label: "Голос", value: "баритон" },
  ],
  languages: [
    { label: "Русский", value: "родной" },
    { label: "Английский", value: "B1–B2 · разговорный" },
    { label: "Украинский", value: "понимаю" },
    { label: "Диалекты", value: "рязанский, южнорусский" },
    { label: "Имитация", value: "кавказский, питерский" },
  ],
  skills: [
    "Водительские A, B, C",
    "Мотоцикл",
    "Верховая езда · средний",
    "Бокс · 4 года",
    "Самбо",
    "Плавание",
    "Стрелковое оружие · сертификат",
    "Гитара",
    "Танец · базовый",
    "Загранпаспорт + шенген",
  ],
  credits: [
    { year: "2025", title: "«Август»", meta: "военная драма · Okko", credit: "пулемётчик ДШК", kind: "Кино" },
    { year: "2024", title: "«Любовь Советского Союза»", meta: "драма · Кинопоиск", credit: "Андрей Панкратов", kind: "Кино" },
    { year: "2023", title: "«Трудные подростки»", meta: "сериал · 5 сезон · Wink", credit: "Глеб · преподаватель", kind: "Сериал" },
    { year: "2022", title: "«Дурочка Надя»", meta: "комедия", credit: "официант", kind: "Кино" },
    { year: "2021", title: "«Бессмертные»", meta: "драма", credit: "нотариус", kind: "Кино" },
    { year: "2019", title: "«Трезвый водитель»", meta: "комедия", credit: "продавец в ЦУМе", kind: "Кино" },
    { year: "2018", title: "«Мажор-3»", meta: "сериал · Кинопоиск", credit: "Дмитрий Фёдоров", kind: "Сериал" },
    { year: "2018", title: "«Ивановы-Ивановы»", meta: "сериал · СТС / Premier", credit: "Брусочкин", kind: "Сериал" },
    { year: "2017", title: "«Алиби»", meta: "сериал", credit: "Игнат", kind: "Сериал" },
    { year: "2013", title: "«Слишком красивая жена»", meta: "сериал · дебют", credit: "Антон", kind: "Сериал" },
  ],
  showreel: {
    poster: "/assets/actors/vzmetnev-kinopoisk.jpg",
    title: "Александр Взметнев — showreel 2018–2025",
    duration: "1:52",
    caption: "«Мажор» · «Ивановы» · «Любовь СССР» · «Август»",
    href: "https://www.kinopoisk.ru/name/4531331/",
  },
  schedule: {
    busy: [6],
    hold: [10, 11, 12, 13, 14],
    today: 20,
    events: [
      { when: "6 июня", title: "Самопроба «Тихий январь»", meta: "Дедлайн · Sreda / Лебедева" },
      { when: "10–14 июня", title: "Очные «Тихий январь»", meta: "Hold · павильон, Москва" },
      { when: "с 1 июля", title: "Открыт для съёмок", meta: "Экспедиции до 3 недель" },
    ],
  },
};

export const LEBEDEVA_CARD: PersonCard = {
  heroMeta: ["12 лет в профессии", "СКД России · с 2018"],
  education: "ВГИК · продюсерский; курсы кастинга Union of Casting Directors",
  stats: [
    { value: "4 280", label: "актёров в базе" },
    { value: "3", label: "активных кастинга" },
    { value: "~6 ч", label: "медиана ответа" },
    { value: "32", label: "проекта за 3 года" },
  ],
  chips: ["Полный метр", "Сериал", "Драма", "Period", "Криминал", "Дебютные роли", "Натура", "Павильон"],
  castings: [
    {
      title: "Главная · «Тихий январь»",
      meta: "Sreda · актриса 28–34 · до 6 июня",
      count: "142",
      tag: "Срочно",
      href: "/castings/tihiy-yanvar-lead",
    },
    {
      title: "Эпизоды · «Комната 14»",
      meta: "Короткий метр · period 1950-е · до 30 мая",
      count: "57",
      tag: "Открыто",
      href: "/castings/komnata-14-episode",
    },
    {
      title: "Ведущие · «Окно»",
      meta: "Студия Окно · док · KION · до 12 июня",
      count: "23",
      tag: "Открыто",
      href: "/castings/okno-hosts",
    },
  ],
  credits: [
    { year: "2025", title: "«Тихий январь»", meta: "Sreda · Кинопоиск · препродакшн", credit: "CD", kind: "Кино" },
    { year: "2024", title: "«Антипод»", meta: "Trace · Кинопоиск · 42 роли · 218 проб", credit: "CD", kind: "Кино" },
    { year: "2024", title: "«Стая»", meta: "Sreda · Okko · 38 ролей · 12 эп.", credit: "CD", kind: "Сериал" },
    { year: "2024", title: "«Берег»", meta: "YBW · START · 26 ролей", credit: "CD", kind: "Сериал" },
    { year: "2023", title: "«Колыбель»", meta: "Trace · «Окно в Европу»", credit: "CD", kind: "Кино" },
    { year: "2023", title: "«Дайте Иванова 3»", meta: "KION · 22 роли", credit: "CD", kind: "Сериал" },
    { year: "2022", title: "«Лес»", meta: "Кинопоиск Студия · 8 эп.", credit: "CD", kind: "Сериал" },
    { year: "2021", title: "«Север»", meta: "полный метр · независимый", credit: "CD", kind: "Кино" },
  ],
  clients: [
    { name: "Sreda Production", meta: "6 проектов" },
    { name: "Trace Films", meta: "4 проекта" },
    { name: "Кинопоиск Студия", meta: "5 проектов" },
    { name: "Okko Studios", meta: "3 сериала" },
    { name: "START / YBW", meta: "2 сериала" },
    { name: "KION", meta: "3 сериала" },
  ],
  terms: [
    { label: "Формат", value: "фриланс · проектная ставка" },
    { label: "Почта", value: "anna@lebedeva.casting" },
    { label: "Telegram", value: "@lebedeva_cd" },
    { label: "Город", value: "Москва · выезды" },
    { label: "Союз", value: "СКД России, с 2018" },
    { label: "Ответ", value: "обычно в тот же день" },
  ],
};

export const KEVORKOVA_CARD: PersonCard = {
  heroMeta: ["Агентство «Актёр 1»", "9 лет в агентстве"],
  education: "РГГУ · менеджмент культуры; стажировки у кастинг-директоров платформ",
  stats: [
    { value: "78", label: "актёров в ростере" },
    { value: "8", label: "кастингов в работе" },
    { value: "5", label: "предложений открыто" },
    { value: "~4 ч", label: "медиана ответа" },
  ],
  chips: ["Кино", "Сериал", "Платформы", "Договоры", "Самопробы", "Занятость", "Экспедиции"],
  castings: [
    {
      title: "Подбор на «Тихий январь»",
      meta: "Запрос Лебедевой · главная 28–34 + вторая мужская",
      count: "3",
      tag: "В работе",
      href: "/castings/tihiy-yanvar-lead",
    },
    {
      title: "Ростер на «Окно»",
      meta: "Ведущие док-сериала · KION",
      count: "2",
      tag: "Открыто",
      href: "/castings/okno-hosts",
    },
  ],
  credits: [
    { year: "2025", title: "«Август»", meta: "Okko · договор Взметнева", credit: "Агент", kind: "Кино" },
    { year: "2024", title: "«Любовь Советского Союза»", meta: "Кинопоиск · сопровождение", credit: "Агент", kind: "Кино" },
    { year: "2024", title: "Сериальные контракты ростера", meta: "Wink / Premier / KION", credit: "Агент", kind: "Сериал" },
    { year: "2023", title: "Закрытие 14 запросов CD", meta: "Sreda · Trace · YBW", credit: "Агент", kind: "Кастинг" },
  ],
  clients: [
    { name: "Александр Взметнев", meta: "актёр · договор «Август»" },
    { name: "Александр Устюгов", meta: "актёр · ростер" },
    { name: "Алексей Чадов", meta: "актёр · ростер" },
    { name: "Ольга Лерман", meta: "актриса · ростер" },
    { name: "Аглая Шиловская", meta: "актриса · ростер" },
  ],
  terms: [
    { label: "Агентство", value: "«Актёр 1»" },
    { label: "Почта", value: "anna@akter1.ru" },
    { label: "Telegram", value: "@kevorkova_a1" },
    { label: "Телефон", value: "+7 (495) 120-44-18" },
    { label: "Сайт", value: "akter1.ru" },
    { label: "Комиссия", value: "по договору агентства" },
  ],
};

export const VZMETNEV_PHOTOS = Array.from({ length: 8 }, (_, i) => `/assets/actors/gallery-${i + 1}.jpg`);

export const VZMETNEV_LINKS = [
  { kind: "kinopoisk", url: "https://www.kinopoisk.ru/name/4531331/" },
  { kind: "kinolift", url: "https://kinolift.com/ru/16017" },
];
