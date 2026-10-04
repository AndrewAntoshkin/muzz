import { NextResponse } from "next/server";
import { markThreadRead, sendChatMessage } from "@/lib/accounts";
import { getSession } from "@/lib/auth";
import { limitOr429 } from "@/lib/rate-limit";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.isDemo) {
    return NextResponse.json({ error: "В демо используйте локальные чаты" }, { status: 400 });
  }
  const limited =
    (await limitOr429({ bucket: "chat:send:min", id: me.id, max: 20, windowSec: 60 })) ??
    (await limitOr429({ bucket: "chat:send:day", id: me.id, max: 1000, windowSec: 86400 }));
  if (limited) return limited;
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { text?: string; fileId?: string };
    const message = await sendChatMessage(me, id, body.text || "", body.fileId);
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
