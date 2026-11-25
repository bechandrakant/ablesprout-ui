"use client";

import { Accessibility } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useA11y } from "@/components/providers/a11y-provider";

export function A11yToggle({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("common");
  const { prefs, update } = useA11y();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size={compact ? "icon" : "default"} aria-label={compact ? t("accessibility") : undefined}>
            <Accessibility aria-hidden />
            {!compact && <span>{t("accessibility")}</span>}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-64 p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-base text-muted-foreground">{t("accessibilityHint")}</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            className="min-h-11 text-base"
            checked={prefs.largeText}
            onCheckedChange={(v) => update({ largeText: Boolean(v) })}
          >
            {t("largerText")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            className="min-h-11 text-base"
            checked={prefs.dyslexicFont}
            onCheckedChange={(v) => update({ dyslexicFont: Boolean(v) })}
          >
            {t("dyslexiaFont")}
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
