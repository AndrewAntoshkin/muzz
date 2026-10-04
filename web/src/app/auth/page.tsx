import { Suspense } from "react";
import { demoLoginEnabled } from "@/lib/env";
import { AuthView } from "./AuthView";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="auth-boot">Загрузка…</div>}>
      <AuthView
        demoEnabled={demoLoginEnabled()}
        captchaSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null}
      />
    </Suspense>
  );
}
