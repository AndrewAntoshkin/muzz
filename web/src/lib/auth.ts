import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  createSessionToken,
  readSessionToken,
  toSessionUser,
  type SessionUser,
} from "./session";

export { SESSION_COOKIE, toSessionUser, type SessionUser };

export const DEMO_LOGIN = "andrew";
export const DEMO_PASSWORD = "CadrShow26";

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
