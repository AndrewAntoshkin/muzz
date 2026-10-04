/**
 * Создаёт (или обновляет) настоящего админа с вашим паролем — вместо демо-аккаунта.
 *
 *   ADMIN_LOGIN=ivan ADMIN_PASSWORD='длинный-пароль' npm run db:create-admin
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
  const login = (process.env.ADMIN_LOGIN || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!url) throw new Error("DATABASE_URL missing");
  if (!login) throw new Error("ADMIN_LOGIN missing");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);
  const passwordHash = await hash(password, 10);
  const existing = await db.select().from(users).where(eq(users.login, login)).limit(1);
  if (existing[0]) {
    await db.update(users).set({ access: "admin", passwordHash, isDemo: false }).where(eq(users.login, login));
    console.log(`updated admin ${login}`);
  } else {
    await db.insert(users).values({
      id: `usr_${login.replace(/[^a-z0-9]/g, "")}`,
      login,
      firstName: process.env.ADMIN_FIRST_NAME || "Admin",
      lastName: process.env.ADMIN_LAST_NAME || "Kadr",
      role: "actor",
      access: "admin",
      passwordHash,
      isDemo: false,
      personSlug: null,
    });
    console.log(`created admin ${login}`);
  }
  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
