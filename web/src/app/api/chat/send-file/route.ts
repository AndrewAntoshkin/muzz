import { NextResponse } from "next/server";
import { sendChatFile } from "@/lib/accounts";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
