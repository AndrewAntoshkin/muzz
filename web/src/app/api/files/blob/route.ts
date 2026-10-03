import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { BLOB_ALLOWED_CONTENT_TYPES, FILE_KIND_MAX_BYTES } from "@/lib/file-kinds";
import { getOwnedFile, markFileReady } from "@/lib/files";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const me = await getSession();
        if (!me) throw new Error("Unauthorized");
        const payload = JSON.parse(clientPayload || "{}") as { fileId?: string };
        const row = payload.fileId ? await getOwnedFile(payload.fileId, me.id) : null;
        if (!row || row.status === "ready") throw new Error("Файл не найден");
        if (pathname !== row.storageKey) throw new Error("Неверный путь файла");
        return {
          allowedContentTypes: [...BLOB_ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: Math.max(row.bytes, FILE_KIND_MAX_BYTES.video),
          addRandomSuffix: false,
          allowOverwrite: true,
          tokenPayload: JSON.stringify({ fileId: row.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || "{}") as { fileId?: string };
        if (!payload.fileId) return;
        await markFileReady(payload.fileId, blob.url, blob.pathname);
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка загрузки";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
