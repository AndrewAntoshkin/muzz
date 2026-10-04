import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPerson } from "@/lib/people";

export const dynamic = "force-dynamic";

/**
 * Agent e-mail of a profile, on demand. The profile page does not ship it (that would
 * expose the contact of every person to anybody who can download pages); the
 * "Написать агенту" button asks for it here. Authenticated and rate limited per user.
 * The limiter is in-memory (per server instance): it slows bulk harvesting down, it is
 * not a hard guarantee on serverless.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, number[]>();

function allow(userId: string) {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(userId, recent);
    return false;
  }
  recent.push(now);
  hits.set(userId, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) if (!times.some((t) => now - t < WINDOW_MS)) hits.delete(key);
  }
  return true;
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!allow(session.id)) {
    return NextResponse.json({ error: "Слишком много запросов контактов. Попробуйте позже." }, { status: 429 });
  }
  const { slug } = await ctx.params;
  const person = await getPerson(slug);
  if (!person?.agentEmail) return NextResponse.json({ error: "Контакт агента не указан" }, { status: 404 });
  return NextResponse.json({ email: person.agentEmail }, { headers: { "Cache-Control": "private, no-store" } });
}
