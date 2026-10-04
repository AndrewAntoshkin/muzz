/**
 * Cloudflare Turnstile. Включается, когда заданы `TURNSTILE_SECRET_KEY` (сервер)
 * и `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (виджет на странице регистрации).
 * Без ключей проверка пропускается — удобно для локальной разработки.
 */
export function captchaRequired() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyCaptcha(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const form = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") form.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("captcha verify failed", err);
    return false;
  }
}
