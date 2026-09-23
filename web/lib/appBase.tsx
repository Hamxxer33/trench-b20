"use client";

import { createContext, useContext, type ReactNode } from "react";

const AppBaseContext = createContext("");

export function AppBaseProvider({ base, children }: { base: string; children: ReactNode }) {
  return <AppBaseContext.Provider value={base}>{children}</AppBaseContext.Provider>;
}

export function useAppBase() {
  return useContext(AppBaseContext);
}

export function withBase(base: string, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}
