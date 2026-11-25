"use client";

import { useTranslations } from "next-intl";
import type { DisabilityCategory } from "@/types/api";

export function CategoryChips({ categories, max }: { categories: DisabilityCategory[]; max?: number }) {
  const t = useTranslations("enums.category");
  const tc = useTranslations("students");
  if (!categories.length) return <span className="text-muted-foreground">{tc("noNeeds")}</span>;
  const shown = max ? categories.slice(0, max) : categories;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={tc("needs")}>
      {shown.map((c) => (
        <li key={c} className="rounded-full bg-secondary px-2.5 py-0.5 text-secondary-foreground">
          {t(c)}
        </li>
      ))}
      {max && categories.length > max && <li className="rounded-full bg-muted px-2.5 py-0.5">+{categories.length - max}</li>}
    </ul>
  );
}
