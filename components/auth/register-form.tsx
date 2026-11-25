"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, fieldAria } from "@/components/common/field";
import { PasswordInput } from "./password-input";
import { authApi, errorMessage } from "@/lib/api";
import { setLocaleCookie } from "@/lib/locale-cookie";

export function RegisterForm() {
  const t = useTranslations("auth");
  const v = useTranslations("validation");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [formError, setFormError] = useState<string>();

  const schema = z.object({
    schoolName: z.string().trim().min(2, v("min", { min: 2 })),
    city: z.string().trim().min(1, v("required")),
    state: z.string().trim().min(1, v("required")),
    board: z.string().trim().max(50),
    name: z.string().trim().min(1, v("required")),
    email: z.string().trim().email(v("email")),
    phone: z.string().trim().regex(/^$|^\+?[0-9\s-]{7,20}$/, v("phone")),
    password: z.string().min(8, v("min", { min: 8 })),
    preferredLanguage: z.enum(["en", "hi"]),
  });
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { schoolName: "", city: "", state: "", board: "", name: "", email: "", phone: "", password: "", preferredLanguage: locale === "hi" ? "hi" : "en" },
  });
  const e = formState.errors;

  const onSubmit = handleSubmit(async (d) => {
    setFormError(undefined);
    try {
      await authApi.registerSchool({
        school: { name: d.schoolName, city: d.city, state: d.state, board: d.board || undefined },
        admin: { name: d.name, email: d.email, password: d.password, phone: d.phone || undefined, preferredLanguage: d.preferredLanguage },
      });
      if (d.preferredLanguage !== locale) setLocaleCookie(d.preferredLanguage);
      router.replace("/app/dashboard");
      router.refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 font-medium text-destructive">
          {formError}
        </p>
      )}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-heading text-lg font-semibold">{t("schoolSection")}</legend>
        <Field id="schoolName" label={t("schoolName")} error={e.schoolName?.message} required className="sm:col-span-2">
          <Input autoComplete="organization" {...register("schoolName")} {...fieldAria("schoolName", e.schoolName?.message)} />
        </Field>
        <Field id="city" label={t("city")} error={e.city?.message} required>
          <Input autoComplete="address-level2" {...register("city")} {...fieldAria("city", e.city?.message)} />
        </Field>
        <Field id="state" label={t("state")} error={e.state?.message} required>
          <Input autoComplete="address-level1" {...register("state")} {...fieldAria("state", e.state?.message)} />
        </Field>
        <Field id="board" label={`${t("board")} (${tc("optional")})`} className="sm:col-span-2">
          <Input placeholder={t("boardPlaceholder")} {...register("board")} id="board" />
        </Field>
      </fieldset>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-heading text-lg font-semibold">{t("adminSection")}</legend>
        <Field id="name" label={t("fullName")} error={e.name?.message} required className="sm:col-span-2">
          <Input autoComplete="name" {...register("name")} {...fieldAria("name", e.name?.message)} />
        </Field>
        <Field id="email" label={t("email")} error={e.email?.message} required>
          <Input type="email" autoComplete="email" {...register("email")} {...fieldAria("email", e.email?.message)} />
        </Field>
        <Field id="phone" label={`${t("phone")} (${tc("optional")})`} error={e.phone?.message}>
          <Input type="tel" autoComplete="tel" {...register("phone")} {...fieldAria("phone", e.phone?.message)} />
        </Field>
        <Field id="password" label={t("password")} hint={t("passwordHint")} error={e.password?.message} required>
          <PasswordInput autoComplete="new-password" {...register("password")} {...fieldAria("password", e.password?.message, true)} />
        </Field>
        <Field id="preferredLanguage" label={t("preferredLanguage")}>
          <NativeSelect id="preferredLanguage" {...register("preferredLanguage")}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </NativeSelect>
        </Field>
      </fieldset>
      <Button type="submit" size="lg" disabled={formState.isSubmitting} className="w-full">
        {formState.isSubmitting ? t("creating") : t("createSchool")}
      </Button>
      <p className="text-center text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
