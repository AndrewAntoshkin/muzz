import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { completeUserUpload } from "@/lib/files";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const extra = (await req.json().catch(() => ({}))) as { url?: string; storageKey?: string };
    const file = await completeUserUpload(id, me.id, extra);
    return NextResponse.json({ file });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
