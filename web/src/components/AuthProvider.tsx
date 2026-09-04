"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SessionUser } from "@/lib/session";
import { DEMO_ROLES, parseRole, ROLE_STORE, type DemoRole, type RoleId } from "@/lib/roles";
import { useSearchParams } from "next/navigation";

type AuthState = {
  user: SessionUser | null;
  loading: boolean;
  role: RoleId;
  cfg: DemoRole;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function cfgFromSession(user: SessionUser, role: RoleId): DemoRole {
  const base = DEMO_ROLES[role];
  if (user.isDemo) return base;
  return {
    ...base,
    firstName: user.firstName || base.firstName,
    name: user.name || base.name,
    avatar: "",
    profile: user.personSlug ? `/people/${user.personSlug}` : base.profile,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("role");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoRole, setDemoRole] = useState<RoleId>(parseRole(fromUrl));

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: SessionUser };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user?.isDemo) return;
    if (fromUrl) {
      const next = parseRole(fromUrl);
      setDemoRole(next);
      try {
        localStorage.setItem(ROLE_STORE, next);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      setDemoRole(parseRole(localStorage.getItem(ROLE_STORE)));
    } catch {
      setDemoRole("actor");
    }
  }, [fromUrl, user?.isDemo]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    window.location.href = "/auth";
  }, []);

  const role: RoleId = user?.isDemo ? demoRole : user?.role || "actor";
  const cfg = useMemo(
    () => (user ? cfgFromSession(user, role) : DEMO_ROLES[role]),
    [user, role],
  );

  const value: AuthState = {
    user,
    loading,
    role,
    cfg,
    refresh,
    logout,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
