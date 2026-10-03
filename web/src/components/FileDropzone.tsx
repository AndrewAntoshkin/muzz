"use client";

import { useRef, useState } from "react";
import { uploadUserFile } from "@/lib/upload-client";
import { IconUpload } from "./icons";

export const FILE_MAX_BYTES = 8 * 1024 * 1024;
export const DOC_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp";

const KIND_RE = /^(PDF|DOC|DOCX|XLS|XLSX|PNG|JPE?G|WEBP|GIF|MP4|MOV|WEBM|TXT)$/i;

export function fileExt(name: string) {
  const i = name.lastIndexOf(".");
  if (i < 0 || i === name.length - 1) return "";
  return name.slice(i + 1).toUpperCase();
}

export function fileKindLabel(name: string, value?: string) {
  if (value && KIND_RE.test(value.trim())) return value.trim().toUpperCase();
  return fileExt(name) || "Файл";
}

export type FileKindTone = "pdf" | "doc" | "xls" | "img" | "video" | "file";

export function fileKindMeta(kind?: string, name?: string) {
  const raw = `${kind || ""} ${name || ""}`.toLowerCase();
  if (/pdf/.test(raw)) return { tone: "pdf" as const, ext: "PDF", label: "PDF" };
  if (/docx?|\bdoc\b/.test(raw)) return { tone: "doc" as const, ext: "DOC", label: "Документ" };
  if (/xlsx?|\bxls\b/.test(raw)) return { tone: "xls" as const, ext: "XLS", label: "Таблица" };
  if (/png|jpe?g|webp|gif/.test(raw)) return { tone: "img" as const, ext: "IMG", label: "Изображение" };
  if (/mp4|mov|webm|видео|video/.test(raw)) {
    const ext = /webm/.test(raw) ? "WEBM" : /mov/.test(raw) ? "MOV" : "MP4";
    return { tone: "video" as const, ext, label: "Видео" };
  }
  return { tone: "file" as const, ext: "DOC", label: "Файл" };
}

function FileTypeIcon({ tone, ext }: { tone: FileKindTone; ext: string }) {
  return (
    <span className={`file-type-icon file-type-icon--${tone}`} aria-hidden>
      <span className="file-type-icon__mark">{ext}</span>
    </span>
  );
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function persistFileUrl(file: File, kind: "photo" | "video" | "doc" | "selftape" = "doc") {
  try {
    const stored = await uploadUserFile(file, kind);
    if (stored.url) return stored.url;
  } catch (err) {
    if (kind === "selftape") throw err;
  }
  if (kind === "selftape") throw new Error("Не удалось сохранить видео");
  if (kind === "video") return URL.createObjectURL(file);
  return readFileAsDataUrl(file);
}

export function FileDropzone({
  accept = DOC_ACCEPT,
  multiple = true,
  maxBytes = FILE_MAX_BYTES,
  title = "Перетащите файлы сюда",
  hint = "или нажмите, чтобы выбрать · PDF, Word, Excel, изображение · до 8 МБ",
  disabled,
  onFiles,
  onError,
}: {
  accept?: string;
  multiple?: boolean;
  maxBytes?: number;
  title?: string;
  hint?: string;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  onError?: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [over, setOver] = useState(false);

  function take(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (!incoming.length) return;
    const ok: File[] = [];
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    for (const file of incoming) {
      if (file.size > maxBytes) {
        onError?.(`«${file.name}» больше ${limitMb} МБ`);
        continue;
      }
      ok.push(file);
    }
    if (ok.length) onFiles(multiple ? ok : ok.slice(0, 1));
  }

  return (
    <label
      className={`file-drop${over ? " is-over" : ""}${disabled ? " is-disabled" : ""}`}
      onDragEnter={(e) => {
        e.preventDefault();
        if (disabled) return;
        dragDepth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = disabled ? "none" : "copy";
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setOver(false);
        if (disabled) return;
        take(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files) take(e.target.files);
          e.target.value = "";
        }}
      />
      <span className="file-drop__icon">
        <IconUpload />
      </span>
      <span className="file-drop__title">{title}</span>
      <span className="file-drop__hint">{hint}</span>
    </label>
  );
}

export function FileStoreRow({
  name,
  kind,
  href,
  onRename,
  onRemove,
}: {
  name: string;
  kind?: string;
  href?: string;
  onRename?: (name: string) => void;
  onRemove?: () => void;
}) {
  const meta = fileKindMeta(kind, name);
  const icon = <FileTypeIcon tone={meta.tone} ext={meta.ext} />;
  const body = (
    <div className="file-store__meta">
      {onRename ? (
        <input
          className="file-store__input"
          value={name}
          onChange={(e) => onRename(e.target.value)}
          aria-label="Название файла"
        />
      ) : (
        <span className="file-store__name">{name}</span>
      )}
      <span className="file-store__sub">{meta.label}</span>
    </div>
  );
  const className = `file-store__row${onRemove ? " file-store__row--editable" : ""}`;

  if (href && !onRename) {
    return (
      <a className={className} href={href} download={name || "файл"}>
        {icon}
        {body}
      </a>
    );
  }

  return (
    <div className={className}>
      {href ? (
        <a className="file-store__icon-link" href={href} download={name || "файл"}>
          {icon}
        </a>
      ) : (
        icon
      )}
      {body}
      {onRemove ? (
        <button type="button" className="proj-settings-remove" onClick={onRemove} aria-label="Удалить">
          ×
        </button>
      ) : null}
    </div>
  );
}
