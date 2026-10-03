export type AccessId = "admin" | "user";

export const ACCESS_SWITCH: [AccessId, string][] = [
  ["admin", "Админ"],
  ["user", "Пользователь"],
];

export function parseAccess(raw: unknown): AccessId {
  return raw === "admin" ? "admin" : "user";
}

export function isAdmin(user: { access?: AccessId | string } | null | undefined) {
  return user?.access === "admin";
}

export function canSwitchKind(user: { access?: AccessId | string } | null | undefined) {
  return isAdmin(user);
}

export function accessLabel(access: AccessId) {
  return access === "admin" ? "Админ" : "Пользователь";
}
