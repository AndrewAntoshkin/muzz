/**
 * Remove people outside RF and Belarus (Ukraine and other countries).
 *
 *   npm run db:purge-geo
 *   npx tsx scripts/purge-non-allowed-geo.ts --dry-run
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { people } from "../src/db/schema";
import { cardCity, isAllowedGeo, isForeignCity, isUkrainianCity } from "../src/lib/geo-allowed";

config({ path: ".env.local" });
config({ path: ".env" });

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function reason(city: string | null | undefined) {
  if (!city) return "unknown";
  if (isUkrainianCity(city)) return "ukraine";
  if (isForeignCity(city)) return "foreign";
  return "other";
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const dryRun = hasFlag("dry-run");

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  const rows = await db
    .select({
      slug: people.slug,
      name: people.name,
      city: people.city,
      card: people.card,
    })
    .from(people);

  const toDelete: { slug: string; name: string; city: string; why: string }[] = [];

  for (const row of rows) {
    const cities = [row.city, cardCity(row.card)].filter(Boolean) as string[];
    const blocked = cities.find((c) => !isAllowedGeo(c));
    if (blocked) {
      toDelete.push({
        slug: row.slug,
        name: row.name,
        city: blocked,
        why: reason(blocked),
      });
      continue;
    }
  }

  const byWhy = new Map<string, number>();
  const byCity = new Map<string, number>();
  for (const row of toDelete) {
    byWhy.set(row.why, (byWhy.get(row.why) || 0) + 1);
    byCity.set(row.city, (byCity.get(row.city) || 0) + 1);
  }

  console.log(`people total: ${rows.length}`);
  console.log(`to delete: ${toDelete.length}`);
  console.log("by reason:", Object.fromEntries(byWhy));
  console.log("top cities:");
  for (const [city, n] of [...byCity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${city}: ${n}`);
  }

  if (dryRun) {
    console.log("\ndry-run — no rows deleted");
    for (const row of toDelete.slice(0, 15)) {
      console.log(`  ${row.slug} | ${row.name} | ${row.city} (${row.why})`);
    }
    await client.end({ timeout: 5 });
    return;
  }

  const slugs = toDelete.map((r) => r.slug);
  const chunk = 500;
  let deleted = 0;
  for (let i = 0; i < slugs.length; i += chunk) {
    const part = slugs.slice(i, i + chunk);
    const result = await client<{ slug: string }[]>`
      DELETE FROM people WHERE slug = ANY(${part}) RETURNING slug
    `;
    deleted += result.length;
    if (i % 2000 === 0) console.log(`  deleted ${Math.min(i + chunk, slugs.length)}/${slugs.length}`);
  }

  const [left] = await client<{ n: number }[]>`SELECT count(*)::int AS n FROM people`;
  console.log(`deleted ${deleted}, remaining ${left.n}`);
  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
