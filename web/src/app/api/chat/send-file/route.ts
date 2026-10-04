import { NextResponse } from "next/server";
import { sendChatFile } from "@/lib/accounts";
import { getSession } from "@/lib/auth";
import { limitOr429 } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await limitOr429({ bucket: "chat:send-file", id: me.id, max: 20, windowSec: 600 });
  if (limited) return limited;
  try {
    const body = (await req.json()) as { personSlug?: string; text?: string; fileId?: string };
    if (!body.fileId) return NextResponse.json({ error: "Нет файла" }, { status: 400 });
    const result = await sendChatFile(me, (body.personSlug || "").trim(), body.text || "", body.fileId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
