"use client";

import { useAuth } from "./AuthProvider";

/** @deprecated prefer useAuth — kept for existing imports */
export function useDemoRole() {
  const { role, cfg } = useAuth();
  return { role, cfg };
}
