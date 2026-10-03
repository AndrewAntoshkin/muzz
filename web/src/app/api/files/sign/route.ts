import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { signUserUpload } from "@/lib/files";

export async function POST(req: Request) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await req.json()) as {
      filename?: string;
      mime?: string;
      bytes?: number;
      kind?: string;
    };
    const signed = await signUserUpload({
      userId: me.id,
      filename: body.filename || "file",
      mime: body.mime || "application/octet-stream",
      bytes: Number(body.bytes) || 0,
      kind: body.kind,
    });
    return NextResponse.json(signed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка";
    const status = message.includes("не подключено") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
