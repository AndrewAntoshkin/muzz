import { and, eq, isNull } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { T } from "./common";

/** Лёгкие публичные lookup'ы для metadata и настоящего 404 (без привязки к зрителю). */
export const projectTitle = cache(async (slug: string) => {
  const [row] = await db
    .select({ title: T.projects.title })
    .from(T.projects)
    .where(and(eq(T.projects.slug, slug), isNull(T.projects.archivedAt)))
    .limit(1);
  return row?.title ?? null;
});

export const castingMeta = cache(async (slug: string) => {
  const [row] = await db
    .select({ title: T.castings.title, projectTitle: T.projects.title })
    .from(T.castings)
    .innerJoin(T.projects, eq(T.projects.id, T.castings.projectId))
    .where(and(eq(T.castings.slug, slug), isNull(T.castings.archivedAt), isNull(T.projects.archivedAt)))
    .limit(1);
  return row ?? null;
});
