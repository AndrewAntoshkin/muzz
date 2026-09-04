/**
 * Демо-аккаунт владельца + аккаунты персон для чатов между ролями.
 *
 *   andrew / CadrShow26  — isDemo, переключение актёр / CD / агент
 *   anna.lebedeva / demo — отдельный CD (серверные чаты)
 *   anna.kevorkova / demo — отдельный агент
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hash } from "bcryptjs";
import { users } from "../src/db/schema";
import { DEMO_LOGIN, DEMO_PASSWORD } from "../src/lib/auth";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  const andrewHash = await hash(DEMO_PASSWORD, 10);
  const demoHash = await hash("demo", 10);

  const rows = [
    {
      id: "usr_andrew",
      login: DEMO_LOGIN,
      firstName: "Андрей",
      lastName: "Антошкин",
      role: "actor" as const,
      isDemo: true,
      personSlug: "vzmetnev",
      passwordHash: andrewHash,
    },
    // старый логин тоже ведёт в тот же демо-режим
    {
      id: "usr_demo",
      login: "demo",
      firstName: "Андрей",
      lastName: "Антошкин",
      role: "actor" as const,
      isDemo: true,
      personSlug: "vzmetnev",
      passwordHash: andrewHash,
    },
    {
      id: "usr_lebedeva",
      login: "anna.lebedeva",
      firstName: "Анна",
      lastName: "Лебедева",
      role: "casting" as const,
      isDemo: false,
      personSlug: "lebedeva",
      passwordHash: demoHash,
    },
    {
      id: "usr_kevorkova",
      login: "anna.kevorkova",
      firstName: "Анна",
      lastName: "Кеворкова",
      role: "agent" as const,
      isDemo: false,
      personSlug: "kevorkova",
      passwordHash: demoHash,
    },
  ];

  for (const row of rows) {
    const existing = await db.select().from(users).where(eq(users.login, row.login)).limit(1);
    if (existing[0]) {
      await db
        .update(users)
        .set({
          id: existing[0].id,
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
  console.log(`owner demo: ${DEMO_LOGIN} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
