import { SignJWT, jwtVerify } from "jose";
import type { RoleId } from "./roles";

export const SESSION_COOKIE = "kadr_session";

export type SessionUser = {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  name: string;
  role: RoleId;
  isDemo: boolean;
  personSlug: string | null;
};

function authSecret() {
  const secret = process.env.AUTH_SECRET || process.env.DATABASE_URL || "kadr-dev-secret-change-me";
  return new TextEncoder().encode(secret.slice(0, 64).padEnd(32, "0"));
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    id: user.id,
    login: user.login,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    role: user.role,
    isDemo: user.isDemo,
    personSlug: user.personSlug,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(authSecret());
}

export async function readSessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret());
    const role = payload.role === "casting" || payload.role === "agent" ? payload.role : "actor";
    if (typeof payload.id !== "string" || typeof payload.login !== "string") return null;
    return {
      id: payload.id,
      login: payload.login,
      firstName: String(payload.firstName ?? ""),
      lastName: String(payload.lastName ?? ""),
      name: String(payload.name ?? ""),
      role,
      isDemo: Boolean(payload.isDemo),
      personSlug: typeof payload.personSlug === "string" ? payload.personSlug : null,
    };
  } catch {
    return null;
  }
}

export function toSessionUser(row: {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  role: RoleId;
  isDemo: boolean;
  personSlug: string | null;
}): SessionUser {
  return {
    id: row.id,
    login: row.login,
    firstName: row.firstName,
    lastName: row.lastName,
    name: `${row.firstName} ${row.lastName}`.trim(),
    role: row.role,
    isDemo: row.isDemo,
    personSlug: row.personSlug,
  };
}
