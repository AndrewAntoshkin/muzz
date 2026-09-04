"use client";

import { Suspense } from "react";
import { AuthView } from "./AuthView";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="auth-boot">Загрузка…</div>}>
      <AuthView />
    </Suspense>
  );
}
