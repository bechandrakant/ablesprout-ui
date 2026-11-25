import type { User } from "@/types/api";

/**
 * The access token lives only in memory (never localStorage), so XSS can't lift a long-lived
 * credential. The refresh token is an httpOnly cookie handled by /api/auth/* route handlers.
 */
let accessToken: string | null = null;
let currentUser: User | null = null;
const listeners = new Set<(u: User | null) => void>();

export const tokenStore = {
  get token() {
    return accessToken;
  },
  get user() {
    return currentUser;
  },
  set(session: { accessToken: string; user?: User | null }) {
    accessToken = session.accessToken;
    if (session.user !== undefined) {
      currentUser = session.user;
      listeners.forEach((l) => l(currentUser));
    }
  },
  setUser(user: User) {
    currentUser = user;
    listeners.forEach((l) => l(currentUser));
  },
  clear() {
    accessToken = null;
    currentUser = null;
    listeners.forEach((l) => l(null));
  },
  subscribe(fn: (u: User | null) => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
