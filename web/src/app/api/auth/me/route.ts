import { NextResponse } from "next/server";
import { findUserById } from "@/lib/accounts";
import { clearSessionCookie, getSession, setSessionCookie, toSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });
  try {
    const row = await findUserById(session.id);
    if (!row) {
      await clearSessionCookie();
      return NextResponse.json({ user: null }, { status: 401 });
    }
    const user = toSessionUser(row);
    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: session });
  }
}
