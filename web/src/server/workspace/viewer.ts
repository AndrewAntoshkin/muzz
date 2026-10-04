import { getSession } from "@/lib/auth";
import { canSwitchKind, isAdmin } from "@/lib/access";
import { DEMO_ROLES, parseRole, type RoleId } from "@/lib/roles";
import { HttpError, forbidden } from "./http";

/**
 * Эффективная личность в рабочем пространстве.
 * - Обычный пользователь: его собственная анкета, демо-данных он не видит.
 * - Демо-пользователь/админ: демо-персона выбранной роли и только демо-данные.
 */
export type Viewer = {
  userId: string;
  slug: string;
  role: RoleId;
  demo: boolean;
  admin: boolean;
};

export const VIEW_AS_HEADER = "x-kadr-as";

export function personaSlug(role: RoleId) {
  return DEMO_ROLES[role].profile.replace(/^\/people\//, "");
}

export async function requireViewer(req: Request): Promise<Viewer> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Нужно войти");

  const demo = session.isDemo || canSwitchKind(session);
  if (demo) {
    const asRole = canSwitchKind(session) ? parseRole(req.headers.get(VIEW_AS_HEADER)) : session.role;
    return { userId: session.id, slug: personaSlug(asRole), role: asRole, demo: true, admin: isAdmin(session) };
  }
  if (!session.personSlug) throw forbidden("У аккаунта нет анкеты");
  return { userId: session.id, slug: session.personSlug, role: session.role, demo: false, admin: false };
}

export async function requireAdmin(req: Request) {
  const viewer = await requireViewer(req);
  if (!viewer.admin) throw forbidden();
  return viewer;
}
