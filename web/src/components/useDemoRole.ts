"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DEMO_ROLES, parseRole, ROLE_STORE, type RoleId } from "@/lib/roles";

export function useDemoRole() {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("role");
  const [role, setRole] = useState<RoleId>(parseRole(fromUrl));

  useEffect(() => {
    if (fromUrl) {
      const next = parseRole(fromUrl);
      setRole(next);
      try {
        localStorage.setItem(ROLE_STORE, next);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const stored = parseRole(localStorage.getItem(ROLE_STORE));
      setRole(stored);
    } catch {
      setRole("actor");
    }
  }, [fromUrl]);

  return { role, cfg: DEMO_ROLES[role] };
}
