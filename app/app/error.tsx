"use client";

import { ErrorState } from "@/components/common/error-state";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState error={error} onRetry={reset} />;
}
