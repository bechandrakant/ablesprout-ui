"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, fieldAria } from "@/components/common/field";

export function PilotForm() {
  const t = useTranslations("landing");
  const v = useTranslations("validation");
  const [done, setDone] = useState(false);

  const schema = z.object({
    schoolName: z.string().trim().min(2, v("min", { min: 2 })),
    contactName: z.string().trim().min(2, v("min", { min: 2 })),
    email: z.string().trim().email(v("email")),
    phone: z.string().trim().regex(/^$|^\+?[0-9\s-]{7,20}$/, v("phone")),
    city: z.string().trim().min(1, v("required")),
    students: z.string().regex(/^\d*$/, v("number", { min: 1, max: 100000 })),
    message: z.string().max(2000),
    website: z.string().max(0), // honeypot
  });
  type Values = z.infer<typeof schema>;

  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { schoolName: "", contactName: "", email: "", phone: "", city: "", students: "", message: "", website: "" },
  });
  const e = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    const res = await fetch("/api/pilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, students: values.students ? Number(values.students) : undefined }),
    }).catch(() => null);
    if (!res?.ok) {
      const body = await res?.json().catch(() => null);
      toast.error(body?.error?.message ?? "Could not send. Please email hello@ablesprout.com.");
      return;
    }
    setDone(true);
  });

  if (done) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-12 text-brand-teal-dark" aria-hidden />
        <p className="text-lg font-semibold">{t("pilotThanks")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field id="p-school" label={t("pilotSchool")} error={e.schoolName?.message} required>
        <Input {...register("schoolName")} {...fieldAria("p-school", e.schoolName?.message)} autoComplete="organization" />
      </Field>
      <Field id="p-name" label={t("pilotContact")} error={e.contactName?.message} required>
        <Input {...register("contactName")} {...fieldAria("p-name", e.contactName?.message)} autoComplete="name" />
      </Field>
      <Field id="p-email" label={t("pilotEmail")} error={e.email?.message} required>
        <Input type="email" {...register("email")} {...fieldAria("p-email", e.email?.message)} autoComplete="email" />
      </Field>
      <Field id="p-phone" label={t("pilotPhone")} error={e.phone?.message}>
        <Input type="tel" {...register("phone")} {...fieldAria("p-phone", e.phone?.message)} autoComplete="tel" inputMode="tel" />
      </Field>
      <Field id="p-city" label={t("pilotCity")} error={e.city?.message} required>
        <Input {...register("city")} {...fieldAria("p-city", e.city?.message)} autoComplete="address-level2" />
      </Field>
      <Field id="p-students" label={t("pilotStudents")} error={e.students?.message}>
        <Input inputMode="numeric" {...register("students")} {...fieldAria("p-students", e.students?.message)} />
      </Field>
      <Field id="p-msg" label={t("pilotMessage")} className="sm:col-span-2">
        <Textarea {...register("message")} id="p-msg" rows={3} />
      </Field>
      <div aria-hidden className="hidden">
        <label htmlFor="p-website">Website</label>
        <input id="p-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={formState.isSubmitting} className="w-full bg-brand-orange text-ink hover:bg-amber-400 sm:w-auto">
          {formState.isSubmitting ? t("pilotSubmitting") : t("pilotSubmit")}
        </Button>
      </div>
    </form>
  );
}
