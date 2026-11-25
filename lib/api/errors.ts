import type { ApiErrorBody } from "@/types/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: ApiErrorBody["error"]["details"],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Friendly copy for errors where the API's own message isn't the best thing to show. */
const FRIENDLY: Record<string, string> = {
  NETWORK: "We couldn't reach AbleSprout. Check your internet connection and try again.",
  RATE_LIMITED: "That's a lot of requests in a short time. Please wait a minute and try again.",
  AI_UNAVAILABLE: "The AI assistant isn't available right now. You can still write this by hand.",
  AI_RATE_LIMITED: "The AI assistant is busy. Please try again in a minute.",
  INTERNAL_ERROR: "Something went wrong on our side. Please try again.",
};

export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof ApiError) {
    if (err.code === "VALIDATION_ERROR" && err.details?.length) {
      return `${err.message}: ${err.details.map((d) => `${d.path || "field"} – ${d.message}`).join("; ")}`;
    }
    return FRIENDLY[err.code] ?? err.message ?? fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
