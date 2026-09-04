import { NextResponse } from "next/server";
import { markThreadRead, sendChatMessage } from "@/lib/accounts";
import { getSession } from "@/lib/auth";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.isDemo) {
    return NextResponse.json({ error: "В демо используйте локальные чаты" }, { status: 400 });
  }
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { text?: string };
    const message = await sendChatMessage(me, id, body.text || "");
    return NextResponse.json({ message });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await markThreadRead(me, id);
  return NextResponse.json({ ok: true });
}
