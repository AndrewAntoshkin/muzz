import { NextResponse } from "next/server";
import { latestThreadUpdate } from "@/lib/accounts";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Один лёгкий запрос: клиент опрашивает его и перезагружает диалоги, только если `latest` изменился. */
export async function GET() {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.isDemo) return NextResponse.json({ latest: 0 });
  const latest = await latestThreadUpdate(me.id);
  return NextResponse.json({ latest }, { headers: { "Cache-Control": "no-store" } });
}
