const isProd = () => process.env.NODE_ENV === "production";

/**
 * Демо-вход (andrew / публичный пароль) даёт админа без проверки личности.
 * В проде выключен, пока явно не включён `ALLOW_DEMO_LOGIN=1`.
 */
export function demoLoginEnabled() {
  if (process.env.ALLOW_DEMO_LOGIN === "1") return true;
  if (process.env.ALLOW_DEMO_LOGIN === "0") return false;
  return !isProd();
}

/** Ключ подписи сессий. В проде без `AUTH_SECRET` приложение не должно работать. */
export function authSecretValue() {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (isProd()) {
    throw new Error("AUTH_SECRET must be set (16+ chars) in production");
  }
  return secret || "kadr-dev-secret-change-me";
}

/** Аварийный выключатель регистрации: `REGISTRATION_DISABLED=1`. */
export function registrationEnabled() {
  return process.env.REGISTRATION_DISABLED !== "1";
}
