import { NextResponse } from "next/server";
import { parseAccess, isAdmin } from "@/lib/access";
import { updateUserAsAdmin } from "@/lib/accounts";
import { getSession } from "@/lib/auth";
import { parseRole } from "@/lib/roles";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = (await req.json()) as { access?: string; role?: string };
  const access = body.access ? parseAccess(body.access) : undefined;
  const role = body.role ? parseRole(body.role) : undefined;
  if (!access && !role) {
    return NextResponse.json({ error: "Нечего менять" }, { status: 400 });
  }
  if (id === me.id && access === "user") {
    return NextResponse.json({ error: "Нельзя снять с себя админа" }, { status: 400 });
  }

  const row = await updateUserAsAdmin(id, { access, role });
  if (!row) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  return NextResponse.json({
    user: {
      id: row.id,
      login: row.login,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      access: row.access,
      isDemo: row.isDemo,
      personSlug: row.personSlug,
    },
  });
}
