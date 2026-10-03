export const FILE_KINDS = ["photo", "video", "doc", "selftape"] as const;

export type FileKind = (typeof FILE_KINDS)[number];

export function parseFileKind(raw: unknown): FileKind {
  if (raw === "photo" || raw === "video" || raw === "selftape") return raw;
  return "doc";
}

export const FILE_KIND_MAX_BYTES: Record<FileKind, number> = {
  photo: 8 * 1024 * 1024,
  doc: 8 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  selftape: 200 * 1024 * 1024,
};

/** Small files can still go through the app server. Video uses direct PUT. */
export const FILE_SERVER_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

export const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm";

export const BLOB_ALLOWED_CONTENT_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function kindFromMime(mime: string, filename: string): FileKind {
  const type = `${mime} ${filename}`.toLowerCase();
  if (type.includes("image/")) return "photo";
  if (type.includes("video/") || /\.(mp4|mov|webm)$/.test(filename.toLowerCase())) return "video";
  return "doc";
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 100 * 1024 * 1024 ? 0 : 1)} МБ`;
}
