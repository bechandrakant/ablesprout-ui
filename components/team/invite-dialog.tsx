"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, fieldAria } from "@/components/common/field";
import { PasswordInput } from "@/components/auth/password-input";
import { errorMessage, usersApi } from "@/lib/api";

export function InviteDialog({ open, onOpenChange, defaultRole = "EDUCATOR" }: { open: boolean; onOpenChange: (o: boolean) => void; defaultRole?: "EDUCATOR" | "PARENT" }) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const tr = useTranslations("enums.role");
  const v = useTranslations("validation");
  const qc = useQueryClient();
  const [temp, setTemp] = useState<{ email: string; password: string } | null>(null);

  const schema = z.object({
    role: z.enum(["EDUCATOR", "PARENT"]),
    name: z.string().trim().min(1, v("required")),
    email: z.string().trim().email(v("email")),
    phone: z.string().trim().regex(/^$|^\+?[0-9\s-]{7,20}$/, v("phone")),
    preferredLanguage: z.enum(["en", "hi"]),
    password: z.string().refine((p) => p === "" || p.length >= 8, v("min", { min: 8 })),
  });
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole, name: "", email: "", phone: "", preferredLanguage: "en", password: "" },
  });
  const e = formState.errors;
  useEffect(() => {
    if (open) {
      reset({ role: defaultRole, name: "", email: "", phone: "", preferredLanguage: "en", password: "" });
      setTemp(null);
    }
  }, [open, defaultRole, reset]);

  const invite = useMutation({
    mutationFn: (d: Values) => usersApi.invite({ ...d, phone: d.phone || undefined, password: d.password || undefined }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("invited", { name: res.user.name }));
      if (res.temporaryPassword) setTemp({ email: res.user.email, password: res.temporaryPassword });
      else onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {temp ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{t("tempPassword", { email: temp.email })}</DialogTitle>
              <DialogDescription className="text-base">{t("tempPasswordBody")}</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-xl border bg-muted p-3">
              <KeyRound className="size-5 text-primary" aria-hidden />
              <code className="flex-1 font-mono text-lg">{temp.password}</code>
              <Button
                variant="outline"
                onClick={() => navigator.clipboard?.writeText(temp.password).then(() => toast.success(t("copied")))}
              >
                <Copy aria-hidden /> {t("copy")}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>{tc("close")}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{t("invite")}</DialogTitle>
            </DialogHeader>
            <form id="invite-form" noValidate onSubmit={handleSubmit((d) => invite.mutate(d))} className="grid gap-4 sm:grid-cols-2">
              <Field id="i-role" label={t("role")}>
                <NativeSelect id="i-role" {...register("role")}>
                  <option value="EDUCATOR">{tr("EDUCATOR")}</option>
                  <option value="PARENT">{tr("PARENT")}</option>
                </NativeSelect>
              </Field>
              <Field id="i-lang" label={t("language")}>
                <NativeSelect id="i-lang" {...register("preferredLanguage")}>
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                </NativeSelect>
              </Field>
              <Field id="i-name" label={t("name")} error={e.name?.message} required className="sm:col-span-2">
                <Input autoComplete="off" {...register("name")} {...fieldAria("i-name", e.name?.message)} />
              </Field>
              <Field id="i-email" label={t("email")} error={e.email?.message} required>
                <Input type="email" autoComplete="off" {...register("email")} {...fieldAria("i-email", e.email?.message)} />
              </Field>
              <Field id="i-phone" label={`${t("phone")} (${tc("optional")})`} error={e.phone?.message}>
                <Input type="tel" {...register("phone")} {...fieldAria("i-phone", e.phone?.message)} />
              </Field>
              <Field id="i-pass" label={`${t("password")} (${tc("optional")})`} hint={t("passwordHint")} error={e.password?.message} className="sm:col-span-2">
                <PasswordInput autoComplete="new-password" {...register("password")} {...fieldAria("i-pass", e.password?.message, true)} />
              </Field>
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
              <Button type="submit" form="invite-form" disabled={invite.isPending}>{invite.isPending ? tc("saving") : t("invite")}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
