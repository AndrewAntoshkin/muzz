import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const forbidden = (message = "Недостаточно прав") => new HttpError(403, message);
export const notFound = (message = "Не найдено") => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);

/** Единая обёртка: ловит HttpError и отдаёт `{ error }` с нужным кодом, всё остальное — 500 без утечки деталей. */
export async function respond<T>(fn: () => Promise<T>, init?: { status?: number }) {
  try {
    const data = await fn();
    return NextResponse.json(data ?? { ok: true }, { status: init?.status ?? 200, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message, ...(err.extra ?? {}) }, { status: err.status });
    }
    console.error("[workspace]", err);
    return NextResponse.json({ error: "Что-то пошло не так. Попробуйте ещё раз." }, { status: 500 });
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    /* fall through */
  }
  throw badRequest("Некорректный запрос");
}
