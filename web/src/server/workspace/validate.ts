import { isIsoDate } from "@/lib/deadline";
import { badRequest } from "./http";

type StrOpts = { min?: number; max?: number; label: string; trim?: boolean };

/** Обязательная строка. */
export function reqStr(value: unknown, { min = 1, max = 500, label, trim = true }: StrOpts) {
  if (typeof value !== "string") throw badRequest(`${label}: нужна строка`);
  const v = trim ? value.trim() : value;
  if (v.length < min) throw badRequest(min <= 1 ? `${label}: заполните поле` : `${label}: минимум ${min} симв.`);
  if (v.length > max) throw badRequest(`${label}: слишком длинно (максимум ${max})`);
  return v;
}

/** Необязательная строка: undefined — «не менять», пустая строка допустима. */
export function optStr(value: unknown, opts: Omit<StrOpts, "min">) {
  if (value === undefined) return undefined;
  return reqStr(value, { ...opts, min: 0 });
}

export function optBool(value: unknown, label: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") throw badRequest(`${label}: нужно true/false`);
  return value;
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw badRequest(`${label}: недопустимое значение`);
  }
  return value as T;
}

export function optOneOf<T extends string>(value: unknown, allowed: readonly T[], label: string): T | undefined {
  return value === undefined ? undefined : oneOf(value, allowed, label);
}

/** Дата YYYY-MM-DD или null (сбросить срок). undefined — не менять. */
export function optDate(value: unknown, label: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (!isIsoDate(value)) throw badRequest(`${label}: неверная дата`);
  return value;
}

export function optNumber(value: unknown, label: string, min: number, max: number) {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) throw badRequest(`${label}: нужно число`);
  return Math.min(max, Math.max(min, value));
}

/** Слаг: латиница/кириллица/цифры/дефис. Защищает от мусора в URL и SQL-шаблонах. */
export function reqSlug(value: unknown, label = "slug") {
  const v = reqStr(value, { label, max: 120 });
  if (!/^[a-z0-9а-яё][a-z0-9а-яё-]*$/i.test(v)) throw badRequest(`${label}: недопустимые символы`);
  return v;
}

const SAVED_KEY = /^(casting|project|person):[a-z0-9а-яё][a-z0-9а-яё-]{0,119}$/i;
export function reqSavedKey(value: unknown) {
  const v = reqStr(value, { label: "key", max: 140 });
  if (!SAVED_KEY.test(v)) throw badRequest("key: неверный формат");
  return v;
}

/** Только http(s)- и относительные URL: ни data:, ни javascript:. */
export function optUrl(value: unknown, label: string) {
  if (value === undefined) return undefined;
  const v = reqStr(value, { label, min: 0, max: 2000 });
  if (!v) return "";
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  if (/^https?:\/\//i.test(v)) return v;
  throw badRequest(`${label}: неверная ссылка`);
}
