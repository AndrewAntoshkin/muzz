import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getReadyFile } from "@/lib/files";
import { isRemoteFileUrl, readLocalFile } from "@/lib/storage";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const row = await getReadyFile(id);
  if (!row) return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  if (isRemoteFileUrl(row.url)) {
    return NextResponse.redirect(row.url);
  }
  try {
    const local = await readLocalFile(row.storageKey);
    const size = local.size;
    const range = req.headers.get("range");
    let start = 0;
    let end = size - 1;
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (match?.[1]) start = Number(match[1]);
      if (match?.[2]) end = Number(match[2]);
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        });
      }
      end = Math.min(end, size - 1);
    }
    const stream = Readable.toWeb(createReadStream(local.path, { start, end })) as ReadableStream;
    const headers: Record<string, string> = {
      "Content-Type": row.mime || "application/octet-stream",
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename="${encodeURIComponent(row.filename)}"`,
      "Cache-Control": "private, max-age=3600",
    };
    if (range) headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
    return new NextResponse(stream, { status: range ? 206 : 200, headers });
  } catch {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }
}
