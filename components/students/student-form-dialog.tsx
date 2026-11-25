"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, fieldAria } from "@/components/common/field";
import { useAuth } from "@/components/providers/auth-provider";
import { useUsers } from "@/hooks/queries";
import { studentsApi, errorMessage } from "@/lib/api";
import { GRADES } from "@/lib/constants";
import { toDateInput, today } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { DISABILITY_CATEGORIES, type DisabilityCategory, type Student } from "@/types/api";

/** Add a student (no `student`) or edit one. */
export function StudentFormDialog({ open, onOpenChange, student }: { open: boolean; onOpenChange: (o: boolean) => void; student?: Student }) {
  const t = useTranslations("students");
  const tc = useTranslations("common");
  const te = useTranslations("enums.category");
  const v = useTranslations("validation");
  const { can } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const isAdmin = can("ADMIN");
  const educators = useUsers("EDUCATOR", open && isAdmin && !student);

  const schema = z.object({
    name: z.string().trim().min(1, v("required")),
    grade: z.string().min(1, v("required")),
    section: z.string().trim().max(10),
    dateOfBirth: z.string(),
    disabilityCategories: z.array(z.enum(DISABILITY_CATEGORIES)),
    notes: z.string().max(5000),
    educatorIds: z.array(z.string()),
  });
  type Values = z.infer<typeof schema>;
  const defaults = (): Values => ({
    name: student?.name ?? "",
    grade: student?.grade ?? "",
    section: student?.section ?? "",
    dateOfBirth: toDateInput(student?.dateOfBirth),
    disabilityCategories: student?.disabilityCategories ?? [],
    notes: student?.notes ?? "",
    educatorIds: [],
  });
  const { register, handleSubmit, formState, reset } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults() });
  const e = formState.errors;
  useEffect(() => {
    if (open) reset(defaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student?.id]);

  const mutation = useMutation({
    mutationFn: async (d: Values) => {
      const body = {
        name: d.name,
        grade: d.grade,
        section: d.section || undefined,
        dateOfBirth: d.dateOfBirth || undefined,
        disabilityCategories: d.disabilityCategories as DisabilityCategory[],
        notes: d.notes || undefined,
      };
      if (student) return (await studentsApi.update(student.id, body)).student;
      return (await studentsApi.create({ ...body, educatorIds: d.educatorIds.length ? d.educatorIds : undefined })).student;
    },
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: qk.student(s.id) });
      toast.success(student ? t("updated") : t("created"));
      onOpenChange(false);
      if (!student) router.push(`/app/students/${s.id}`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{student ? t("overview.editProfile") : t("add")}</DialogTitle>
        </DialogHeader>
        <form id="student-form" onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field id="s-name" label={t("name")} error={e.name?.message} required className="sm:col-span-2">
            <Input {...register("name")} {...fieldAria("s-name", e.name?.message)} autoComplete="off" />
          </Field>
          <Field id="s-grade" label={t("grade")} error={e.grade?.message} required>
            <NativeSelect {...register("grade")} {...fieldAria("s-grade", e.grade?.message)}>
              <option value="">—</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </NativeSelect>
          </Field>
          <Field id="s-section" label={`${t("section")} (${tc("optional")})`}>
            <Input id="s-section" maxLength={10} {...register("section")} />
          </Field>
          <Field id="s-dob" label={`${t("dob")} (${tc("optional")})`}>
            <Input id="s-dob" type="date" max={today()} {...register("dateOfBirth")} />
          </Field>
          <fieldset className="sm:col-span-2">
            <legend className="font-medium text-ink">{t("needs")}</legend>
            <p className="mb-2 text-muted-foreground">{t("needsHint")}</p>
            <div className="grid max-h-56 gap-1 overflow-y-auto rounded-xl border p-2 sm:grid-cols-2">
              {DISABILITY_CATEGORIES.map((c) => (
                <label key={c} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-muted">
                  <input type="checkbox" value={c} className="size-5" {...register("disabilityCategories")} />
                  {te(c)}
                </label>
              ))}
            </div>
          </fieldset>
          <Field id="s-notes" label={t("notes")} className="sm:col-span-2">
            <Textarea id="s-notes" rows={3} placeholder={t("notesPlaceholder")} {...register("notes")} />
          </Field>
          {isAdmin && !student && !!educators.data?.data.length && (
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 font-medium text-ink">{t("assignEducators")}</legend>
              <div className="flex flex-wrap gap-2">
                {educators.data.data.map((u) => (
                  <label key={u.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 has-checked:border-primary has-checked:bg-accent">
                    <input type="checkbox" value={u.id} className="size-5" {...register("educatorIds")} />
                    {u.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button type="submit" form="student-form" disabled={mutation.isPending}>
            {mutation.isPending ? tc("saving") : student ? tc("saveChanges") : t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
