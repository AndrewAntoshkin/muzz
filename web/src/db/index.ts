import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function requireUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy web/.env.example to web/.env.local (Neon or docker compose).",
    );
  }
  return url;
}

const globalForDb = globalThis as unknown as {
  pg?: ReturnType<typeof postgres>;
};

function getClient() {
  if (!globalForDb.pg) {
    globalForDb.pg = postgres(requireUrl(), { prepare: false, max: 1 });
  }
  return globalForDb.pg;
}

export const db = drizzle(getClient(), { schema });
export { schema };
