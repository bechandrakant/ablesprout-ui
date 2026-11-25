"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { PasswordInput } from "@/components/auth/password-input";
import { useA11y } from "@/components/providers/a11y-provider";
import { useUser } from "@/components/providers/auth-provider";
import { errorMessage, usersApi } from "@/lib/api";
import { tokenStore } from "@/lib/auth/token-store";
import { setLocaleCookie } from "@/lib/locale-cookie";
import type { Language } from "@/types/api";

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex min-h-14 cursor-pointer items-center gap-4 rounded-xl border p-4 has-checked:border-primary has-checked:bg-accent">
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        <span className="block text-muted-foreground">{hint}</span>
      </span>
      <input id={id} type="checkbox" role="switch" aria-checked={checked} checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-6" />
    </label>
  );
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const v = useTranslations("validation");
  const user = useUser();
  const locale = useLocale();
  const router = useRouter();
  const { prefs, update } = useA11y();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [language, setLanguage] = useState<Language>(user.preferredLanguage);
  const [password, setPassword] = useState("");

  const saveProfile = useMutation({
    mutationFn: () => usersApi.update(user.id, { name: name.trim(), phone: phone.trim() || null, preferredLanguage: language }),
    onSuccess: ({ user: u }) => {
      tokenStore.setUser({ ...user, ...u });
      toast.success(t("saved"));
      if (language !== locale) {
        setLocaleCookie(language);
        router.refresh();
      }
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const changePassword = useMutation({
    mutationFn: () => usersApi.update(user.id, { password }),
    onSuccess: () => {
      setPassword("");
      toast.success(t("passwordChanged"));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={t("profile")}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) saveProfile.mutate();
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="st-name" className="font-medium">{t("name")}</label>
              <Input id="st-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="st-email" className="font-medium">{t("email")}</label>
              <Input id="st-email" value={user.email} readOnly aria-describedby="st-email-hint" className="bg-muted" />
              <p id="st-email-hint" className="text-muted-foreground">{t("emailHint")}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="st-phone" className="font-medium">{t("phone")}</label>
              <Input id="st-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="st-lang" className="font-medium">{t("language")}</label>
              <NativeSelect id="st-lang" value={language} onChange={(e) => setLanguage(e.target.value as Language)} aria-describedby="st-lang-hint">
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
              </NativeSelect>
              <p id="st-lang-hint" className="text-muted-foreground">{t("languageHint")}</p>
            </div>
            <Button type="submit" className="self-start" disabled={saveProfile.isPending}>{saveProfile.isPending ? tc("saving") : tc("saveChanges")}</Button>
          </form>
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard title={t("accessibility")}>
            <p className="mb-3 text-muted-foreground">{t("accessibilityHint")}</p>
            <div className="flex flex-col gap-3">
              <Toggle id="st-large" label={tc("largerText")} hint={t("largerTextHint")} checked={prefs.largeText} onChange={(v) => update({ largeText: v })} />
              <Toggle id="st-dys" label={tc("dyslexiaFont")} hint={t("dyslexiaHint")} checked={prefs.dyslexicFont} onChange={(v) => update({ dyslexicFont: v })} />
            </div>
          </SectionCard>

          <SectionCard title={t("password")}>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (password.length >= 8) changePassword.mutate();
                else toast.error(v("min", { min: 8 }));
              }}
            >
              <label htmlFor="st-pass" className="font-medium">{t("newPassword")}</label>
              <PasswordInput id="st-pass" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} />
              <Button type="submit" variant="outline" className="self-start" disabled={changePassword.isPending}>{t("password")}</Button>
            </form>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
