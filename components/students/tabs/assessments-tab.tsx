"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/common/field";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { RoleGate } from "@/components/providers/auth-provider";
import { useAssessments } from "@/hooks/queries";
import { assessmentsApi, errorMessage } from "@/lib/api";
import { formatDate, today } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { ASSESSMENT_TYPES, DOMAINS, type Student } from "@/types/api";
import { cn } from "@/lib/utils";

const RATING_TONE = ["", "bg-red-100 text-red-900", "bg-orange-100 text-orange-900", "bg-amber-100 text-amber-900", "bg-lime-100 text-lime-900", "bg-teal-100 text-teal-900"];

/** 1–5 rating as a radio group of large tap targets. */
function RatingInput({ name, value, onChange, label }: { name: string; value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={cn("grid size-11 cursor-pointer place-items-center rounded-lg border-2 font-semibold has-checked:border-primary has-focus-visible:outline-3 has-focus-visible:outline-primary", value === n ? RATING_TONE[n] : "bg-white")}>
          <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
          {n}
        </label>
      ))}
    </div>
  );
}

function NewAssessmentDialog({ student, open, onOpenChange }: { student: Student; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("assessments");
  const tc = useTranslations("common");
  const te = useTranslations("enums");
  const qc = useQueryClient();

  const schema = z.object({
    type: z.enum(ASSESSMENT_TYPES),
    domain: z.enum(DOMAINS),
    date: z.string().min(1),
    skills: z.array(z.object({ name: z.string().trim(), rating: z.number().int().min(1).max(5) })),
    observations: z.string().max(5000),
  }).refine((v) => v.skills.some((s) => s.name), { path: ["skills"], message: t("skillsRequired") });
  type Values = z.infer<typeof schema>;
  const defaults: Values = { type: "OBSERVATION", domain: "READING", date: today(), skills: [{ name: "", rating: 3 }], observations: "" };
  const { register, control, handleSubmit, formState, reset, watch, setValue } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });
  const skills = useFieldArray({ control, name: "skills" });
  useEffect(() => {
    if (open) reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mutation = useMutation({
    mutationFn: (d: Values) =>
      assessmentsApi.create(student.id, {
        type: d.type,
        domain: d.domain,
        date: d.date,
        observations: d.observations || undefined,
        scores: Object.fromEntries(d.skills.filter((s) => s.name).map((s) => [s.name.replace(/[$.]/g, " ").trim(), s.rating])),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.assessments(student.id) });
      toast.success(t("saved"));
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("new")}</DialogTitle>
        </DialogHeader>
        <form id="assessment-form" noValidate onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="a-type" label={t("type")}>
              <NativeSelect id="a-type" {...register("type")}>
                {ASSESSMENT_TYPES.map((x) => <option key={x} value={x}>{te(`assessmentType.${x}`)}</option>)}
              </NativeSelect>
            </Field>
            <Field id="a-domain" label={t("domain")}>
              <NativeSelect id="a-domain" {...register("domain")}>
                {DOMAINS.map((x) => <option key={x} value={x}>{te(`domain.${x}`)}</option>)}
              </NativeSelect>
            </Field>
            <Field id="a-date" label={t("date")}>
              <Input id="a-date" type="date" max={today()} {...register("date")} />
            </Field>
          </div>
          <fieldset>
            <legend className="font-medium text-ink">{t("skills")}</legend>
            <p className="mb-3 text-muted-foreground">{t("skillsHint")}</p>
            <ul className="flex flex-col gap-3">
              {skills.fields.map((f, i) => {
                const name = watch(`skills.${i}.name`) || `${t("skillName")} ${i + 1}`;
                return (
                  <li key={f.id} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center">
                    <label htmlFor={`skill-${i}`} className="sr-only">{t("skillName")} {i + 1}</label>
                    <Input id={`skill-${i}`} placeholder={t("skillPlaceholder")} {...register(`skills.${i}.name`)} className="sm:flex-1" />
                    <RatingInput
                      name={`rating-${f.id}`}
                      label={t("rating", { skill: name })}
                      value={watch(`skills.${i}.rating`)}
                      onChange={(v) => setValue(`skills.${i}.rating`, v)}
                    />
                    {skills.fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" aria-label={t("removeSkill", { name })} onClick={() => skills.remove(i)}>
                        <Trash2 aria-hidden />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            {formState.errors.skills?.message && <p role="alert" className="mt-2 font-medium text-destructive">{formState.errors.skills.message}</p>}
            <Button type="button" variant="outline" className="mt-3" onClick={() => skills.append({ name: "", rating: 3 })} disabled={skills.fields.length >= 15}>
              <Plus aria-hidden /> {t("addSkill")}
            </Button>
          </fieldset>
          <Field id="a-obs" label={t("observations")}>
            <Textarea id="a-obs" rows={4} placeholder={t("observationsPlaceholder")} {...register("observations")} />
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button type="submit" form="assessment-form" disabled={mutation.isPending}>{mutation.isPending ? tc("saving") : t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AssessmentsTab({ student, openNew = false }: { student: Student; openNew?: boolean }) {
  const t = useTranslations("assessments");
  const te = useTranslations("enums");
  const locale = useLocale();
  const [open, setOpen] = useState(openNew);
  const { data, isLoading, error, refetch } = useAssessments(student.id);

  const newButton = (
    <RoleGate roles={["ADMIN", "EDUCATOR"]}>
      <Button onClick={() => setOpen(true)}><Plus aria-hidden /> {t("new")}</Button>
    </RoleGate>
  );

  return (
    <section aria-labelledby="assess-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="assess-title" className="text-xl font-semibold">{t("title")}</h2>
        {!!data?.data.length && newButton}
      </div>
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : !data?.data.length ? (
        <EmptyState icon={ClipboardList} title={t("emptyTitle")} body={t("emptyBody")} action={newButton} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.data.map((a) => {
            const entries = Object.entries(a.scores);
            const avg = entries.length ? entries.reduce((s, [, v]) => s + v, 0) / entries.length : 0;
            return (
              <li key={a.id} className="card-soft p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {te(`domain.${a.domain}`)} <span className="font-normal text-muted-foreground">· {te(`assessmentType.${a.type}`)}</span>
                  </p>
                  <span className="text-muted-foreground">{formatDate(a.date, locale)}</span>
                </div>
                <p className="mt-1 font-medium text-brand-teal-dark">{t("average", { value: avg.toFixed(1) })}</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {entries.map(([skill, v]) => (
                    <li key={skill} className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 truncate">{skill}</span>
                      <span className="flex gap-0.5" aria-label={`${v} / 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} aria-hidden className={cn("h-3 w-5 rounded-sm", n <= v ? "bg-primary" : "bg-muted")} />
                        ))}
                      </span>
                      <span className="w-8 text-right font-semibold">{v}/5</span>
                    </li>
                  ))}
                </ul>
                {a.observations && <p className="mt-3 border-t pt-3 text-muted-foreground">{a.observations}</p>}
              </li>
            );
          })}
        </ul>
      )}
      <NewAssessmentDialog student={student} open={open} onOpenChange={setOpen} />
    </section>
  );
}
