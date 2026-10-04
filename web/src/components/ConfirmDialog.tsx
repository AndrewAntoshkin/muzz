"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Подтверждение необратимых или заметных для других действий. Esc и клик вне окна — отмена. */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = "Отмена",
  danger,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return createPortal(
    <div className="proj-settings-overlay" role="alertdialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirm-dialog__title">{title}</h2>
        {children ? <div className="confirm-dialog__body">{children}</div> : null}
        <div className="confirm-dialog__actions">
          <button ref={cancelRef} type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "btn-primary confirm-dialog__danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Подождите…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
