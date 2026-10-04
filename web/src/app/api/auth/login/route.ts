import { NextResponse } from "next/server";
import { findUserByLogin } from "@/lib/accounts";
import { setSessionCookie, toSessionUser, verifyPassword } from "@/lib/auth";
import { demoLoginEnabled } from "@/lib/env";
import { clientIp, limitOr429 } from "@/lib/rate-limit";

const BAD = { error: "Неверный логин или пароль" };

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limitedIp = await limitOr429({ bucket: "login:ip", id: ip, max: 40, windowSec: 600 });
  if (limitedIp) return limitedIp;

  try {
    const body = (await req.json()) as { login?: string; password?: string };
    const login = (body.login || "").trim().toLowerCase().slice(0, 80);
    const password = (body.password || "").slice(0, 200);
    if (!login || !password) {
      return NextResponse.json({ error: "Укажите логин и пароль" }, { status: 400 });
    }
    // Перебор пароля к одному логину ограничиваем отдельно, независимо от IP.
    const limitedLogin = await limitOr429({ bucket: "login:user", id: login, max: 10, windowSec: 600 });
    if (limitedLogin) return limitedLogin;

    const row = await findUserByLogin(login);
    if (!row || !(await verifyPassword(password, row.passwordHash))) {
      return NextResponse.json(BAD, { status: 401 });
    }
    // Демо-аккаунты с публичным паролем не пускаем в проде без явного флага.
    if (row.isDemo && !demoLoginEnabled()) {
      return NextResponse.json(BAD, { status: 401 });
    }
    const user = toSessionUser(row);
    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch (err) {
    console.error("login failed", err);
    return NextResponse.json({ error: "Ошибка входа" }, { status: 400 });
  }
}
