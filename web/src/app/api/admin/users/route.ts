import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/access";
import { listUsersForAdmin } from "@/lib/accounts";
import { getSession } from "@/lib/auth";

export async function GET() {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await listUsersForAdmin();
  return NextResponse.json({
    users: users.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}
