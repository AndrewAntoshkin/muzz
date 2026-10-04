import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { put } from "@vercel/blob";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type StorageDriver = "blob" | "s3" | "local";

export function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function s3Endpoint() {
  if (process.env.S3_ENDPOINT) return process.env.S3_ENDPOINT.replace(/\/$/, "");
  if (process.env.R2_ACCOUNT_ID) return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  return "";
}

function s3AccessKey() {
  return process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || "";
}

function s3Secret() {
  return process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || "";
}

export function s3Bucket() {
  return process.env.S3_BUCKET || process.env.R2_BUCKET || "kadr-files";
}

function s3PublicBase() {
  return (process.env.S3_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");
}

export function s3Configured() {
  return Boolean(s3Endpoint() && s3AccessKey() && s3Secret() && s3Bucket() && s3PublicBase());
}

export function storageDriver(): StorageDriver | null {
  if (blobConfigured()) return "blob";
  if (s3Configured()) return "s3";
  if (process.env.NODE_ENV !== "production") return "local";
  return null;
}

export function storageConfigured() {
  return storageDriver() !== null;
}

export function s3Client() {
  const endpoint = s3Endpoint();
  const pathStyle = endpoint.includes("localhost") || endpoint.includes("127.0.0.1") || process.env.S3_FORCE_PATH_STYLE === "1";
  return new S3Client({
    region: process.env.S3_REGION || (endpoint.includes("r2.cloudflarestorage.com") ? "auto" : "us-east-1"),
    endpoint: endpoint || undefined,
    forcePathStyle: pathStyle,
    credentials: {
      accessKeyId: s3AccessKey(),
      secretAccessKey: s3Secret(),
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export function localUploadDir() {
  return join(process.cwd(), ".data", "uploads");
}

export function localFilePath(storageKey: string) {
  return join(localUploadDir(), storageKey);
}

export function publicUrlFor(storageKey: string, fileId: string) {
  if (storageDriver() === "s3") return `${s3PublicBase()}/${storageKey}`;
  return `/api/files/${fileId}/content`;
}

/**
 * Принимаем от клиента URL готового файла, только если он указывает ровно на
 * объект этого файла в нашем хранилище (иначе можно подсунуть чужую ссылку).
 */
export function trustedObjectUrl(url: string | undefined, storageKey: string) {
  if (!url) return "";
  try {
    const driver = storageDriver();
    if (driver === "s3") {
      return url === `${s3PublicBase()}/${storageKey}` ? url : "";
    }
    if (driver === "blob") {
      const u = new URL(url);
      const path = decodeURIComponent(u.pathname).replace(/^\//, "");
      const ok = u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com" ) && path === storageKey;
      return ok ? url : "";
    }
  } catch {
    /* fallthrough */
  }
  return "";
}

export function isRemoteFileUrl(url: string) {
  return url.startsWith("https://") || url.startsWith("http://");
}

export async function putBlobObject(storageKey: string, body: Buffer, mime: string) {
  return put(storageKey, body, {
    access: "public",
    contentType: mime,
    addRandomSuffix: false,
    allowOverwrite: true,
    multipart: body.length > 4.5 * 1024 * 1024,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

export async function ensureS3Bucket() {
  if (!s3Configured()) throw new Error("S3 is not configured");
  const client = s3Client();
  const Bucket = s3Bucket();
  try {
    await client.send(new HeadBucketCommand({ Bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket }));
  }
  await client.send(
    new PutBucketCorsCommand({
      Bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "HEAD"],
            AllowedOrigins: [
              "http://localhost:3000",
              "http://localhost:3001",
              "http://127.0.0.1:3000",
              "http://127.0.0.1:3001",
            ],
            ExposeHeaders: ["ETag", "Accept-Ranges", "Content-Length"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
  await client.send(
    new PutBucketPolicyCommand({
      Bucket,
      Policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "PublicRead",
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${Bucket}/*`],
          },
        ],
      }),
    }),
  );
}

export async function putObjectBuffer(storageKey: string, body: Buffer, mime: string) {
  await s3Client().send(
    new PutObjectCommand({
      Bucket: s3Bucket(),
      Key: storageKey,
      Body: body,
      ContentType: mime,
    }),
  );
}

export async function createUploadTarget(input: {
  storageKey: string;
  fileId: string;
  mime: string;
}): Promise<{ uploadUrl: string; headers: Record<string, string> }> {
  const driver = storageDriver();
  if (!driver) throw new Error("STORAGE_UNAVAILABLE");

  if (driver === "blob") {
    return { uploadUrl: "/api/files/blob", headers: {} };
  }

  if (driver === "s3") {
    const url = await getSignedUrl(
      s3Client(),
      new PutObjectCommand({
        Bucket: s3Bucket(),
        Key: input.storageKey,
        ContentType: input.mime,
      }),
      { expiresIn: 60 * 30 },
    );
    return { uploadUrl: url, headers: { "Content-Type": input.mime } };
  }

  return {
    uploadUrl: `/api/files/${input.fileId}/upload`,
    headers: { "Content-Type": input.mime },
  };
}

export async function writeLocalUpload(storageKey: string, body: ReadableStream<Uint8Array> | null) {
  if (!body) throw new Error("Пустое тело");
  const dest = localFilePath(storageKey);
  await mkdir(dirname(dest), { recursive: true });
  await pipeline(Readable.fromWeb(body as never), createWriteStream(dest));
}

export async function assertObjectReady(storageKey: string) {
  const driver = storageDriver();
  if (driver === "blob") {
    throw new Error("Файл не загружен");
  }
  if (driver === "s3") {
    await s3Client().send(
      new HeadObjectCommand({
        Bucket: s3Bucket(),
        Key: storageKey,
      }),
    );
    return;
  }
  const info = await stat(localFilePath(storageKey));
  if (!info.isFile() || info.size <= 0) throw new Error("Файл не загружен");
}

export async function readLocalFile(storageKey: string) {
  const path = localFilePath(storageKey);
  const info = await stat(path);
  return { path, size: info.size };
}
