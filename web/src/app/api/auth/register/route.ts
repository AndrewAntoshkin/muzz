import { NextResponse } from "next/server";
import { ensureDemoUser, findUserByLogin, registerUser } from "@/lib/accounts";
import {
  DEMO_LOGIN,
  DEMO_PASSWORD,
  setSessionCookie,
  toSessionUser,
  verifyPassword,
} from "@/lib/auth";
import { generatePassword } from "@/lib/identity";
import { parseRole } from "@/lib/roles";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      firstName?: string;
      lastName?: string;
      role?: string;
    };
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
    const message = err instanceof Error ? err.message : "Ошибка регистрации";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
