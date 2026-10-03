import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { FILE_KIND_MAX_BYTES, kindFromMime, parseFileKind, type FileKind } from "@/lib/file-kinds";
import { newId } from "@/lib/identity";
import {
  assertObjectReady,
  createUploadTarget,
  isRemoteFileUrl,
  publicUrlFor,
  storageConfigured,
  storageDriver,
} from "@/lib/storage";

const { files } = schema;

export type StoredFile = {
  id: string;
  url: string;
  filename: string;
  mime: string;
  bytes: number;
  kind: FileKind;
};

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).replace(/[^\w.]/g, "").slice(0, 8) : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .replace(/[^\w.\-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  return `${base || "file"}${ext}`;
}

export function toStoredFile(row: {
  id: string;
  url: string;
  filename: string;
  mime: string;
  bytes: number;
  kind: FileKind | string;
}): StoredFile {
  return {
    id: row.id,
    url: row.url,
    filename: row.filename,
    mime: row.mime,
    bytes: row.bytes,
    kind: parseFileKind(row.kind),
  };
}

export async function getOwnedFile(id: string, userId: string) {
  const rows = await db
    .select()
    .from(files)
    .where(and(eq(files.id, id), eq(files.ownerUserId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getReadyFile(id: string) {
  const rows = await db.select().from(files).where(eq(files.id, id)).limit(1);
  const row = rows[0];
  if (!row || row.status !== "ready") return null;
  return row;
}

export async function signUserUpload(input: {
  userId: string;
  filename: string;
  mime: string;
  bytes: number;
  kind?: unknown;
}) {
  if (!storageConfigured()) {
    throw new Error("Хранилище ещё не подключено");
  }
  const filename = input.filename.trim() || "file";
  const mime = input.mime.trim() || "application/octet-stream";
  const kind = parseFileKind(input.kind || kindFromMime(mime, filename));
  const max = FILE_KIND_MAX_BYTES[kind];
  if (!input.bytes || input.bytes < 1) throw new Error("Файл пустой");
  if (input.bytes > max) {
    const mb = Math.round(max / (1024 * 1024));
    throw new Error(`Слишком большой файл. Максимум ${mb} МБ`);
  }

  const id = newId("file");
  const storageKey = `u/${input.userId}/${id}/${safeName(filename)}`;
  const placeholder = publicUrlFor(storageKey, id);
  await db.insert(files).values({
    id,
    ownerUserId: input.userId,
    kind,
    filename,
    mime,
    bytes: input.bytes,
    url: placeholder,
    storageKey,
    status: "pending",
  });

  const target = await createUploadTarget({ storageKey, fileId: id, mime });
  return {
    id,
    driver: storageDriver(),
    storageKey,
    uploadUrl: target.uploadUrl,
    headers: target.headers,
    maxBytes: max,
  };
}

export async function markFileReady(id: string, url: string, storageKey?: string) {
  await db
    .update(files)
    .set({
      status: "ready",
      url,
      ...(storageKey ? { storageKey } : {}),
    })
    .where(eq(files.id, id));
}

export async function completeUserUpload(id: string, userId: string, extra?: { url?: string; storageKey?: string }) {
  const row = await getOwnedFile(id, userId);
  if (!row) throw new Error("Файл не найден");
  const remote = extra?.url && isRemoteFileUrl(extra.url) ? extra.url : isRemoteFileUrl(row.url) ? row.url : "";
  if (remote) {
    await markFileReady(id, remote, extra?.storageKey);
    return toStoredFile({ ...row, url: remote });
  }
  if (storageDriver() === "blob") {
    throw new Error("Файл не загружен");
  }
  await assertObjectReady(row.storageKey);
  const url = publicUrlFor(row.storageKey, row.id);
  await markFileReady(id, url);
  return toStoredFile({ ...row, url });
}
