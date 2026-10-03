/**
 * Strip CSS / unicode-range debris out of people.card.credits.
 *
 *   npx tsx scripts/clean-junk-credits.ts
 */
import { config } from "dotenv";
import postgres from "postgres";
import { cleanCredits } from "../src/lib/person-card";
import type { PersonCard } from "../src/lib/person-card";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = postgres(url, { prepare: false, max: 1 });

  const rows = await sql<{ slug: string; card: PersonCard }[]>`
    SELECT slug, card
    FROM people
    WHERE card -> 'credits' IS NOT NULL
      AND (
        card::text ILIKE '%href=%'
        OR card::text ILIKE '%.css%'
        OR card::text ILIKE '%elementor%'
        OR card::text ILIKE '%unicode-range%'
        OR card::text ILIKE '%wp-content%'
      )
  `;

  let cleaned = 0;
  let emptied = 0;
  for (const row of rows) {
    const before = row.card.credits || [];
    const credits = cleanCredits(before);
    if (credits.length === before.length) continue;
    const card = { ...row.card };
    if (credits.length) card.credits = credits;
    else delete card.credits;
    await sql`UPDATE people SET card = ${JSON.stringify(card)}::jsonb WHERE slug = ${row.slug}`;
    cleaned += 1;
    if (!credits.length) emptied += 1;
  }

  console.log(`clean-junk-credits: scanned ${rows.length}, updated ${cleaned}, emptied ${emptied}`);
  await sql.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
