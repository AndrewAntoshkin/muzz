import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/** Для аптайм-мониторинга: отвечает, жива ли база. Без деталей наружу. */
export async function GET() {
  const startedAt = Date.now();
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: "up", ms: Date.now() - startedAt });
  } catch (err) {
    console.error("health: db down", err);
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
