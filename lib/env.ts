/** Browser-visible API origin (no trailing slash, no /api/v1). */
export const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
export const API_PREFIX = "/api/v1";
