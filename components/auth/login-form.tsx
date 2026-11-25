"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, fieldAria } from "@/components/common/field";
import { PasswordInput } from "./password-input";
import { authApi, errorMessage } from "@/lib/api";
import { setLocaleCookie } from "@/lib/locale-cookie";

/** Only allow same-site relative redirects after login (no open redirects). */
const safeNext = (n: string | null) => (n && n.startsWith("/app") && !n.startsWith("//") ? n : "/app/dashboard");

export function LoginForm() {
  const t = useTranslations("auth");
  const v = useTranslations("validation");
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const [formError, setFormError] = useState<string>();

  const schema = z.object({
    email: z.string().trim().email(v("email")),
    password: z.string().min(1, v("required")),
  });
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const e = formState.errors;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(undefined);
    try {
      const { user } = await authApi.login(email, password);
      if (user.preferredLanguage && user.preferredLanguage !== locale) setLocaleCookie(user.preferredLanguage);
      router.replace(safeNext(params.get("next")));
      router.refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {params.get("expired") && !formError && (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-amber-900">
          {t("sessionExpired")}
        </p>
      )}
      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 font-medium text-destructive">
          {formError}
        </p>
      )}
      <Field id="email" label={t("email")} error={e.email?.message} required>
        <Input type="email" autoComplete="email" inputMode="email" {...register("email")} {...fieldAria("email", e.email?.message)} />
      </Field>
      <Field id="password" label={t("password")} error={e.password?.message} required>
        <PasswordInput autoComplete="current-password" {...register("password")} {...fieldAria("password", e.password?.message)} />
      </Field>
      <Button type="submit" size="lg" disabled={formState.isSubmitting} className="mt-2 w-full">
        {formState.isSubmitting ? t("signingIn") : t("signIn")}
      </Button>
      <p className="text-center text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/register-school" className="font-semibold text-primary underline-offset-4 hover:underline">
          {t("registerLink")}
        </Link>
      </p>
      <p className="rounded-lg bg-muted p-3 text-center text-muted-foreground">{t("demoHint")}</p>
    </form>
  );
}
