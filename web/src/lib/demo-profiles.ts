import { addDays, isoRange, toISODate } from "./calendar";
import type { PersonCard, Schedule } from "./person-card";

export function demoActorSchedule(now = new Date()): Schedule {
  const tape = addDays(now, 6);
  const holdStart = addDays(now, 10);
  const holdEnd = addDays(holdStart, 4);
  const open = new Date(holdEnd.getFullYear(), holdEnd.getMonth() + 1, 1);
  return {
    busy: [toISODate(tape)],
    hold: isoRange(holdStart, 5),
    events: [
      { start: toISODate(tape), title: "Самопроба «Тихий январь»", meta: "Дедлайн · Sreda" },
      {
        start: toISODate(holdStart),
        end: toISODate(holdEnd),
        title: "Очные «Тихий январь»",
        meta: "Hold · павильон, Москва",
      },
      {
        start: toISODate(open),
        openFrom: true,
        title: "Открыт для съёмок",
        meta: "Экспедиции до 3 недель",
      },
    ],
  };
}

/** Короткие факты. Без «нейрослопа» и выдуманных цифр. */
export const DEMO_BIOS = {
  vzmetnev:
    "Актёр театра и кино, Москва. В кадре с 2013 года: сериалы платформ и полный метр. Драма, криминал, военное кино, характерные и вторые планы с текстом.",
  kevorkova:
    "Кастинг-директор. Более 20 лет в киноиндустрии, 87 работ. Вице-президент Гильдии кастинг-директоров России. Соучредитель агентства «Актёр 1». Мастер курса «Актёрский агент» во ВГИКе.",
  soykina:
    "Агент агентства «Актёр 1». Москва.",
  gneusheva:
    "Агент и кастинг-директор. Директор актёрского агентства. С 2007 года в кино и на ТВ. ЕГТИ, мастерская Н. В. Мильченко. Москва.",
} as const;

export const VZMETNEV_CARD: PersonCard = {
  height: "180 см",
  education: "ВГИК, актёрский факультет · мастерская; стажировка в МХТ им. Чехова",
  instagram: "@alexander_vzmetnev",
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
  schedule: demoActorSchedule(),
};

/** Открытые данные: Кино-Театр.Ру, ВГИК, Гильдия КД, актер1.ru */
export const KEVORKOVA_CARD: PersonCard = {
  heroMeta: ["20+ лет в кино", "Гильдия кастинг-директоров"],
  stats: [
    { value: "87", label: "работ в кино и сериале" },
    { value: "20+", label: "лет в индустрии" },
  ],
  chips: ["Полный метр", "Сериал", "Кастинг"],
  credits: [
    { year: "2025", title: "«Семь дней Петра Семёныча»", credit: "CD", kind: "Кино" },
    { year: "2025", title: "«Август»", meta: "участие", credit: "CD", kind: "Кино" },
    { year: "2024", title: "«Любовь Советского Союза»", credit: "CD", kind: "Кино" },
    { year: "2022", title: "«Союз спасения. Время гнева»", credit: "CD", kind: "Сериал" },
    { year: "2021", title: "«Майор Гром: Чумной доктор»", credit: "CD", kind: "Кино" },
    { year: "2019", title: "«Союз Спасения»", credit: "CD", kind: "Кино" },
    { year: "2019", title: "«Мёртвое озеро»", credit: "CD", kind: "Сериал" },
    { year: "2017", title: "«Ивановы-Ивановы»", credit: "CD", kind: "Сериал" },
    { year: "2016", title: "«Викинг»", credit: "CD", kind: "Кино" },
    { year: "2012", title: "«8 первых свиданий»", credit: "CD", kind: "Кино" },
  ],
  terms: [
    { label: "Почта", value: "anna@akter1.ru" },
    { label: "Телефон", value: "+7 (916) 670-30-59" },
    { label: "Telegram", value: "@agencyN1" },
    { label: "Город", value: "Москва" },
    { label: "Сайт", value: "https://akter1.ru" },
  ],
};

export const SOYKINA_CARD: PersonCard = {
  heroMeta: ["Агентство «Актёр 1»"],
  chips: ["Кино", "Сериал", "Ростер"],
  terms: [
    { label: "Агентство", value: "«Актёр 1»" },
    { label: "Почта", value: "irina@akter1.ru" },
    { label: "Телефон", value: "+7 (926) 513-15-19" },
    { label: "Сайт", value: "https://akter1.ru" },
    { label: "Город", value: "Москва" },
  ],
};

/** Открытые данные: castingrus.ru/cv, 7дней, Posta-Magazine, Кинопоиск */
export const GNEUSHEVA_CARD: PersonCard = {
  heroMeta: ["С 2007 в кино", "ЕГТИ"],
  education: "ЕГТИ, 1999 · мастерская Н. В. Мильченко",
  stats: [
    { value: "2007", label: "в профессии с" },
    { value: "~18 лет", label: "агентству" },
  ],
  chips: ["Кино", "Сериал", "Эксклюзив", "Кастинг"],
  clients: [
    { name: "Виктория Толстоганова" },
    { name: "Мария Горбань" },
    { name: "Максим Лагашкин" },
    { name: "Владимир Яглыч" },
    { name: "Андрей Мерзликин" },
    { name: "Елена Тронина" },
  ],
  credits: [
    { year: "2024", title: "«Пять копеек»", credit: "CD", kind: "Сериал" },
    { year: "2022", title: "«Провинциальный детектив»", credit: "CD", kind: "Сериал" },
    { year: "2022", title: "«Мать и мачеха»", meta: "короткий метр", credit: "продюсер", kind: "Кино" },
    { year: "2021", title: "«Клиника счастья»", meta: "МТС Медиа", credit: "CD", kind: "Сериал" },
    { year: "2021", title: "«Возвращение Зои»", meta: "короткий метр", credit: "продюсер", kind: "Кино" },
    { year: "2021", title: "«Русский крест»", credit: "CD", kind: "Кино" },
    { year: "2020", title: "«Пласт»", credit: "CD", kind: "Кино" },
    { year: "2019", title: "«Дылды»", meta: "пилот · СТС", credit: "CD", kind: "Сериал" },
    { year: "2019", title: "«Преступление 2»", meta: "Россия-1", credit: "CD", kind: "Сериал" },
    { year: "2018", title: "«Дикая лига»", meta: "Россия / США", credit: "CD", kind: "Кино" },
    { year: "2018", title: "«Анатомия убийства»", meta: "ТВЦ", credit: "CD", kind: "Сериал" },
    { year: "2017", title: "«Территория»", credit: "CD", kind: "Сериал" },
  ],
  terms: [
    { label: "Агентство", value: "Натальи Гнеушевой" },
    { label: "Почта", value: "aktkast@mail.ru" },
    { label: "Телефон", value: "+7 (926) 902-18-82" },
    { label: "Telegram", value: "@gneushevakino" },
    { label: "Сайт", value: "https://castingrus.ru" },
    { label: "Город", value: "Москва" },
    { label: "Образование", value: "ЕГТИ, 1999" },
  ],
};

export const VZMETNEV_PHOTOS = Array.from({ length: 8 }, (_, i) => `/assets/actors/gallery-${i + 1}.jpg`);

export const VZMETNEV_LINKS = [
  { kind: "kinopoisk", url: "https://www.kinopoisk.ru/name/4531331/" },
  { kind: "kinolift", url: "https://kinolift.com/ru/16017" },
];

export const KEVORKOVA_LINKS = [
  { kind: "kinoteatr", url: "https://www.kino-teatr.ru/kino/casting/ros/467639/works/" },
  { kind: "site", url: "https://akter1.ru/" },
];

export const GNEUSHEVA_LINKS = [
  { kind: "site", url: "https://castingrus.ru/" },
  { kind: "kinopoisk", url: "https://www.kinopoisk.ru/name/2341882/" },
  { kind: "kinoteatr", url: "https://www.kino-teatr.ru/kino/acter/ros/256167/bio/" },
  { kind: "telegram", url: "https://t.me/gneushevakino" },
  { kind: "instagram", url: "https://www.instagram.com/natalya.gneusheva/" },
];
