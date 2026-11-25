import type { AuthSession, Language } from "@/types/api";
import { tokenStore } from "@/lib/auth/token-store";
import { ApiError } from "./errors";
import { refreshSession } from "./client";

/** Auth goes through same-origin Next.js route handlers that own the httpOnly refresh cookie. */
async function authPost<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Network error");
  }
  const data = res.status === 204 ? undefined : await res.json().catch(() => undefined);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.code ?? "HTTP_ERROR", data?.error?.message ?? "Request failed", data?.error?.details);
  }
  return data as T;
}

export interface RegisterSchoolInput {
  school: { name: string; city: string; state: string; board?: string };
  admin: { name: string; email: string; password: string; phone?: string; preferredLanguage: Language };
}

export const authApi = {
  async login(email: string, password: string) {
    const session = await authPost<AuthSession>("login", { email, password });
    tokenStore.set(session);
    return session;
  },
  async registerSchool(input: RegisterSchoolInput) {
    const session = await authPost<AuthSession>("register-school", input);
    tokenStore.set(session);
    return session;
  },
  refresh: refreshSession,
  async logout() {
    try {
      await authPost<void>("logout");
    } finally {
      tokenStore.clear();
    }
  },
};
