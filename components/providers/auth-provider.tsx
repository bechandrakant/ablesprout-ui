"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { tokenStore } from "@/lib/auth/token-store";
import { authApi, refreshSession } from "@/lib/api";
import { setOnAuthLost } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { Role, User } from "@/types/api";

type Status = "loading" | "authenticated" | "error";
interface AuthCtx {
  user: User | null;
  status: Status;
  error?: string;
  retry: () => void;
  logout: () => Promise<void>;
  can: (...roles: Role[]) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

/** Restores the session from the refresh cookie on load; used by everything under /app. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(tokenStore.user);
  const [status, setStatus] = useState<Status>(tokenStore.user ? "authenticated" : "loading");
  const [error, setError] = useState<string>();

  const goToLogin = useCallback(() => {
    const next = window.location.pathname + window.location.search;
    // Clear cookies first so middleware doesn't bounce us back from /login.
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      window.location.assign(`/login?next=${encodeURIComponent(next)}&expired=1`);
    });
  }, []);

  const bootstrap = useCallback(async () => {
    setStatus("loading");
    try {
      const session = tokenStore.user ? { user: tokenStore.user } : await refreshSession();
      if (!session) return goToLogin();
      setUser(session.user);
      setStatus("authenticated");
    } catch (err) {
      setError(errorMessage(err));
      setStatus("error");
    }
  }, [goToLogin]);

  useEffect(() => {
    setOnAuthLost(goToLogin);
    const unsub = tokenStore.subscribe((u) => u && setUser(u));
    bootstrap();
    return () => {
      unsub();
    };
  }, [bootstrap, goToLogin]);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    qc.clear();
    router.replace("/login");
  }, [qc, router]);

  const can = useCallback((...roles: Role[]) => !!user && roles.includes(user.role), [user]);

  return <Ctx.Provider value={{ user, status, error, retry: bootstrap, logout, can }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** The signed-in user (only call inside screens rendered after auth has resolved). */
export function useUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("No user");
  return user;
}

/** Renders children only for the given roles: used to hide actions a role can't perform. */
export function RoleGate({ roles, children, fallback = null }: { roles: Role[]; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { can } = useAuth();
  return <>{can(...roles) ? children : fallback}</>;
}
