import { and, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const { files, rateLimits } = schema;

/**
 * Ежедневная уборка (Vercel Cron): просроченные счётчики rate-limit и
 * «зависшие» загрузки, которые так и не были завершены.
 * Защищено `CRON_SECRET`: Vercel сам подставляет его в заголовок Authorization.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const limits = await db.delete(rateLimits).where(lt(rateLimits.resetAt, hourAgo)).returning({ key: rateLimits.key });
  const pending = await db
    .delete(files)
    .where(and(eq(files.status, "pending"), lt(files.createdAt, dayAgo)))
    .returning({ id: files.id });

  return NextResponse.json({ rateLimits: limits.length, pendingFiles: pending.length });
}
