import { and, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import type { Casting, Project } from "@/lib/productions";
import type { ActorPulse, Availability, FeedPost, ShortlistPerson, WorkspaceSettings, WorkspaceState } from "@/lib/workspace";
import { seedThreads } from "@/server/demo-seed/workspace-data";
import { T, lookupPeople, visibleCasting, visibleProject } from "./common";
import { rowToApplication, rowToCasting, rowToLayout, rowToPin, rowToProject } from "./mappers";
import type { Viewer } from "./viewer";

const FEED_LIMIT = 50;
const CATALOG_LIMIT = 1000;

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  notifyEmail: true,
  notifyPush: false,
  plan: "pro",
  rehearsalsUsed: 0,
  rehearsalsMonth: "",
};

export async function buildSnapshot(v: Viewer): Promise<WorkspaceState> {
  const now = new Date();

  const [projectRows, castingRows, counts, applicationRows, pinRows, layoutRows, shortlistRows, postRows, pulseRows, savedRows, settingsRows, patchRows] =
    await Promise.all([
      db.select().from(T.projects).where(visibleProject(v)).orderBy(desc(T.projects.createdAt)).limit(CATALOG_LIMIT),
      db.select().from(T.castings).where(visibleCasting(v)).orderBy(desc(T.castings.createdAt)).limit(CATALOG_LIMIT),
      db
        .select({ castingId: T.applications.castingId, n: sql<number>`count(*)::int` })
        .from(T.applications)
        // Приглашения от кастинг-директора — не отклики: в счётчик попадают только заявки актёров и предложения агентов.
        .where(and(eq(T.applications.isDemo, v.demo), ne(T.applications.source, "casting")))
        .groupBy(T.applications.castingId),
      db
        .select()
        .from(T.applications)
        .where(
          and(
            eq(T.applications.isDemo, v.demo),
            or(
              eq(T.applications.actorSlug, v.slug),
              eq(T.applications.submittedBySlug, v.slug),
              inArray(
                T.applications.castingId,
                db.select({ id: T.castings.id }).from(T.castings).where(eq(T.castings.ownerSlug, v.slug)),
              ),
            ),
          ),
        )
        .orderBy(desc(T.applications.createdAt)),
      db.select().from(T.castingPins).where(eq(T.castingPins.ownerSlug, v.slug)),
      db
        .select({ layout: T.roleLayouts })
        .from(T.roleLayouts)
        .innerJoin(T.projects, eq(T.projects.id, T.roleLayouts.projectId))
        .where(and(eq(T.projects.ownerSlug, v.slug), isNull(T.projects.archivedAt))),
      db.select().from(T.personShortlist).where(eq(T.personShortlist.ownerSlug, v.slug)).orderBy(desc(T.personShortlist.createdAt)),
      db.select().from(T.feedPosts).where(eq(T.feedPosts.isDemo, v.demo)).orderBy(desc(T.feedPosts.createdAt)).limit(FEED_LIMIT),
      db.select().from(T.actorPulses).where(eq(T.actorPulses.isDemo, v.demo)).orderBy(desc(T.actorPulses.updatedAt)),
      db.select().from(T.savedItems).where(eq(T.savedItems.ownerSlug, v.slug)).orderBy(desc(T.savedItems.createdAt)),
      db.select().from(T.userSettings).where(eq(T.userSettings.ownerSlug, v.slug)).limit(1),
      // Оверлей правок профиля нужен только демо-персонам; у реальных профиль и так читается из people.
      v.demo ? db.select().from(T.profilePatches) : Promise.resolve([] as (typeof T.profilePatches.$inferSelect)[]),
    ]);

  const projectSlugById = new Map(projectRows.map((p) => [p.id, p.slug]));
  const castingSlugById = new Map(castingRows.map((c) => [c.id, c.slug]));
  const responses = new Map(counts.map((c) => [c.castingId, c.n]));

  const people = await lookupPeople([
    ...projectRows.map((p) => p.ownerSlug),
    ...castingRows.map((c) => c.ownerSlug),
    ...applicationRows.map((a) => a.actorSlug),
    ...pinRows.map((p) => p.actorSlug),
    ...shortlistRows.map((s) => s.personSlug),
    ...postRows.map((p) => p.authorSlug),
    ...pulseRows.map((p) => p.personSlug),
    v.slug,
  ]);

  const projects: Project[] = projectRows.map((r) => rowToProject(r, people.get(r.ownerSlug)?.name));

  const castings: Casting[] = castingRows
    .map((r) => {
      const projectSlug = projectSlugById.get(r.projectId);
      return projectSlug ? rowToCasting(r, projectSlug, responses.get(r.id) ?? 0, people.get(r.ownerSlug)?.name, now) : null;
    })
    .filter((c): c is Casting => c !== null);

  const applications = applicationRows
    .map((r) => {
      const castingSlug = castingSlugById.get(r.castingId);
      return castingSlug ? rowToApplication(r, castingSlug, people.get(r.actorSlug)) : null;
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  const boards = pinRows
    .map((r) => {
      const projectSlug = projectSlugById.get(r.projectId);
      return projectSlug ? rowToPin(r, projectSlug, people.get(r.actorSlug)) : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const roleLayout = layoutRows
    .map(({ layout }) => {
      const projectSlug = projectSlugById.get(layout.projectId);
      const castingSlug = castingSlugById.get(layout.castingId);
      return projectSlug && castingSlug ? rowToLayout(layout, projectSlug, castingSlug) : null;
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const shortlist: ShortlistPerson[] = shortlistRows.map((r) => {
    const p = people.get(r.personSlug);
    return { slug: r.personSlug, name: p?.name ?? r.personSlug, photo: p?.avatar ?? "", meta: p?.meta };
  });

  const posts: FeedPost[] = postRows.map((r) => {
    const a = people.get(r.authorSlug);
    return {
      id: r.id,
      authorRole: r.authorRole as FeedPost["authorRole"],
      authorName: a?.name ?? "Участник",
      authorAvatar: a?.avatar ?? "",
      text: r.text,
      createdAt: r.createdAt.getTime(),
    };
  });

  const pulses: ActorPulse[] = pulseRows.map((r) => {
    const a = people.get(r.personSlug);
    return {
      id: `pulse-${r.personSlug}`,
      personSlug: r.personSlug,
      name: a?.name ?? "Участник",
      avatar: a?.avatar ?? "",
      text: r.text,
      availability: r.availability as Availability,
      updatedAt: r.updatedAt.getTime(),
    };
  });

  const s = settingsRows[0];
  const settings: WorkspaceSettings = s
    ? {
        notifyEmail: s.notifyEmail,
        notifyPush: s.notifyPush,
        plan: s.plan as WorkspaceSettings["plan"],
        rehearsalsUsed: s.rehearsalsUsed,
        rehearsalsMonth: s.rehearsalsMonth,
      }
    : DEFAULT_SETTINGS;

  return {
    me: { slug: v.slug, role: v.role, demo: v.demo },
    inboxSeenAt: s?.inboxSeenAt?.getTime() ?? 0,
    projects,
    castings,
    applications,
    posts,
    // Демо-переписка эфемерна (живёт только в памяти вкладки); настоящий чат — /api/chat.
    threads: v.demo ? seedThreads() : [],
    saved: savedRows.map((r) => r.key),
    settings,
    pulses,
    profilePatches: Object.fromEntries(patchRows.map((r) => [r.personSlug, r.patch])),
    boards,
    shortlist,
    roleLayout,
  };
}
