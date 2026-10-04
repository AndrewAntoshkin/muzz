export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

/** JSON-запрос к нашему API. Бросает ApiError с человеческим сообщением (status 0 — нет сети). */
export async function apiFetch<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: "include",
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Нет соединения с сервером. Проверьте интернет и повторите.");
  }
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    /* пустой или не-JSON ответ */
  }
  if (!res.ok) {
    const message =
      typeof data.error === "string" && data.error
        ? data.error
        : res.status === 401
          ? "Сессия истекла. Войдите снова."
          : "Не удалось выполнить действие. Попробуйте ещё раз.";
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}
