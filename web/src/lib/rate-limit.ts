import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";

type Limit = {
  /** Имя корзины, например `login:ip`. */
  bucket: string;
  /** Кого считаем: IP или id пользователя. */
  id: string;
  max: number;
  windowSec: number;
};

export function clientIp(req: Request) {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return "unknown";
}

/**
 * Фиксированное окно в Postgres: работает между инстансами serverless без Redis.
 * При сбое базы пропускает запрос (лучше без лимита, чем полностью лечь).
 */
export async function hitLimit({ bucket, id, max, windowSec }: Limit) {
  const key = `${bucket}:${id}`;
  try {
    const rows = (await db.execute(sql`
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES (${key}, 1, now() + (${windowSec} * interval '1 second'))
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
        reset_at = CASE WHEN rate_limits.reset_at < now() THEN excluded.reset_at ELSE rate_limits.reset_at END
      RETURNING count, EXTRACT(EPOCH FROM (reset_at - now()))::int AS retry_after
    `)) as unknown as { count: number; retry_after: number }[];
    const row = rows[0];
    if (!row) return { ok: true as const };
    if (Number(row.count) > max) {
      return { ok: false as const, retryAfter: Math.max(Number(row.retry_after), 1) };
    }
    return { ok: true as const };
  } catch (err) {
    console.error("rate-limit failed open", err);
    return { ok: true as const };
  }
}

/** Возвращает 429, если лимит превышен, иначе `null`. */
export async function limitOr429(limit: Limit) {
  const res = await hitLimit(limit);
  if (res.ok) return null;
  return NextResponse.json(
    { error: "Слишком много попыток. Подождите немного и повторите." },
    { status: 429, headers: { "Retry-After": String(res.retryAfter) } },
  );
}
