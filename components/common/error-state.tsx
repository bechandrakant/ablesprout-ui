"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/errors";

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useTranslations("common");
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-red-50 px-6 py-8 text-center">
      <AlertTriangle className="size-8 text-destructive" aria-hidden />
      <p className="font-semibold">{t("errorTitle")}</p>
      <p className="max-w-md text-muted-foreground">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
