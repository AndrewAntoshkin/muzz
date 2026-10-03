export type AgencyPlatform = {
  name: string;
  logo: string;
};

export type AgencyPlacement = {
  year: string;
  title: string;
  meta: string;
};

export type AgencyContact = {
  label: string;
  value: string;
  href?: string;
};

export type AgencyPage = {
  id: string;
  name: string;
  city: string;
  founded: string;
  website: string;
  websiteLabel: string;
  about: string;
  stats: { value: string; label: string }[];
  chips: string[];
  featuredSlugs: string[];
  platforms: AgencyPlatform[];
  placements: AgencyPlacement[];
  contacts: AgencyContact[];
  agentSlug: string;
};

/** What a CD or actor actually needs from an agency page — not the agent's personal diary. */
export const AGENCY_PAGES: Record<string, AgencyPage> = {
  akter1: {
    id: "akter1",
    name: "Актёр 1",
    city: "Москва",
    founded: "2016",
    website: "https://akter1.ru",
    websiteLabel: "akter1.ru",
    about:
      "Московское актёрское агентство. Ростер для полного метра и сериалов платформ. Ведём договоры, занятость и самопробы, закрываем запросы кастинг-директоров в рабочие часы.",
    stats: [
      { value: "78", label: "актёров в ростере" },
      { value: "Кино / сериал", label: "основные форматы" },
      { value: "~4 ч", label: "медиана ответа" },
      { value: "Москва", label: "офис и выезды" },
    ],
    chips: ["Полный метр", "Сериал", "Платформы", "Договоры", "Самопробы", "Занятость"],
    featuredSlugs: [
      "ustyugov-aleksandr",
      "chadov-aleksej",
      "lerman-olga",
      "shilovskaya-aglaya",
      "kutepova-polina",
      "hmelnickaya-alyona",
      "metelkin-aleksandr",
    ],
    platforms: [
      { name: "Кинопоиск", logo: "/assets/logos/kinopoisk.svg" },
      { name: "Okko", logo: "/assets/logos/okko.svg" },
      { name: "KION", logo: "/assets/logos/kion.webp" },
      { name: "START", logo: "/assets/logos/start.svg" },
      { name: "Wink", logo: "/assets/logos/wink.svg" },
      { name: "Premier", logo: "/assets/logos/premier.svg" },
    ],
    placements: [
      { year: "2025", title: "«Август»", meta: "Okko · ростер агентства" },
      { year: "2024", title: "«Любовь Советского Союза»", meta: "Кинопоиск · сопровождение ростера" },
      { year: "2024", title: "Сериалы платформ", meta: "Wink · Premier · KION" },
      { year: "2023", title: "Запросы CD", meta: "Sreda · Trace Films · YBW" },
    ],
    contacts: [
      { label: "Почта", value: "irina@akter1.ru", href: "mailto:irina@akter1.ru" },
      { label: "Телефон", value: "+7 (926) 513-15-19", href: "tel:+79265131519" },
      { label: "Сайт", value: "akter1.ru", href: "https://akter1.ru" },
    ],
    agentSlug: "soykina",
  },
  castingrus: {
    id: "castingrus",
    name: "Натальи Гнеушевой",
    city: "Москва",
    founded: "2008",
    website: "https://castingrus.ru",
    websiteLabel: "castingrus.ru",
    about:
      "Профессиональный менеджмент актёров на эксклюзивной основе. Кино, сериалы, договоры и занятость.",
    stats: [
      { value: "Эксклюзив", label: "договор" },
      { value: "2008", label: "агентство с" },
      { value: "Кино / сериал", label: "основные форматы" },
      { value: "Москва", label: "офис" },
    ],
    chips: ["Полный метр", "Сериал", "Эксклюзив", "Договоры", "Кастинг"],
    featuredSlugs: [],
    platforms: [
      { name: "Кинопоиск", logo: "/assets/logos/kinopoisk.svg" },
      { name: "START", logo: "/assets/logos/start.svg" },
      { name: "Okko", logo: "/assets/logos/okko.svg" },
      { name: "Premier", logo: "/assets/logos/premier.svg" },
    ],
    placements: [
      { year: "2024", title: "«Пять копеек»", meta: "кастинг" },
      { year: "2022", title: "«Провинциальный детектив»", meta: "кастинг" },
      { year: "2021", title: "«Клиника счастья»", meta: "МТС Медиа · кастинг" },
      { year: "2019", title: "«Дылды»", meta: "СТС · кастинг" },
    ],
    contacts: [
      { label: "Почта", value: "aktkast@mail.ru", href: "mailto:aktkast@mail.ru" },
      { label: "Телефон", value: "+7 (926) 902-18-82", href: "tel:+79269021882" },
      { label: "Сайт", value: "castingrus.ru", href: "https://castingrus.ru" },
      { label: "Telegram", value: "@gneushevakino", href: "https://t.me/gneushevakino" },
    ],
    agentSlug: "gneusheva",
  },
};

export function getAgencyPage(id: string) {
  return AGENCY_PAGES[id] || null;
}
