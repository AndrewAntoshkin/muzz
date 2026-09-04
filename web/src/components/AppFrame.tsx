"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Shell } from "./Shell";
import { WorkspaceProvider } from "./useWorkspace";
import { useAuth } from "./AuthProvider";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loading } = useAuth();

  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="auth-boot">Загрузка…</div>;
  }

  return (
    <WorkspaceProvider>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}
