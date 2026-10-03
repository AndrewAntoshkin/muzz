import { upload } from "@vercel/blob/client";
import { kindFromMime, parseFileKind, type FileKind } from "@/lib/file-kinds";

export type UploadedFile = {
  id: string;
  url: string;
  filename: string;
  mime: string;
  bytes: number;
  kind: FileKind;
};

function putWithProgress(url: string, file: File, headers: Record<string, string>, onProgress?: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.withCredentials = url.startsWith("/") || url.startsWith(window.location.origin);
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(xhr.responseText || "Не удалось загрузить файл"));
    };
    xhr.onerror = () => reject(new Error("Сеть оборвалась во время загрузки"));
    xhr.send(file);
  });
}

export async function uploadUserFile(
  file: File,
  kind?: FileKind,
  onProgress?: (pct: number) => void,
): Promise<UploadedFile> {
  const resolved = kind || parseFileKind(kindFromMime(file.type, file.name));
  const signRes = await fetch("/api/files/sign", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      mime: file.type || "application/octet-stream",
      bytes: file.size,
      kind: resolved,
    }),
  });
  const sign = (await signRes.json()) as {
    error?: string;
    id?: string;
    driver?: string;
    storageKey?: string;
    uploadUrl?: string;
    headers?: Record<string, string>;
  };
  if (!signRes.ok || !sign.id || !sign.uploadUrl) {
    throw new Error(sign.error || "Не удалось начать загрузку");
  }
  const fileId = sign.id;
  const uploadUrl = sign.uploadUrl;
  const storageKey = sign.storageKey || file.name;
  onProgress?.(1);
  let blobUrl = "";
  let blobPath = "";
  if (sign.driver === "blob") {
    const useMultipart = file.size > 4.5 * 1024 * 1024;
    const send = (multipart: boolean) =>
      upload(storageKey, file, {
        access: "public",
        handleUploadUrl: uploadUrl,
        clientPayload: JSON.stringify({ fileId }),
        contentType: file.type || "application/octet-stream",
        multipart,
        onUploadProgress: ({ percentage }) => onProgress?.(Math.min(99, Math.round(percentage))),
      });
    const blob = useMultipart
      ? await send(true).catch(() => send(false))
      : await send(false).catch(() => send(true));
    blobUrl = blob.url;
    blobPath = blob.pathname;
    onProgress?.(100);
  } else {
    await putWithProgress(uploadUrl, file, sign.headers || {}, onProgress);
  }
  const doneRes = await fetch(`/api/files/${fileId}/complete`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: blobUrl || undefined, storageKey: blobPath || undefined }),
  });
  const done = (await doneRes.json()) as { error?: string; file?: UploadedFile };
  if (!doneRes.ok || !done.file) throw new Error(done.error || "Не удалось сохранить файл");
  return done.file;
}
