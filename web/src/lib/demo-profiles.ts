import type { PersonCard } from "./person-card";

export const VZMETNEV_CARD: PersonCard = {
  height: "180 см",
  instagram: "@alexander_vzmetnev",
  manager: {
    name: "Лариса Морозова",
    org: "MS Talents · кастинги и съёмки",
    email: "lmorozova@mstalents.ru",
    phone: "+7 (495) 123-45-67",
  },
  params: [
    { label: "Рост", value: "180 см" },
    { label: "Вес", value: "76 кг" },
    { label: "Грудь", value: "102 см" },
    { label: "Талия", value: "82 см" },
    { label: "Размер одежды", value: "50 (M/L)" },
    { label: "Обувь", value: "43" },
  ],
  appearance: [
    { label: "Тип", value: "славянский" },
    { label: "Волосы", value: "тёмно-русые" },
    { label: "Глаза", value: "серо-зелёные" },
    { label: "Татуировки", value: "нет" },
    { label: "Шрамы", value: "нет" },
    { label: "Возр. диапазон", value: "28–38" },
  ],
  languages: [
    { label: "Русский", value: "родной" },
    { label: "Английский", value: "B1" },
    { label: "Украинский", value: "понимаю" },
    { label: "Диалекты", value: "рязанский, южнорусский" },
    { label: "Имитация", value: "кавказский, питерский" },
  ],
  skills: [
    "Водительские A, B, C",
    "Мотоцикл",
    "Лошадь · средний уровень",
    "Бокс · 4 года",
    "Самбо",
    "Плавание",
    "Стрелковое (ДШК, АК) · сертификат",
    "Гитара",
    "Танец · базовый",
    "Загранпаспорт + шенген",
  ],
  credits: [
    { year: "2025", title: "«Август»", meta: "военная драма", credit: "пулемётчик ДШК", kind: "Кино" },
    { year: "2024", title: "«Любовь Советского Союза»", meta: "драма", credit: "Андрей Панкратов", kind: "Кино" },
    { year: "2023", title: "«Трудные подростки»", meta: "сериал · 5 сезон", credit: "Глеб · преподаватель", kind: "Сериал" },
    { year: "2022", title: "«Дурочка Надя»", meta: "комедия", credit: "официант", kind: "Кино" },
    { year: "2021", title: "«Бессмертные»", meta: "драма", credit: "нотариус", kind: "Кино" },
    { year: "2019", title: "«Трезвый водитель»", meta: "комедия", credit: "продавец в ЦУМе", kind: "Кино" },
    {
      year: "2018",
      title: "«Мажор-3» · «Ивановы-Ивановы» · «Алиби»",
      meta: "сериалы",
      credit: "Дмитрий Фёдоров · Брусочкин · Игнат",
      kind: "Сериал",
    },
    { year: "2013", title: "«Слишком красивая жена»", meta: "сериал · дебют", credit: "Антон", kind: "Сериал" },
  ],
  showreel: {
    poster: "/assets/actors/vzmetnev-kinopoisk.jpg",
    title: "Александр Взметнев — отрывки из «Мажор», «Ивановы» и «Любовь СССР»",
    duration: "1:52",
    caption: "13 проектов · 2013–2025",
  },
  schedule: {
    busy: [6],
    hold: [10, 11, 12, 13, 14],
    today: 20,
    events: [
      { when: "6 июня", title: "самопроба «Тихий январь»", meta: "Дедлайн отправки" },
      { when: "10–14 июня", title: "очные кастинги «Тихий январь»", meta: "Hold · Sreda Production" },
      { when: "с 1 июля", title: "открыт для съёмок", meta: "Готов к экспедициям" },
    ],
  },
};

export const LEBEDEVA_CARD: PersonCard = {
  heroMeta: ["12 лет", "Союз кастинг-директоров России"],
  stats: [
    { value: "4 280", label: "актёров в базе" },
    { value: "3", label: "активных кастинга" },
    { value: "~6ч", label: "медиана ответа на самопробу" },
    { value: "32", label: "проекта закрыто за 3 года" },
  ],
  chips: ["Полный метр", "Сериал", "Драма", "Period", "Дебютные роли"],
  castings: [
    { title: "Главная роль · «Тихий январь»", meta: "Sreda · Актриса 28–34 · до 6 июня", count: "142", tag: "Срочно", href: "/castings" },
    { title: "Эпизоды · «Комната 14»", meta: "Короткий метр · period · до 30 мая", count: "57", tag: "Открыто", href: "/castings" },
    { title: "Ведущие · док-сериал «Окно»", meta: "Студия Окно · 6 серий · до 12 июня", count: "23", tag: "Открыто", href: "/castings" },
  ],
  credits: [
    { year: "2024", title: "«Антипод»", meta: "Trace · Кинопоиск · 42 роли · 218 проб", credit: "CD", kind: "Кино" },
    { year: "2024", title: "«Стая»", meta: "Sreda · Okko · 38 ролей · 12 эп.", credit: "CD", kind: "Сериал" },
    { year: "2024", title: "«Берег»", meta: "Yellow Black White · START · 26 ролей", credit: "CD", kind: "Сериал" },
    { year: "2023", title: "«Колыбель»", meta: "Trace · 18 ролей · «Окно в Европу»", credit: "CD", kind: "Кино" },
    { year: "2023", title: "«Дайте Иванова 3»", meta: "KION · сериал · 22 роли", credit: "CD", kind: "Сериал" },
    { year: "2022", title: "«Лес»", meta: "Кинопоиск Студия · сериал · 8 эп.", credit: "CD", kind: "Сериал" },
  ],
  clients: [
    { name: "Sreda Production", meta: "6 проектов" },
    { name: "Trace Films", meta: "4 проекта" },
    { name: "Кинопоиск Студия", meta: "5 проектов" },
    { name: "Okko Studios", meta: "3 сериала" },
    { name: "START (через YBW)", meta: "2 сериала" },
    { name: "KION", meta: "3 сериала" },
  ],
  terms: [
    { label: "Студия", value: "фриланс" },
    { label: "Почта", value: "anna@lebedeva.casting" },
    { label: "Telegram", value: "@lebedeva_cd" },
    { label: "Союз", value: "СКД России, с 2018" },
  ],
};

export const KEVORKOVA_CARD: PersonCard = {
  heroMeta: ["Актёр 1"],
  stats: [
    { value: "78", label: "актёров в ростере" },
    { value: "8", label: "кастингов к разбору" },
    { value: "5", label: "предложений в работе" },
    { value: "~4ч", label: "медиана ответа" },
  ],
};

export const VZMETNEV_PHOTOS = Array.from({ length: 8 }, (_, i) => `/assets/actors/gallery-${i + 1}.jpg`);

export const VZMETNEV_LINKS = [
  { kind: "kinopoisk", url: "https://www.kinopoisk.ru/name/4531331/" },
  { kind: "kinolift", url: "https://kinolift.com/ru/16017" },
];
