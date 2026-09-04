/** RF + Belarus only. Used when importing and purging people. */

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ukrainian cities — not allowed. Crimea (RF) is intentionally excluded. */
export const UA_CITIES = new Set(
  [
    "киев",
    "київ",
    "харьков",
    "харьків",
    "одесса",
    "одеса",
    "львов",
    "львів",
    "днепр",
    "дніпро",
    "днепропетровск",
    "запорожье",
    "запоріжжя",
    "николаев",
    "миколаїв",
    "херсон",
    "донецк",
    "донецьк",
    "луганск",
    "луганськ",
    "сумы",
    "суми",
    "полтава",
    "чернигов",
    "чернігів",
    "винница",
    "вінниця",
    "житомир",
    "ровно",
    "рівне",
    "тернополь",
    "тернопіль",
    "ужгород",
    "черкассы",
    "черкаси",
    "кропивницкий",
    "кривой рог",
    "мариуполь",
    "ивано-франковск",
    "черновцы",
    "чернівці",
    "белая церковь",
    "каменец-подольский",
    "кременчуг",
    "мелитополь",
    "бердянск",
    "умань",
    "конотоп",
    "каменское",
    "краматорск",
    "славянск",
    "бровары",
    "буча",
    "ирпень",
    "фастов",
    "обухов",
    "борисполь",
    "васильков",
    "никополь",
    "павлоград",
    "алчевск",
    "енакиево",
    "северодонецк",
    "лисичанск",
    "мукачево",
    "коломыя",
    "чернигов",
    "каменец",
    "украинка",
  ].map(norm),
);

/** Cities outside RF and Belarus. */
export const FOREIGN_CITIES = new Set(
  [
    "варшава",
    "берлин",
    "париж",
    "лондон",
    "los angeles",
    "los-angeles",
    "лос-анджелес",
    "нью-йорк",
    "new york",
    "тбилиси",
    "рига",
    "вильнюс",
    "алматы",
    "астана",
    "ташкент",
    "тель-авив",
    "tel aviv",
    "ереван",
    "баку",
    "кишинев",
    "кишинёв",
    "прага",
    "будапешт",
    "стамбул",
    "анкара",
    "дубай",
    "dubai",
    "пекин",
    "beijing",
    "токио",
    "tokyo",
    "сидней",
    "sydney",
    "мельбурн",
    "melbourne",
    "торонто",
    "toronto",
    "монреаль",
    "montreal",
    "чикаго",
    "chicago",
    "майами",
    "miami",
    "барселона",
    "barcelona",
    "мадрид",
    "madrid",
    "рим",
    "rome",
    "милан",
    "milan",
    "вена",
    "vienna",
    "амsterdam",
    "амстердам",
    "хельсинки",
    "helsinki",
    "осло",
    "oslo",
    "копенгаген",
    "copenhagen",
    "стокгольм",
    "stockholm",
    "брюссель",
    "brussels",
    "женева",
    "geneva",
    "цюрих",
    "zurich",
    "san jose",
    "сан-хосе",
    "las vegas",
    "лас-вегас",
    "bat yam",
    "бат-ям",
    "ulan bator",
    "улан-батор",
    "клх.узбекистан",
    "узбекистан",
    "erebru",
    "эребру",
    "штутгарт",
    "stuttgart",
    "франкфурт",
    "frankfurt",
    "мюнхен",
    "munich",
    "гамбург",
    "hamburg",
    "кельн",
    "cologne",
    "дüsseldorf",
    "дюsseldorf",
    "дюссельдорф",
    "warsaw",
    "paris",
    "london",
    "berlin",
    "riga",
    "vilnius",
    "tbilisi",
    "yerevan",
    "baku",
    "almaty",
    "astana",
    "tashkent",
    "istanbul",
    "prague",
    "budapest",
    "helsinki",
    "oslo",
    "copenhagen",
    "stockholm",
    "brussels",
    "geneva",
    "zurich",
  ].map(norm),
);

const ALLOWED_COUNTRY = /^(россия|russia|ru|rf|рф|belarus|беларусь|белоруссия|by|blr|republic of belarus)$/i;

const BLOCKED_COUNTRY =
  /^(ukraine|украина|україна|ua|ukr|kazakhstan|казахстан|georgia|грузия|armenia|армения|latvia|латвия|lithuania|литва|poland|польша|germany|германия|france|франция|united kingdom|великобритания|usa|united states|сша|uzbekistan|узбекistan|israel|израиль|turkey|турция|china|китай|japan|япония|italy|италия|spain|испания|canada|канада|australia|австралия)$/i;

export function isUkrainianCity(city: string | null | undefined) {
  if (!city) return false;
  const c = norm(city);
  if (UA_CITIES.has(c)) return true;
  return /\b(украин|ukraine|україн)\b/i.test(city);
}

export function isForeignCity(city: string | null | undefined) {
  if (!city) return false;
  const c = norm(city);
  if (FOREIGN_CITIES.has(c)) return true;
  return /\b(узбекistan|uzbekistan|kazakhstan|грузия|georgia)\b/i.test(city);
}

export function isAllowedCountry(country: string | null | undefined): boolean | null {
  if (!country?.trim()) return null;
  const c = norm(country);
  if (BLOCKED_COUNTRY.test(c)) return false;
  if (ALLOWED_COUNTRY.test(c)) return true;
  return false;
}

export function isAllowedGeo(city?: string | null, country?: string | null) {
  const countryOk = isAllowedCountry(country);
  if (countryOk === false) return false;
  if (city) {
    if (isUkrainianCity(city)) return false;
    if (isForeignCity(city)) return false;
  }
  return true;
}

export function cardCity(card: unknown): string | null {
  if (!card || typeof card !== "object") return null;
  const params = (card as { params?: { label?: string; value?: string }[] }).params;
  if (!Array.isArray(params)) return null;
  const row = params.find((p) => p.label?.toLowerCase() === "город");
  return row?.value?.trim() || null;
}

export function personGeoAllowed(row: {
  city?: string | null;
  card?: unknown;
}) {
  const cities = [row.city, cardCity(row.card)].filter(Boolean) as string[];
  for (const city of cities) {
    if (!isAllowedGeo(city)) return false;
  }
  return true;
}
