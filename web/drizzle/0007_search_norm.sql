CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
-- Нормализация для поиска: нижний регистр и «ё» → «е». IMMUTABLE, чтобы можно было строить индекс.
CREATE OR REPLACE FUNCTION kadr_norm(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT replace(lower($1), 'ё', 'е') $$;
--> statement-breakpoint
-- Должен дословно совпадать с выражением в src/lib/search-query.ts (NORMALIZED_CARD).
CREATE INDEX IF NOT EXISTS "people_search_norm_trgm_idx" ON "people" USING gin (kadr_norm(name || ' ' || role || ' ' || coalesce(city, '') || ' ' || coalesce(hint, '')) gin_trgm_ops);
--> statement-breakpoint
-- Индекс из 0005 строился по ненормализованному выражению и больше не используется запросами.
DROP INDEX IF EXISTS "people_search_trgm_idx";
