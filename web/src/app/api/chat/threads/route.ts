import { NextResponse } from "next/server";
import { listThreadsForUser } from "@/lib/accounts";
import { getSession } from "@/lib/auth";

export async function GET() {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.isDemo) return NextResponse.json({ threads: [], demo: true });
  const threads = await listThreadsForUser(me);
  return NextResponse.json({ threads });
}
