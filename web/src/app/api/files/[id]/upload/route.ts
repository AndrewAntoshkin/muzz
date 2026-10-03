import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOwnedFile } from "@/lib/files";
import { storageDriver, writeLocalUpload } from "@/lib/storage";

export const maxDuration = 300;

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (storageDriver() !== "local") {
    return NextResponse.json({ error: "Этот адрес только для локальной загрузки" }, { status: 400 });
  }
  const { id } = await ctx.params;
  const row = await getOwnedFile(id, me.id);
  if (!row || row.status !== "pending") {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared && declared > row.bytes + 1024) {
    return NextResponse.json({ error: "Файл больше заявленного" }, { status: 413 });
  }
  await writeLocalUpload(row.storageKey, req.body);
  return NextResponse.json({ ok: true });
}
