"use client";

import { Suspense } from "react";
import { Messenger } from "@/components/Messenger";

export default function MessagesPage() {
  return (
    <div className="app-main__body app-main__body--messages">
      <main className="page-area" style={{ padding: 0, overflow: "hidden" }}>
        <Suspense fallback={<p className="msg-thread__empty">Загрузка…</p>}>
          <Messenger />
        </Suspense>
      </main>
    </div>
  );
}
