import { AGENCY_PAGES } from "./agencies";
import { isAdmin } from "./access";
import { asCard, ageYears, type CastingRow, type ClientRow, type Credit, type KvPair, type Schedule, type Showreel } from "./person-card";
import type { PersonProfile } from "./people";
import type { SessionUser } from "./session";

/**
 * Public DTO of a profile.
 *
 * /people/<slug> is a server component that hands data to a client component, so
 * EVERYTHING we pass ends up in the HTML and the RSC stream, i.e. it can be bulk
 * scraped by any logged-in account (sign-up is open). `toPublicProfile` is the single
 * place that decides what leaves the server: only what ProfileView actually renders.
 *
 * Deliberately NOT sent: birth date (only `age`), sourceUrl, agentEmail, coverUrl,
 * hint, verified, scraped `instagram` card field, manager e-mail/phone, link kinds
 * that the UI does not render, e-mails/phones embedded in free text (bio).
 */

export type PublicLink = { id: string; kind: string; url: string };
export type PublicPhoto = { id: string; url: string };

export type PublicCard = {
  height?: string;
  education?: string;
  heroMeta?: string[];
  params?: KvPair[];
  appearance?: KvPair[];
  languages?: KvPair[];
  skills?: string[];
  credits?: Credit[];
  stats?: { value: string; label: string }[];
  chips?: string[];
  clients?: ClientRow[];
  showreel?: Showreel;
  schedule?: Schedule;
  /** Name and organisation only; the manager's e-mail / phone are never sent. */
  manager?: { name: string; org?: string };
  /** "Контакты" panel of casting directors / agents. Never present on actor profiles. */
  terms?: KvPair[];
  /** "Запросы в работе": own agent profile (and demo / admin sessions) only. */
  castings?: CastingRow[];
};

export type PublicProfile = {
  slug: string;
  name: string;
  role: string;
  profession: string;
  city: string | null;
  bio: string | null;
  imageUrl: string | null;
  initials: string | null;
  bg: string | null;
  /** Computed on the server; the birth date itself is never sent. */
  age: number | null;
  agencyId: string | null;
  agencyName: string | null;
  agencyWebsite: string | null;
  agentName: string | null;
  /** Profile slug of the agency's lead agent (for the "write to agent" chat), if the agency has one. */
  agentSlug: string | null;
  /** Whether an agent contact exists. The address is fetched on click via /api/people/<slug>/agent-contact. */
  hasAgentContact: boolean;
  card: PublicCard;
  links: PublicLink[];
  photos: PublicPhoto[];
};

const EMAIL = "[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}";
const PHONE = "(?:\\+7|\\b8)[\\s\\u00a0-]?\\(?\\d{3}\\)?[\\s\\u00a0-]?\\d{3}[\\s\\u00a0-]?\\d{2}[\\s\\u00a0-]?\\d{2}\\b";
/** optional lead-in ("Телефон:", "почта:", "Связаться с агентом") that only makes sense with the value */
const LEAD = "(?:(?:связаться\\s+с\\s+агентом|тел(?:ефон)?\\.?|почта|e-?mail)\\s*[:–-]?\\s*)?";
const CONTACT_IN_TEXT = new RegExp(`${LEAD}(?:${EMAIL}|${PHONE})`, "gi");

/** Scraped bios sometimes end with "Агент - Имя +7-926-… mail@…": drop the raw contacts. */
export function scrubContacts(text: string | null | undefined): string | null {
  if (!text) return null;
  const cleaned = text
    .replace(CONTACT_IN_TEXT, "")
    .replace(/[ \t\u00a0]{2,}/g, " ")
    .replace(/[\s,;:–—-]+$/g, "")
    .trim();
  return cleaned || null;
}

const CONTACT_PROFESSIONS = new Set(["casting", "agent"]);
const VIDEO_KINDS = new Set(["vimeo", "youtube", "video"]);
const VIDEO_URL = /(?:vimeo\.com|youtube\.com|youtu\.be)\b/i;

function publicCard(person: PersonProfile, canSeeCastings: boolean): PublicCard {
  const card = asCard(person.card);
  const out: PublicCard = {};
  if (card.height) out.height = card.height;
  if (card.education) out.education = card.education;
  if (card.heroMeta?.length) out.heroMeta = card.heroMeta;
  if (card.params?.length) out.params = card.params;
  if (card.appearance?.length) out.appearance = card.appearance;
  if (card.languages?.length) out.languages = card.languages;
  if (card.skills?.length) out.skills = card.skills;
  if (card.credits?.length) out.credits = card.credits;
  if (card.stats?.length) out.stats = card.stats;
  if (card.chips?.length) out.chips = card.chips;
  if (card.clients?.length) out.clients = card.clients;
  if (card.showreel?.poster) {
    const { poster, title, duration, caption, href } = card.showreel;
    out.showreel = { poster, title, duration, caption, href };
  }
  if (card.schedule) out.schedule = card.schedule;
  if (card.manager?.name) out.manager = { name: card.manager.name, org: card.manager.org };
  if (card.terms?.length && CONTACT_PROFESSIONS.has(person.profession)) out.terms = card.terms;
  if (card.castings?.length && canSeeCastings) out.castings = card.castings;
  return out;
}

function publicLinks(person: PersonProfile): PublicLink[] {
  return person.links
    .filter((l) => l.kind === "email" || l.kind === "phone" || VIDEO_KINDS.has(l.kind) || VIDEO_URL.test(l.url))
    .map((l) => ({ id: l.id, kind: l.kind, url: l.url }));
}

export function toPublicProfile(person: PersonProfile, viewer: SessionUser | null): PublicProfile {
  const isSelf = Boolean(viewer?.personSlug) && viewer?.personSlug === person.slug;
  const canSeeCastings = isSelf || Boolean(viewer?.isDemo) || isAdmin(viewer);
  const agentSlug = (person.agencyId && Object.hasOwn(AGENCY_PAGES, person.agencyId) && AGENCY_PAGES[person.agencyId].agentSlug) || null;

  return {
    slug: person.slug,
    name: person.name,
    role: person.role,
    profession: person.profession,
    city: person.city,
    bio: scrubContacts(person.bio),
    imageUrl: person.imageUrl,
    initials: person.initials,
    bg: person.bg,
    age: ageYears(person.birthDate),
    agencyId: person.agencyId,
    agencyName: person.agencyName,
    agencyWebsite: person.agencyWebsite,
    agentName: person.agentName,
    agentSlug,
    hasAgentContact: Boolean(person.agentEmail),
    card: publicCard(person, canSeeCastings),
    links: publicLinks(person),
    photos: person.photos.map((p) => ({ id: p.id, url: p.url })),
  };
}
