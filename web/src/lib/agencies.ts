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
      "vzmetnev",
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
      { year: "2025", title: "«Август»", meta: "Okko · Александр Взметнев" },
      { year: "2024", title: "«Любовь Советского Союза»", meta: "Кинопоиск · сопровождение ростера" },
      { year: "2024", title: "Сериалы платформ", meta: "Wink · Premier · KION" },
      { year: "2023", title: "Запросы CD", meta: "Sreda · Trace Films · YBW" },
    ],
    contacts: [
      { label: "Почта", value: "anna@akter1.ru", href: "mailto:anna@akter1.ru" },
      { label: "Telegram", value: "@kevorkova_a1" },
      { label: "Телефон", value: "+7 (495) 120-44-18", href: "tel:+74951204418" },
      { label: "Сайт", value: "akter1.ru", href: "https://akter1.ru" },
    ],
    agentSlug: "kevorkova",
  },
};

export function getAgencyPage(id: string) {
  return AGENCY_PAGES[id] || null;
}
