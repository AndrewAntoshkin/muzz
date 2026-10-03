/**
 * Pushes local uploads into Vercel Blob (preferred) or MinIO/R2,
 * then rewrites files.url in the database.
 */
import { config } from "dotenv";
import type { Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { files } from "../src/db/schema";
import {
  blobConfigured,
  ensureS3Bucket,
  localUploadDir,
  putBlobObject,
  putObjectBuffer,
  publicUrlFor,
  s3Configured,
} from "../src/lib/storage";

config({ path: ".env.local" });
config({ path: ".env" });

async function walk(dir: string, prefix = ""): Promise<{ key: string; path: string }[]> {
  const out: { key: string; path: string }[] = [];
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true, encoding: "utf8" });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, rel)));
    else out.push({ key: rel, path: full });
  }
  return out;
}

function mimeFor(key: string) {
  if (key.endsWith(".mp4")) return "video/mp4";
  if (key.endsWith(".webm")) return "video/webm";
  if (key.endsWith(".mov")) return "video/quicktime";
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

async function main() {
  const useBlob = blobConfigured();
  if (!useBlob && !s3Configured()) {
    throw new Error("Set BLOB_READ_WRITE_TOKEN or S3_* / R2_* credentials");
  }
  if (!useBlob) {
    await ensureS3Bucket();
    console.log("bucket ready");
  } else {
    console.log("blob store ready");
  }

  const uploaded = await walk(localUploadDir());
  const remoteByKey = new Map<string, string>();
  for (const file of uploaded) {
    const info = await stat(file.path);
    if (!info.isFile()) continue;
    const buf = await readFile(file.path);
    const mime = mimeFor(file.key);
    if (useBlob) {
      const blob = await putBlobObject(file.key, buf, mime);
      remoteByKey.set(file.key, blob.url);
      console.log("blob", file.key, info.size);
    } else {
      await putObjectBuffer(file.key, buf, mime);
      console.log("put", file.key, info.size);
    }
  }

  const url = process.env.DATABASE_URL;
  if (url && uploaded.length) {
    const client = postgres(url, { prepare: false, max: 1 });
    const db = drizzle(client);
    const rows = await db.select().from(files);
    for (const row of rows) {
      const next = remoteByKey.get(row.storageKey) || (useBlob ? row.url : publicUrlFor(row.storageKey, row.id));
      if (row.url !== next && (next.startsWith("http") || !useBlob)) {
        await db.update(files).set({ url: next, status: "ready" }).where(eq(files.id, row.id));
        console.log("url", row.id, next);
      }
    }
    await client.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
