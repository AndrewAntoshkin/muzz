import { NextResponse } from "next/server";
import { registerUser } from "@/lib/accounts";
import { setSessionCookie } from "@/lib/auth";
import { verifyCaptcha } from "@/lib/captcha";
import { registrationEnabled } from "@/lib/env";
import { generatePassword } from "@/lib/identity";
import { clientIp, limitOr429 } from "@/lib/rate-limit";
import { parseRole } from "@/lib/roles";

export async function POST(req: Request) {
  if (!registrationEnabled()) {
    return NextResponse.json({ error: "Регистрация временно закрыта" }, { status: 503 });
  }
  const ip = clientIp(req);
  const limited =
    (await limitOr429({ bucket: "register:ip:10m", id: ip, max: 5, windowSec: 600 })) ??
    (await limitOr429({ bucket: "register:ip:day", id: ip, max: 30, windowSec: 86400 }));
  if (limited) return limited;

  try {
    const body = (await req.json()) as {
      firstName?: string;
      lastName?: string;
      role?: string;
      captcha?: string;
      /** Honeypot: человек это поле не видит и не заполняет. */
      website?: string;
    };
    if (body.website) {
      // Бот: ничего не создаём и не объясняем, почему.
      return NextResponse.json({ error: "Не удалось зарегистрироваться" }, { status: 400 });
    }
    if (!(await verifyCaptcha(body.captcha, ip))) {
      return NextResponse.json({ error: "Подтвердите, что вы не робот" }, { status: 400 });
    }
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const role = parseRole(body.role);
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Укажите имя и фамилию" }, { status: 400 });
    }
    const password = generatePassword();
    const created = await registerUser({ firstName, lastName, role, password });
    await setSessionCookie(created.user);
    return NextResponse.json({
      user: created.user,
      login: created.login,
      password: created.password,
    });
  } catch (err) {
    console.error("register failed", err);
    const message = err instanceof Error ? err.message : "";
    const known = ["Укажите имя", "Слишком длинное", "Некорректная роль", "Не удалось создать логин"];
    if (known.some((k) => message.startsWith(k))) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Ошибка регистрации. Попробуйте ещё раз." }, { status: 500 });
  }
}
