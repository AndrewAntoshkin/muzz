import { sql, type SQL } from "drizzle-orm";
import { people } from "@/db/schema";

/** Максимум слов в запросе и длина запроса — защита от тяжёлых паттернов. */
const MAX_TOKENS = 6;
const MAX_QUERY_LENGTH = 80;

/**
 * Приводит текст к виду, в котором мы его сравниваем: нижний регистр, «ё» → «е».
 * Должно совпадать с SQL-функцией `kadr_norm` (миграция 0007).
 */
export function normalizeSearchText(input: string) {
  return input.toLowerCase().replace(/ё/g, "е");
}

/** Экранирует метасимволы LIKE (`\`, `%`, `_`), чтобы запрос «%» или «_» искал символ, а не «всех». */
export function escapeLike(input: string) {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/** Слова запроса: порядок не важен, каждое слово должно встретиться где-то в карточке. */
export function searchTokens(q: string | undefined | null): string[] {
  if (!q) return [];
  const tokens = normalizeSearchText(q.trim().slice(0, MAX_QUERY_LENGTH))
    .split(/\s+/)
    .filter(Boolean);
  return Array.from(new Set(tokens)).slice(0, MAX_TOKENS);
}

/**
 * Выражение поиска по карточке: имя, роль, город, подпись. Должно дословно совпадать с индексом
 * `people_search_norm_trgm_idx` (миграция 0007), иначе Postgres уйдёт в полный перебор 22 тыс. строк.
 */
const NORMALIZED_CARD = sql`kadr_norm(${people.name} || ' ' || ${people.role} || ' ' || coalesce(${people.city}, '') || ' ' || coalesce(${people.hint}, ''))`;

/** Условие `AND` по всем словам запроса; `undefined`, если искать нечего. */
export function searchCondition(q: string | undefined | null): SQL | undefined {
  const tokens = searchTokens(q);
  if (!tokens.length) return undefined;
  const parts = tokens.map((t) => sql`${NORMALIZED_CARD} like ${`%${escapeLike(t)}%`}`);
  return parts.length === 1 ? parts[0] : sql.join(parts, sql` and `);
}
