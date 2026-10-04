"use client";

import { useState } from "react";
import type { AppStatus, Application } from "@/lib/workspace";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * Действия кастинг-директора над откликом. Отклонение просит подтверждения и обратимо:
 * отклонённого можно вернуть в рассмотрение.
 */
export function ResponseActions({
  item,
  onStatus,
  className = "response-sheet__actions",
}: {
  className?: string;
  item: Pick<Application, "status" | "actorName">;
  onStatus: (status: AppStatus) => void | Promise<unknown>;
}) {
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(status: AppStatus) {
    setBusy(true);
    await onStatus(status);
    setBusy(false);
  }

  if (item.status === "declined") {
    return (
      <div className={className}>
        <button type="button" className="btn-secondary" disabled={busy} onClick={() => void run("sent")}>
          Вернуть в рассмотрение
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {item.status !== "shortlist" ? (
        <button type="button" className="btn-secondary" disabled={busy} onClick={() => void run("shortlist")}>
          В шорт-лист
        </button>
      ) : null}
      {item.status !== "invited" ? (
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void run("invited")}>
          Пригласить на очные
        </button>
      ) : null}
      <button type="button" className="btn-secondary" disabled={busy} onClick={() => setConfirmDecline(true)}>
        Отклонить
      </button>
      {confirmDecline ? (
        <ConfirmDialog
          title={`Отклонить отклик${item.actorName ? ` — ${item.actorName}` : ""}?`}
          confirmLabel="Отклонить"
          danger
          busy={busy}
          onCancel={() => setConfirmDecline(false)}
          onConfirm={async () => {
            await run("declined");
            setConfirmDecline(false);
          }}
        >
          Отклик уйдёт в «Отклонённые». Позже его можно вернуть в рассмотрение.
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
