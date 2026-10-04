/**
 * Заливает демо-контент рабочего пространства (проекты, кастинги, отклики, доска) в Postgres.
 * Затрагивает только строки с is_demo = true и демо-персон; данные реальных пользователей не трогает.
 *
 *   npm run db:seed-workspace
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  const host = new URL(process.env.DATABASE_URL).host;
  console.log(`→ ${host}`);
  const { resetDemoWorkspace } = await import("../src/server/demo-seed/seed");
  const result = await resetDemoWorkspace();
  console.log("Демо-пространство залито:", result);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
