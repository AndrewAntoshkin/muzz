import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { todayMsk } from "@/lib/deadline";
import { personaSlug } from "@/server/workspace/viewer";
import { castingDetails, projectDetails } from "@/server/workspace/mappers";
import { CASTINGS, PROJECTS } from "./productions-data";
import { seedState } from "./workspace-data";

const T = schema;

const MONTHS: Record<string, number> = {
  января: 1, февраля: 2, марта: 3, апреля: 4, мая: 5, июня: 6, июля: 7, августа: 8, сентября: 9, октября: 10, ноября: 11, декабря: 12,
};

/**
 * «20 июня» → ближайшая такая дата, не раньше сегодняшнего дня. Демо всегда остаётся «живым»:
 * срок автозакрытия не истекает вместе с календарём, а подпись дедлайна считается от даты.
 */
function nextOccurrence(label: string, now = new Date()) {
  const m = /^\s*(\d{1,2})\s+([а-я]+)/i.exec(label);
  const month = m ? MONTHS[m[2].toLowerCase()] : undefined;
  if (!m || !month) return null;
  const today = todayMsk(now);
  const year = Number(today.slice(0, 4));
  const pad = (n: number) => String(n).padStart(2, "0");
  const thisYear = `${year}-${pad(month)}-${pad(Number(m[1]))}`;
  return thisYear >= today ? thisYear : `${year + 1}-${pad(month)}-${pad(Number(m[1]))}`;
}

export const DEMO_PERSONAS = () => [personaSlug("actor"), personaSlug("casting"), personaSlug("agent")];

export async function resetDemoWorkspace() {
  const seed = seedState();
  const casting = personaSlug("casting");
  const agent = personaSlug("agent");
  const actor = personaSlug("actor");
  const personas = DEMO_PERSONAS();

  await db.transaction(async (tx) => {
    // projects → castings → applications / pins / layouts уходят каскадом
    await tx.delete(T.projects).where(eq(T.projects.isDemo, true));
    await tx.delete(T.feedPosts).where(eq(T.feedPosts.isDemo, true));
    await tx.delete(T.actorPulses).where(eq(T.actorPulses.isDemo, true));
    await tx.delete(T.personShortlist).where(inArray(T.personShortlist.ownerSlug, personas));
    await tx.delete(T.savedItems).where(inArray(T.savedItems.ownerSlug, personas));
    await tx.delete(T.userSettings).where(inArray(T.userSettings.ownerSlug, personas));
    await tx.delete(T.profilePatches);

    const base = Date.parse("2026-05-01T09:00:00Z");
    const projectIds = new Map<string, string>();
    for (const [i, p] of PROJECTS.entries()) {
      const id = `prj-${p.slug}`;
      projectIds.set(p.slug, id);
      await tx.insert(T.projects).values({
        id,
        slug: p.slug,
        ownerSlug: p.cdSlug || casting,
        title: p.title,
        studio: p.studio,
        platform: p.platform,
        kind: p.kind,
        status: p.status,
        city: p.city,
        cover: p.cover,
        logline: p.logline,
        text: p.text,
        details: projectDetails(p),
        isDemo: true,
        createdAt: new Date(base - i * 60_000),
        updatedAt: new Date(base - i * 60_000),
      });
    }

    const castingIds = new Map<string, string>();
    for (const [i, c] of CASTINGS.entries()) {
      const projectId = projectIds.get(c.projectSlug);
      if (!projectId) continue;
      const id = `cst-${c.slug}`;
      castingIds.set(c.slug, id);
      const closed = c.deadline === "закрыт";
      const deadlineOn = closed ? null : nextOccurrence(c.deadline);
      await tx.insert(T.castings).values({
        id,
        slug: c.slug,
        projectId,
        ownerSlug: c.cdSlug || casting,
        title: c.title,
        roleLabel: c.roleLabel,
        text: c.text,
        meta: c.meta,
        deadlineOn,
        deadlineText: deadlineOn ? "" : c.deadline,
        status: closed ? "closed" : "open",
        urgent: Boolean(c.urgent),
        media: c.media,
        facts: c.facts,
        details: { ...castingDetails(c), responsesBase: c.responses },
        isDemo: true,
        createdAt: new Date(base - i * 60_000),
        updatedAt: new Date(base - i * 60_000),
      });
    }

    for (const a of seed.applications) {
      const castingId = castingIds.get(a.castingSlug);
      if (!castingId) continue;
      await tx.insert(T.applications).values({
        id: `app-${a.id}`,
        castingId,
        actorSlug: a.actorSlug,
        submittedBySlug: a.source === "agent" ? agent : a.source === "casting" ? casting : a.actorSlug,
        source: a.source,
        kind: a.kind,
        note: a.note,
        status: a.status,
        matchLabel: a.match ?? null,
        tape: a.tape ?? null,
        isDemo: true,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.createdAt),
      });
    }

    for (const pin of seed.boards) {
      const projectId = projectIds.get(pin.projectSlug);
      if (!projectId) continue;
      await tx.insert(T.castingPins).values({
        id: `pin-${pin.id}`,
        projectId,
        ownerSlug: casting,
        actorSlug: pin.actorSlug,
        character: pin.character,
        rotation: pin.rotation,
        x: pin.x ?? null,
        y: pin.y ?? null,
        chosen: Boolean(pin.chosen),
      }).onConflictDoNothing();
    }

    for (const l of seed.roleLayout) {
      const projectId = projectIds.get(l.projectSlug);
      const castingId = castingIds.get(l.castingSlug);
      if (projectId && castingId) await tx.insert(T.roleLayouts).values({ projectId, castingId, x: l.x, y: l.y }).onConflictDoNothing();
    }

    for (const person of seed.shortlist) {
      await tx.insert(T.personShortlist).values({ ownerSlug: casting, personSlug: person.slug }).onConflictDoNothing();
    }

    for (const key of seed.saved) {
      await tx.insert(T.savedItems).values({ ownerSlug: actor, key }).onConflictDoNothing();
    }

    for (const pulse of seed.pulses) {
      await tx
        .insert(T.actorPulses)
        .values({ personSlug: pulse.personSlug, text: pulse.text, availability: pulse.availability, isDemo: true, updatedAt: new Date(pulse.updatedAt) })
        .onConflictDoUpdate({
          target: T.actorPulses.personSlug,
          set: { text: pulse.text, availability: pulse.availability, isDemo: true, updatedAt: new Date(pulse.updatedAt) },
        });
    }
  });

  return { projects: PROJECTS.length, castings: CASTINGS.length, applications: seed.applications.length };
}
