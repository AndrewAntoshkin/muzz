#!/usr/bin/env node
/**
 * PII regression check for /people/<slug>.
 *
 * The profile page is a server component, so everything we hand to the client
 * component ends up in the HTML and in the RSC flight stream, i.e. it can be
 * scraped by any logged-in account. This script logs in with the demo account,
 * downloads the HTML and the RSC payload (`RSC: 1`) of ~25 profiles and fails
 * (exit code 1) when the payload contains data the UI must not receive:
 *
 *   - ISO birth dates next to a birth* key (UI only shows the age)
 *   - the keys `agentEmail`, `sourceUrl`, `birthDate`
 *   - e-mail addresses
 *   - phone numbers (+7 (...), +7 926 ..., 8 (9xx) ...)
 *
 * Only the contacts listed in ALLOWED_CONTACTS may appear, and only on the
 * profile slug they belong to. Those are the hand-written demo cards
 * (lib/demo-profiles.ts, lib/demo-industry.ts) that the product shows to
 * casting directors on purpose. Real scraped contacts must never show up.
 *
 * Usage:
 *   node scripts/check-pii.mjs [baseUrl] [--count=25] [--slugs=a,b,c] [--verbose]
 *   BASE_URL=http://localhost:3011 node scripts/check-pii.mjs
 *
 * Deterministic: the slug sample is picked by fixed offsets over the
 * alphabetically sorted /api/people listing (same DB => same sample).
 * Read-only: it only does GETs plus the demo login POST.
 */

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const BASE = (args.find((a) => /^https?:\/\//.test(a)) || process.env.BASE_URL || "http://localhost:3011").replace(/\/$/, "");
const COUNT = Number(flag("count") || 25);
const VERBOSE = args.includes("--verbose");
const EXPLICIT = flag("slugs")?.split(",").map((s) => s.trim()).filter(Boolean);

/** Always checked: demo personas + hand-written industry cards + the "hack" alias. */
const FIXED_SLUGS = [
  "vzmetnev",
  "kevorkova",
  "gneusheva",
  "soykina",
  "lebedeva",
  "lenskikh",
  "bocharova",
  // scraped actors whose bio text contains their agent's phone / e-mail
  "radikino-uustalu-sergey",
  "nashutinskaya-irina-nashutinskaya",
];

/**
 * Whitelist: contacts that are part of the demo cards and are intentionally
 * rendered in the "Контакты" side panel. Key = profile slug. Anything else
 * (any other slug, any other value) is a finding.
 */
const ALLOWED_CONTACTS = {
  kevorkova: ["anna@akter1.ru", "+7 (916) 670-30-59"],
  soykina: ["irina@akter1.ru", "+7 (926) 513-15-19"],
  gneusheva: ["aktkast@mail.ru", "+7 (926) 902-18-82"],
  bocharova: ["+7 (495) 741-63-90"],
};

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const PHONE_RE = /(?:\+7|\b8)[\s\u00a0-]?\(?\d{3}\)?[\s\u00a0-]?\d{3}[\s\u00a0-]?\d{2}[\s\u00a0-]?\d{2}\b/g;
const BIRTH_ISO_RE = /birth\w*\W{1,8}\d{4}-\d{2}-\d{2}/gi;
const FORBIDDEN_KEYS = ["agentEmail", "sourceUrl", "birthDate"];

const normPhone = (s) => s.replace(/\D/g, "").replace(/^8/, "7");

async function login() {
  const res = await fetch(`${BASE}/api/auth/demo`, { method: "POST", signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`demo login failed: HTTP ${res.status}`);
  const cookies = res.headers.getSetCookie?.() ?? [];
  const session = cookies.map((c) => c.split(";")[0]).find((c) => c.startsWith("kadr_session="));
  if (!session) throw new Error("demo login did not return kadr_session cookie");
  return session;
}

async function get(cookie, url, extra = {}, hops = 0) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { cookie, ...extra },
    redirect: "manual",
    signal: AbortSignal.timeout(90000),
  });
  // Next answers a bare `RSC: 1` request with a redirect to `?_rsc` (cache-busting param).
  // Follow only that same-path redirect; any other redirect (e.g. -> /auth) is reported as is.
  const location = res.headers.get("location");
  if (res.status >= 300 && res.status < 400 && location && hops < 2) {
    const next = new URL(location, BASE);
    if (next.pathname === url.split("?")[0] && next.searchParams.has("_rsc")) {
      return get(cookie, `${next.pathname}${next.search}`, extra, hops + 1);
    }
  }
  return { status: res.status, text: await res.text() };
}

async function pickSlugs(cookie) {
  const picked = [];
  const add = (slug) => {
    if (slug && !picked.includes(slug)) picked.push(slug);
  };
  const list = async (qs) => {
    const { status, text } = await get(cookie, `/api/people?${qs}`);
    if (status !== 200) throw new Error(`/api/people?${qs} -> HTTP ${status}`);
    return JSON.parse(text);
  };
  // 1) spread over the whole alphabetical catalogue (actors + actresses, incl. kinolift mass import)
  const first = await list("kind=actors&limit=1");
  const total = first.total;
  const spread = Math.max(8, COUNT - 12);
  for (let i = 0; i < spread; i++) {
    const offset = Math.floor(((i + 0.5) * total) / spread);
    const page = await list(`kind=actors&limit=1&offset=${offset}`);
    add(page.items[0]?.slug);
  }
  // 2) a few from the agencies we have rich pages for + the biggest scraped source
  for (const agency of ["akter1", "castingrus", "kinolift", "agnikino"]) {
    const page = await list(`kind=all&agency=${agency}&limit=2`);
    page.items.forEach((p) => add(p.slug));
  }
  // 3) non-actor professions
  for (const profession of ["agent", "casting"]) {
    const page = await list(`profession=${profession}&limit=2`);
    page.items.forEach((p) => add(p.slug));
  }
  return picked;
}

function scan(slug, text) {
  const findings = [];
  const allowed = ALLOWED_CONTACTS[slug] ?? [];
  const allowedPhones = new Set(allowed.filter((v) => /^\+?\d/.test(v)).map(normPhone));
  const allowedEmails = new Set(allowed.filter((v) => v.includes("@")).map((v) => v.toLowerCase()));

  for (const m of text.matchAll(BIRTH_ISO_RE)) findings.push({ kind: "birth-date", sample: m[0] });
  for (const key of FORBIDDEN_KEYS) {
    const idx = text.indexOf(key);
    if (idx !== -1) findings.push({ kind: `key:${key}`, sample: text.slice(Math.max(0, idx - 10), idx + 50) });
  }
  for (const m of text.matchAll(EMAIL_RE)) {
    if (!allowedEmails.has(m[0].toLowerCase())) findings.push({ kind: "email", sample: m[0] });
  }
  for (const m of text.matchAll(PHONE_RE)) {
    if (!allowedPhones.has(normPhone(m[0]))) findings.push({ kind: "phone", sample: m[0] });
  }
  return findings;
}

function uniq(findings) {
  const seen = new Set();
  return findings.filter((f) => {
    const key = `${f.kind}|${f.sample}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  console.log(`check-pii · base ${BASE}`);
  const cookie = await login();
  const slugs = EXPLICIT ?? [...new Set([...FIXED_SLUGS, ...(await pickSlugs(cookie))])];
  console.log(`profiles: ${slugs.length}\n`);

  let bad = 0;
  const totals = {};
  for (const slug of slugs) {
    const rows = [];
    for (const [label, headers] of [
      ["html", { accept: "text/html" }],
      ["rsc", { RSC: "1" }],
    ]) {
      try {
        const { status, text } = await get(cookie, `/people/${encodeURIComponent(slug)}`, headers);
        const findings = status === 200 ? uniq(scan(slug, text)) : [];
        rows.push({ label, status, bytes: text.length, findings });
      } catch (err) {
        rows.push({ label, status: "ERR", bytes: 0, findings: [{ kind: "fetch-error", sample: String(err) }] });
      }
    }
    const count = rows.reduce((n, r) => n + r.findings.length, 0);
    if (count) bad++;
    console.log(`${count ? "FAIL" : "ok  "} ${slug.padEnd(34)} ${rows.map((r) => `${r.label}:${r.status}/${r.bytes}B`).join("  ")}`);
    for (const r of rows) {
      for (const f of r.findings) {
        totals[f.kind] = (totals[f.kind] || 0) + 1;
        if (count <= 6 || VERBOSE) console.log(`       [${r.label}] ${f.kind}: ${JSON.stringify(f.sample)}`);
      }
      if (!VERBOSE && r.findings.length > 6) {
        console.log(`       [${r.label}] … ${r.findings.length} findings (use --verbose)`);
      }
    }
  }

  console.log("\nsummary");
  console.log(`  profiles checked : ${slugs.length}`);
  console.log(`  profiles failing : ${bad}`);
  for (const [kind, n] of Object.entries(totals).sort()) console.log(`  ${kind.padEnd(16)} : ${n}`);
  if (bad) {
    console.log("\nRESULT: FAIL");
    process.exit(1);
  }
  console.log("\nRESULT: OK");
}

main().catch((err) => {
  console.error(`check-pii crashed: ${err.message}`);
  process.exit(2);
});
