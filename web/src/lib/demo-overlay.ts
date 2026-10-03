import { INDUSTRY, INDUSTRY_FACES } from "./demo-industry";
import {
  DEMO_BIOS,
  GNEUSHEVA_CARD,
  GNEUSHEVA_LINKS,
  KEVORKOVA_CARD,
  KEVORKOVA_LINKS,
  SOYKINA_CARD,
  VZMETNEV_CARD,
} from "./demo-profiles";
import type { PersonCard } from "./person-card";

const KEVORKOVA_IMG = "/assets/people/kevorkova.jpg";
const GNEUSHEVA_IMG = "/assets/people/gneusheva.jpg";

export type DemoFace = {
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

export const SOYKINA_FACE: DemoFace = {
  slug: "soykina",
  name: "Ирина Сойкина",
  role: "Агент",
  profession: "agent",
  city: "Москва",
  imageUrl: null,
  verified: true,
  hint: "Агентство «Актёр 1»",
  initials: "ИС",
  bg: "#3D6D99",
  agencyId: "akter1",
};

export const GNEUSHEVA_FACE: DemoFace = {
  slug: "gneusheva",
  name: "Наталья Гнеушева",
  role: "Агент",
  profession: "agent",
  city: "Москва",
  imageUrl: GNEUSHEVA_IMG,
  verified: true,
  hint: "Агентство Натальи Гнеушевой",
  initials: "НГ",
  bg: "#6D3D5C",
  agencyId: "castingrus",
};

export function applyDemoFace<T extends DemoFace>(row: T): T | null {
  if (row.slug === "lebedeva") return null;
  if (row.slug === "vzmetnev") {
    return {
      ...row,
      agencyId: null,
      hint: row.hint?.includes("Актёр 1") ? "«Любовь СССР» · Кинопоиск" : row.hint,
    };
  }
  if (row.slug === "kevorkova") {
    return {
      ...row,
      name: "Анна Кеворкова",
      role: "Кастинг-директор",
      profession: "casting",
      city: "Москва",
      imageUrl: KEVORKOVA_IMG,
      verified: true,
      hint: "«Союз Спасения» · «Майор Гром»",
      initials: "АК",
      agencyId: null,
    };
  }
  if (row.slug === "gneusheva") {
    return {
      ...row,
      name: "Наталья Гнеушева",
      role: "Агент",
      profession: "agent",
      city: "Москва",
      imageUrl: GNEUSHEVA_IMG,
      verified: true,
      hint: "Агентство Натальи Гнеушевой",
      initials: "НГ",
      agencyId: row.agencyId || "castingrus",
    };
  }
  return row;
}

export function overlayFaces<T extends DemoFace>(rows: T[]): T[] {
  const mapped = rows.map(applyDemoFace).filter((row): row is T => row !== null);
  const have = new Set(mapped.map((row) => row.slug));
  if (!have.has("soykina")) mapped.push(SOYKINA_FACE as T);
  if (!have.has("gneusheva")) mapped.push(GNEUSHEVA_FACE as T);
  for (const face of INDUSTRY_FACES) {
    if (!have.has(face.slug)) mapped.push(face as T);
  }
  return mapped;
}

type PersonLike = {
  slug: string;
  name: string;
  role: string;
  profession: string;
  city: string | null;
  bio: string | null;
  imageUrl: string | null;
  coverUrl: string | null;
  verified: boolean;
  sourceUrl: string | null;
  birthDate: string | null;
  hint: string | null;
  initials: string | null;
  bg: string | null;
  card: PersonCard | null;
  agencyId: string | null;
  agencyName: string | null;
  agencyWebsite: string | null;
  agentName: string | null;
  agentEmail: string | null;
  links: { id: string; personSlug: string; kind: string; url: string }[];
  photos: { id: string; personSlug: string; url: string; sort: number }[];
};

export function syntheticSoykina(): PersonLike {
  return {
    slug: "soykina",
    name: "Ирина Сойкина",
    role: "Агент",
    profession: "agent",
    city: "Москва",
    bio: DEMO_BIOS.soykina,
    imageUrl: null,
    coverUrl: null,
    verified: true,
    sourceUrl: "https://akter1.ru/contacts.html",
    birthDate: null,
    hint: "Агентство «Актёр 1»",
    initials: "ИС",
    bg: "#3D6D99",
    card: SOYKINA_CARD,
    agencyId: "akter1",
    agencyName: "Актёр 1",
    agencyWebsite: "https://akter1.ru",
    agentName: "Ирина Сойкина",
    agentEmail: "irina@akter1.ru",
    links: [],
    photos: [],
  };
}

export function syntheticGneusheva(): PersonLike {
  return {
    slug: "gneusheva",
    name: "Наталья Гнеушева",
    role: "Агент",
    profession: "agent",
    city: "Москва",
    bio: DEMO_BIOS.gneusheva,
    imageUrl: GNEUSHEVA_IMG,
    coverUrl: null,
    verified: true,
    sourceUrl: "https://castingrus.ru/cv/",
    birthDate: "1977-03-26",
    hint: "Агентство Натальи Гнеушевой",
    initials: "НГ",
    bg: "#6D3D5C",
    card: GNEUSHEVA_CARD,
    agencyId: "castingrus",
    agencyName: "Натальи Гнеушевой",
    agencyWebsite: "https://castingrus.ru",
    agentName: "Наталья Гнеушева",
    agentEmail: "aktkast@mail.ru",
    links: GNEUSHEVA_LINKS.map((l) => ({
      id: `gneusheva-${l.kind}`,
      personSlug: "gneusheva",
      kind: l.kind,
      url: l.url,
    })),
    photos: [],
  };
}

export function applyDemoPerson<T extends PersonLike>(person: T): T {
  if (person.slug === "vzmetnev") {
    const bio = person.bio && !/агентств|MS Talents|Кеворков/i.test(person.bio) ? person.bio : DEMO_BIOS.vzmetnev;
    return {
      ...person,
      bio,
      agencyId: null,
      agencyName: null,
      agencyWebsite: null,
      agentName: null,
      agentEmail: null,
      card: VZMETNEV_CARD,
    };
  }
  if (person.slug === "kevorkova") {
    const links = person.links?.length
      ? person.links
      : KEVORKOVA_LINKS.map((l) => ({
          id: `kevorkova-${l.kind}`,
          personSlug: "kevorkova",
          kind: l.kind,
          url: l.url,
        }));
    return {
      ...person,
      name: "Анна Кеворкова",
      role: "Кастинг-директор",
      profession: "casting",
      city: "Москва",
      bio: DEMO_BIOS.kevorkova,
      imageUrl: KEVORKOVA_IMG,
      verified: true,
      sourceUrl: "https://www.kino-teatr.ru/kino/casting/ros/467639/works/",
      birthDate: person.birthDate || "1981-12-07",
      hint: "«Союз Спасения» · «Майор Гром»",
      initials: "АК",
      card: KEVORKOVA_CARD,
      agencyId: null,
      agencyName: null,
      agencyWebsite: null,
      agentName: null,
      agentEmail: null,
      links,
    };
  }
  if (person.slug === "soykina") {
    return {
      ...person,
      name: "Ирина Сойкина",
      role: "Агент",
      profession: "agent",
      bio: person.bio || DEMO_BIOS.soykina,
      card: person.card || SOYKINA_CARD,
      agencyId: person.agencyId || "akter1",
      agencyName: person.agencyName || "Актёр 1",
      agencyWebsite: person.agencyWebsite || "https://akter1.ru",
      agentEmail: person.agentEmail || "irina@akter1.ru",
      initials: person.initials || "ИС",
      bg: person.bg || "#3D6D99",
    };
  }
  if (person.slug === "gneusheva") {
    const links = person.links?.length
      ? person.links
      : GNEUSHEVA_LINKS.map((l) => ({
          id: `gneusheva-${l.kind}`,
          personSlug: "gneusheva",
          kind: l.kind,
          url: l.url,
        }));
    return {
      ...person,
      name: "Наталья Гнеушева",
      role: "Агент",
      profession: "agent",
      city: "Москва",
      bio: DEMO_BIOS.gneusheva,
      imageUrl: person.imageUrl || GNEUSHEVA_IMG,
      verified: true,
      sourceUrl: person.sourceUrl || "https://castingrus.ru/cv/",
      birthDate: person.birthDate || "1977-03-26",
      hint: "Агентство Натальи Гнеушевой",
      initials: "НГ",
      bg: person.bg || "#6D3D5C",
      card: GNEUSHEVA_CARD,
      agencyId: person.agencyId || "castingrus",
      agencyName: person.agencyName || "Натальи Гнеушевой",
      agencyWebsite: person.agencyWebsite || "https://castingrus.ru",
      agentName: person.agentName || "Наталья Гнеушева",
      agentEmail: person.agentEmail || "aktkast@mail.ru",
      links,
    };
  }
  const extra = INDUSTRY[person.slug];
  if (extra) {
    return {
      ...person,
      name: extra.name,
      role: extra.role,
      profession: extra.profession,
      city: extra.city,
      bio: extra.bio,
      verified: true,
      sourceUrl: extra.sourceUrl,
      hint: extra.hint,
      initials: extra.initials,
      bg: extra.bg,
      card: extra.card,
      agencyId: extra.agencyId,
      agencyName: extra.agencyName,
      agencyWebsite: extra.agencyWebsite,
      agentEmail: extra.agentEmail,
    };
  }
  return person;
}

export function syntheticIndustry(slug: string): PersonLike | null {
  if (slug === "soykina") return syntheticSoykina();
  if (slug === "gneusheva") return syntheticGneusheva();
  const extra = INDUSTRY[slug];
  if (!extra) return null;
  return {
    slug: extra.slug,
    name: extra.name,
    role: extra.role,
    profession: extra.profession,
    city: extra.city,
    bio: extra.bio,
    imageUrl: extra.imageUrl,
    coverUrl: null,
    verified: true,
    sourceUrl: extra.sourceUrl,
    birthDate: null,
    hint: extra.hint,
    initials: extra.initials,
    bg: extra.bg,
    card: extra.card,
    agencyId: extra.agencyId,
    agencyName: extra.agencyName,
    agencyWebsite: extra.agencyWebsite,
    agentName: extra.profession === "agent" ? extra.name : null,
    agentEmail: extra.agentEmail,
    links: extra.agencyWebsite
      ? [{ id: `${extra.slug}-site`, personSlug: extra.slug, kind: "site", url: extra.agencyWebsite }]
      : extra.sourceUrl
        ? [{ id: `${extra.slug}-source`, personSlug: extra.slug, kind: "site", url: extra.sourceUrl }]
        : [],
    photos: [],
  };
}
