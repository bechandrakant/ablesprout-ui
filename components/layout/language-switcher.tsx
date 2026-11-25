"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setLocaleCookie } from "@/lib/locale-cookie";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, start] = useTransition();

  const choose = (l: Locale) => {
    if (l === locale) return;
    setLocaleCookie(l);
    start(() => router.refresh());
  };

  return (
    <div role="group" aria-label={t("language")} className={cn("inline-flex items-center rounded-lg border bg-white p-0.5", className)}>
      <Languages className="mx-1.5 size-4 text-muted-foreground" aria-hidden />
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          disabled={pending}
          onClick={() => choose(l)}
          className={cn(
            "h-9 min-w-11 rounded-md px-2 font-semibold transition-colors",
            locale === l ? "bg-primary text-white" : "text-ink hover:bg-muted",
          )}
        >
          {l === "en" ? "EN" : "हिं"}
          <span className="sr-only"> – {l === "en" ? t("english") : t("hindi")}</span>
        </button>
      ))}
    </div>
  );
}
