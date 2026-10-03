import type { PersonCard } from "./person-card";

type IndustryFace = {
  slug: string;
  name: string;
  role: string;
  profession: string;
  city: string;
  imageUrl: string | null;
  verified: boolean;
  hint: string | null;
  initials: string | null;
  bg: string | null;
  agencyId: string | null;
};

/** Реальные CD и агенты из открытых источников. Короткие факты, без выдуманных био. */
export const INDUSTRY_BIOS = {
  lenskikh:
    "Кастинг-директор. Президент Гильдии кастинг-директоров России. «Чемпион мира», «Пропавшая», «Измены».",
  lavrentieva:
    "Кастинг-директор. Мастер курса «Кастинг-директор» во ВГИКе. «Сто лет тому вперёд». Более 10 лет на киностудии «Курьер».",
  khrechkova:
    "Кастинг-директор. «Алиса не может ждать». Член Гильдии кастинг-директоров России.",
  zalinyan:
    "Кастинг-директор. «Нулевой пациент», «Трасса». Премия АПКиТ — «Золотое дно».",
  bocharova:
    "Агент. Актерское агентство Наталии Бочаровой, Москва.",
} as const;

type IndustrySeed = IndustryFace & {
  bio: string;
  sourceUrl: string;
  card: PersonCard;
  agencyName: string | null;
  agencyWebsite: string | null;
  agentEmail: string | null;
};

export const INDUSTRY: Record<string, IndustrySeed> = {
  lenskikh: {
    slug: "lenskikh",
    name: "Маргарита Ленских",
    role: "Кастинг-директор",
    profession: "casting",
    city: "Москва",
    imageUrl: null,
    verified: true,
    hint: "«Чемпион мира» · Гильдия КД",
    initials: "МЛ",
    bg: "#5C4A45",
    agencyId: null,
    bio: INDUSTRY_BIOS.lenskikh,
    sourceUrl: "https://monocle.ru/monocle/2024/28/margarita-lenskikh-vse-geroi-dolzhny-rabotat-na-obschuyu-ideyu/",
    agencyName: null,
    agencyWebsite: null,
    agentEmail: null,
    card: {
      heroMeta: ["Президент ГКД России"],
      chips: ["Полный метр", "Сериал", "Кастинг"],
      credits: [
        { year: "2021", title: "«Чемпион мира»", credit: "CD", kind: "Кино" },
        { year: "2019", title: "«Пропавшая»", credit: "CD", kind: "Сериал" },
        { year: "2015", title: "«Измены»", credit: "CD", kind: "Сериал" },
      ],
      terms: [
        { label: "Гильдия", value: "Президент ГКД России" },
        { label: "Сайт", value: "http://guildcast.ru" },
        { label: "Город", value: "Москва" },
      ],
    },
  },
  lavrentieva: {
    slug: "lavrentieva",
    name: "Ирина Лаврентьева",
    role: "Кастинг-директор",
    profession: "casting",
    city: "Москва",
    imageUrl: null,
    verified: true,
    hint: "«Сто лет тому вперёд» · ВГИК",
    initials: "ИЛ",
    bg: "#3D5C4A",
    agencyId: null,
    bio: INDUSTRY_BIOS.lavrentieva,
    sourceUrl: "https://vgik.info/programs/kasting-direktor.php",
    agencyName: null,
    agencyWebsite: null,
    agentEmail: null,
    card: {
      heroMeta: ["Мастер курса ВГИК"],
      chips: ["Полный метр", "Сериал", "Кастинг"],
      credits: [{ year: "2024", title: "«Сто лет тому вперёд»", credit: "CD", kind: "Кино" }],
      terms: [
        { label: "ВГИК", value: "мастер курса «Кастинг-директор»" },
        { label: "Город", value: "Москва" },
      ],
    },
  },
  khrechkova: {
    slug: "khrechkova",
    name: "Татьяна Хречкова",
    role: "Кастинг-директор",
    profession: "casting",
    city: "Москва",
    imageUrl: null,
    verified: true,
    hint: "«Алиса не может ждать»",
    initials: "ТХ",
    bg: "#4A3D5C",
    agencyId: null,
    bio: INDUSTRY_BIOS.khrechkova,
    sourceUrl: "https://kudago.com/all/news/go-po-rabotam-kasting-direktor/",
    agencyName: null,
    agencyWebsite: null,
    agentEmail: null,
    card: {
      heroMeta: ["Гильдия кастинг-директоров"],
      chips: ["Сериал", "Кастинг"],
      credits: [{ year: "2022", title: "«Алиса не может ждать»", credit: "CD", kind: "Сериал" }],
      terms: [{ label: "Город", value: "Москва" }],
    },
  },
  zalinyan: {
    slug: "zalinyan",
    name: "Татевик Залинян",
    role: "Кастинг-директор",
    profession: "casting",
    city: "Москва",
    imageUrl: null,
    verified: true,
    hint: "«Нулевой пациент» · «Трасса»",
    initials: "ТЗ",
    bg: "#6D3D3D",
    agencyId: null,
    bio: INDUSTRY_BIOS.zalinyan,
    sourceUrl: "https://alphanews.am/ru/tatevik-zalinyan-stala-laureatom-prem/",
    agencyName: null,
    agencyWebsite: null,
    agentEmail: null,
    card: {
      heroMeta: ["Премия АПКиТ"],
      chips: ["Сериал", "Кастинг"],
      credits: [
        { year: "2025", title: "«Золотое дно»", credit: "CD", kind: "Сериал" },
        { year: "2024", title: "«Трасса»", credit: "CD", kind: "Сериал" },
        { year: "2022", title: "«Нулевой пациент»", credit: "CD", kind: "Сериал" },
      ],
      terms: [{ label: "Город", value: "Москва" }],
    },
  },
  bocharova: {
    slug: "bocharova",
    name: "Наталия Бочарова",
    role: "Агент",
    profession: "agent",
    city: "Москва",
    imageUrl: null,
    verified: true,
    hint: "Агентство Наталии Бочаровой",
    initials: "НБ",
    bg: "#3D5C6D",
    agencyId: null,
    bio: INDUSTRY_BIOS.bocharova,
    sourceUrl: "https://www.agent-bocharova.ru/",
    agencyName: "Агентство Наталии Бочаровой",
    agencyWebsite: "https://www.agent-bocharova.ru/",
    agentEmail: null,
    card: {
      heroMeta: ["Актёрское агентство"],
      chips: ["Кино", "Сериал", "Ростер"],
      terms: [
        { label: "Агентство", value: "Наталии Бочаровой" },
        { label: "Телефон", value: "+7 (495) 741-63-90" },
        { label: "Сайт", value: "https://www.agent-bocharova.ru/" },
        { label: "Город", value: "Москва" },
      ],
    },
  },
};

export const INDUSTRY_FACES: IndustryFace[] = Object.values(INDUSTRY).map(
  ({ bio: _bio, sourceUrl: _src, card: _card, agencyName: _an, agencyWebsite: _aw, agentEmail: _ae, ...face }) => face,
);

export function industrySlugs() {
  return Object.keys(INDUSTRY);
}
