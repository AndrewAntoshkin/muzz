import { eq } from "drizzle-orm";
import { db } from "@/db";
import { people } from "@/db/schema";
import { canSwitchKind } from "@/lib/access";
import { getSession } from "@/lib/auth";

/**
 * Агентство, чей ростер показываем текущему пользователю.
 * Демо — витринное агентство; настоящий агент — его собственное; без агентства ростера нет.
 */
export async function viewerAgencyId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.isDemo || canSwitchKind(session)) return "akter1";
  if (!session.personSlug) return null;
  const [row] = await db.select({ agencyId: people.agencyId }).from(people).where(eq(people.slug, session.personSlug)).limit(1);
  return row?.agencyId ?? null;
}
