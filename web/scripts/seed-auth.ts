/**
 * Seed demo + sample accounts linked to known people so messaging works.
 * demo / demo — isDemo with role switch
 * anna.lebedeva / demo — casting
 * anna.kevorkova / demo — agent
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hash } from "bcryptjs";
import { users } from "../src/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);
  const passwordHash = await hash("demo", 10);

  const rows = [
    {
      id: "usr_demo",
      login: "demo",
      firstName: "Демо",
      lastName: "Кадр",
      role: "actor" as const,
      isDemo: true,
      personSlug: "vzmetnev",
      passwordHash,
    },
    {
      id: "usr_lebedeva",
      login: "anna.lebedeva",
      firstName: "Анна",
      lastName: "Лебедева",
      role: "casting" as const,
      isDemo: false,
      personSlug: "lebedeva",
      passwordHash,
    },
    {
      id: "usr_kevorkova",
      login: "anna.kevorkova",
      firstName: "Анна",
      lastName: "Кеворкова",
      role: "agent" as const,
      isDemo: false,
      personSlug: "kevorkova",
      passwordHash,
    },
  ];

  for (const row of rows) {
    const existing = await db.select().from(users).where(eq(users.login, row.login)).limit(1);
    if (existing[0]) {
      await db
        .update(users)
        .set({
          firstName: row.firstName,
          lastName: row.lastName,
          role: row.role,
          isDemo: row.isDemo,
          personSlug: row.personSlug,
          passwordHash: row.passwordHash,
        })
        .where(eq(users.login, row.login));
      console.log(`updated ${row.login}`);
    } else {
      await db.insert(users).values(row);
      console.log(`created ${row.login}`);
    }
  }

  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
