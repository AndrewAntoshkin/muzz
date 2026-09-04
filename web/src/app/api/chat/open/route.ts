import { NextResponse } from "next/server";
import { openThreadWithPerson } from "@/lib/accounts";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.isDemo) {
    return NextResponse.json({ error: "В демо чаты локальные — откройте Сообщения" }, { status: 400 });
  }
  try {
    const body = (await req.json()) as { personSlug?: string };
    const personSlug = (body.personSlug || "").trim();
    if (!personSlug) return NextResponse.json({ error: "Нет профиля" }, { status: 400 });
    const threadId = await openThreadWithPerson(me, personSlug);
    return NextResponse.json({ threadId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
