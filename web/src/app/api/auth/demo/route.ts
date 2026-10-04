import { NextResponse } from "next/server";
import { ensureDemoUser, findUserByLogin } from "@/lib/accounts";
import { DEMO_LOGIN, setSessionCookie, toSessionUser } from "@/lib/auth";
import { demoLoginEnabled } from "@/lib/env";

export async function POST() {
  // Демо-вход даёт админа без пароля — в проде только по `ALLOW_DEMO_LOGIN=1`.
  if (!demoLoginEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
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
    console.error("demo login failed", err);
    return NextResponse.json({ error: "Ошибка демо-входа" }, { status: 500 });
  }
}
