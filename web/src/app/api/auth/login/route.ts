import { NextResponse } from "next/server";
import { findUserByLogin } from "@/lib/accounts";
import { setSessionCookie, toSessionUser, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { login?: string; password?: string };
    const login = (body.login || "").trim().toLowerCase();
    const password = body.password || "";
    if (!login || !password) {
      return NextResponse.json({ error: "Укажите логин и пароль" }, { status: 400 });
    }
    const row = await findUserByLogin(login);
    if (!row || !(await verifyPassword(password, row.passwordHash))) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }
    const user = toSessionUser(row);
    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка входа";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
