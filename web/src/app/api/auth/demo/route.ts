import { NextResponse } from "next/server";
import { ensureDemoUser } from "@/lib/accounts";
import { setSessionCookie, toSessionUser } from "@/lib/auth";

export async function POST() {
  try {
    const row = await ensureDemoUser();
    if (!row) {
      return NextResponse.json({ error: "Не удалось создать демо" }, { status: 500 });
    }
    const user = toSessionUser(row);
    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка демо-входа";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
