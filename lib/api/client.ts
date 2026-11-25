import { API_PREFIX, PUBLIC_API_URL } from "@/lib/env";
import { tokenStore } from "@/lib/auth/token-store";
import type { AuthSession } from "@/types/api";
import { ApiError } from "./errors";

type Query = Record<string, string | number | boolean | undefined | null>;
interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  /** Return the raw Response (for file downloads). */
  raw?: boolean;
  signal?: AbortSignal;
}

let onAuthLost: (() => void) | null = null;
/** Called when the session can't be refreshed (e.g. redirect to /login). */
export function setOnAuthLost(fn: () => void) {
  onAuthLost = fn;
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const body = await res.json();
    if (body?.error) return new ApiError(res.status, body.error.code, body.error.message, body.error.details);
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(res.status, res.status >= 500 ? "INTERNAL_ERROR" : "HTTP_ERROR", res.statusText || "Request failed");
}

let refreshing: Promise<AuthSession | null> | null = null;

/**
 * Exchanges the httpOnly refresh cookie for a new access token via our own route handler.
 * Refresh tokens rotate and reuse revokes every session, so refreshes are de-duplicated within a
 * tab and serialised across tabs with the Web Locks API.
 */
export function refreshSession(): Promise<AuthSession | null> {
  if (refreshing) return refreshing;
  const run = async () => {
    let res: Response;
    try {
      res = await fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" });
    } catch {
      throw new ApiError(0, "NETWORK", "Network error");
    }
    if (res.status === 401) {
      // Session is gone (expired/revoked); the route handler has already cleared the cookies.
      tokenStore.clear();
      return null;
    }
    if (!res.ok) throw await parseError(res); // API down etc. – don't log the user out for that
    const session = (await res.json()) as AuthSession;
    tokenStore.set(session);
    return session;
  };
  const locks = typeof navigator !== "undefined" ? (navigator as Navigator & { locks?: LockManager }).locks : undefined;
  const p: Promise<AuthSession | null> = (
    locks ? (locks.request("ablesprout-refresh", run) as unknown as Promise<AuthSession | null>) : run()
  ).finally(() => {
    refreshing = null;
  });
  refreshing = p;
  return p;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${PUBLIC_API_URL}${API_PREFIX}${path}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const send = () => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    if (tokenStore.token) headers.Authorization = `Bearer ${tokenStore.token}`;
    return fetch(buildUrl(path, opts.query), {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  };

  let res: Response;
  try {
    if (!tokenStore.token) await refreshSession();
    res = await send();
    if (res.status === 401) {
      const session = await refreshSession();
      if (!session) {
        onAuthLost?.();
        throw await parseError(res);
      }
      res = await send();
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK", "Network error");
  }

  if (!res.ok) throw await parseError(res);
  if (opts.raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Fetches an authenticated file and triggers a browser download. */
export async function downloadFile(path: string, fallbackName: string) {
  const res = await request<Response>(path, { raw: true });
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const name = /filename="?([^"]+)"?/.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
