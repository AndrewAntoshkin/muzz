import { NextResponse } from "next/server";
import { ensureDemoUser, findUserByLogin } from "@/lib/accounts";
import { DEMO_LOGIN, setSessionCookie, toSessionUser } from "@/lib/auth";

export async function POST() {
  try {
    let row = await findUserByLogin(DEMO_LOGIN);
    if (!row) row = await ensureDemoUser();
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
