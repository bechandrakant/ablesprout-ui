"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { LineChart as LineIcon, Plus, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { ProgressLineChart } from "@/components/charts";
import { STATUS_STYLES } from "@/components/iep/goal-card";
import { useAuth } from "@/components/providers/auth-provider";
import { useStudentAnalytics, useStudentIeps } from "@/hooks/queries";
import { errorMessage, goalsApi } from "@/lib/api";
import { formatShortDate, today } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import type { Goal, Iep, Paginated, Student, StudentAnalytics } from "@/types/api";

function LogProgressDialog({ goal, student, open, onOpenChange }: { goal: Goal; student: Student; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("progress");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  const [value, setValue] = useState(50);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());
  useEffect(() => {
    if (open) {
      setNote("");
      setDate(today());
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => goalsApi.addProgress(goal.id, { value, note: note.trim() || undefined, date }),
    // Optimistic: the new point appears on the chart immediately.
    onMutate: async () => {
      const key = qk.studentAnalytics(student.id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<StudentAnalytics>(key);
      if (prev) {
        const point = { date: new Date(date).toISOString(), value, note };
        const exists = prev.goals.some((g) => g.goalId === goal.id);
        qc.setQueryData<StudentAnalytics>(key, {
          ...prev,
          goals: exists
            ? prev.goals.map((g) =>
                g.goalId === goal.id
                  ? { ...g, points: [...g.points, point].sort((a, b) => a.date.localeCompare(b.date)), latestValue: value, entries: g.entries + 1, change: value - g.firstValue }
                  : g,
              )
            : [...prev.goals, { goalId: goal.id, iepId: "", iepStatus: "APPROVED", domain: goal.domain, goalText: goal.goalText, goalStatus: goal.status, entries: 1, firstValue: value, latestValue: value, change: 0, points: [point] }],
        });
      }
      onOpenChange(false);
      return { prev };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.studentAnalytics(student.id), ctx.prev);
      toast.error(errorMessage(err));
    },
    onSuccess: () => toast.success(t("logged")),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.studentAnalytics(student.id) });
      qc.invalidateQueries({ queryKey: qk.ieps(student.id) });
      qc.invalidateQueries({ queryKey: qk.recentProgress });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("log")}</DialogTitle>
          <p className="line-clamp-2 text-muted-foreground">{goal.goalText}</p>
        </DialogHeader>
        <form
          id="progress-form"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="pv-range" className="font-medium">{t("value")}</label>
            <p id="pv-hint" className="text-muted-foreground">{t("valueHint")}</p>
            <div className="flex items-center gap-3">
              <input
                id="pv-range"
                type="range"
                min={0}
                max={100}
                step={5}
                value={value}
                aria-describedby="pv-hint"
                onChange={(e) => setValue(Number(e.target.value))}
                className="h-11 flex-1"
              />
              <label htmlFor="pv-number" className="sr-only">{t("value")}</label>
              <Input
                id="pv-number"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={value}
                onChange={(e) => setValue(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                className="w-24"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pv-date" className="font-medium">{t("date")}</label>
            <Input id="pv-date" type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pv-note" className="font-medium">{t("note")}</label>
            <Textarea id="pv-note" rows={3} placeholder={t("notePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button type="submit" form="progress-form">{tc("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProgressTab({ student }: { student: Student }) {
  const t = useTranslations("progress");
  const te = useTranslations("enums");
  const ti = useTranslations("iep");
  const locale = useLocale();
  const qc = useQueryClient();
  const { can } = useAuth();
  const isStaff = can("ADMIN", "EDUCATOR");
  const ieps = useStudentIeps(student.id);
  const analytics = useStudentAnalytics(student.id);
  const [logging, setLogging] = useState<Goal | null>(null);

  const approved = ieps.data?.data.find((i) => i.status === "APPROVED");
  const series = useMemo(() => new Map((analytics.data?.goals ?? []).map((g) => [g.goalId, g])), [analytics.data]);

  const achieve = useMutation({
    mutationFn: (goalId: string) => goalsApi.update(goalId, { status: "ACHIEVED" }),
    onMutate: (goalId) => {
      const key = qk.ieps(student.id);
      const prev = qc.getQueryData<Paginated<Iep>>(key);
      if (prev) {
        qc.setQueryData<Paginated<Iep>>(key, {
          ...prev,
          data: prev.data.map((i) => ({ ...i, goals: i.goals.map((g) => (g.id === goalId ? { ...g, status: "ACHIEVED" as const } : g)) })),
        });
      }
      return { prev };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.ieps(student.id), ctx.prev);
      toast.error(errorMessage(err));
    },
  });

  if (ieps.error || analytics.error) return <ErrorState error={ieps.error ?? analytics.error} onRetry={() => { ieps.refetch(); analytics.refetch(); }} />;
  if (ieps.isLoading || analytics.isLoading) return <Skeleton className="h-72 rounded-2xl" />;
  if (!approved) return <EmptyState icon={LineIcon} title={t("emptyTitle")} body={t("emptyBody")} />;

  return (
    <section aria-labelledby="progress-title" className="flex flex-col gap-4">
      <h2 id="progress-title" className="text-xl font-semibold">{t("title")}</h2>
      <ul className="grid gap-4 lg:grid-cols-2">
        {approved.goals.map((g, i) => {
          const s = series.get(g.id);
          return (
            <li key={g.id} className="card-soft flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{ti("goal", { n: i + 1 })} · {te(`domain.${g.domain}`)}</h3>
                <Badge className={STATUS_STYLES[g.status]}>{te(`goalStatus.${g.status}`)}</Badge>
                {s && <span className="ml-auto font-heading text-2xl font-bold">{t("latest", { value: s.latestValue })}</span>}
              </div>
              <p className="text-muted-foreground">{g.goalText}</p>
              {s?.points.length ? (
                <>
                  <ProgressLineChart
                    ariaLabel={`${t("chartLabel", { goal: te(`domain.${g.domain}`) })}: ${s.points.map((p) => `${formatShortDate(p.date, locale)} ${p.value}%`).join(", ")}`}
                    points={s.points.map((p) => ({ label: formatShortDate(p.date, locale), value: p.value, note: p.note }))}
                  />
                  <p className="font-medium text-brand-teal-dark">{t("change", { change: s.change })}</p>
                </>
              ) : (
                <p className="rounded-lg bg-muted p-4 text-muted-foreground">{t("noEntries")}</p>
              )}
              {isStaff && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setLogging(g)}><Plus aria-hidden /> {t("log")}</Button>
                  {g.status !== "ACHIEVED" && (
                    <Button variant="outline" onClick={() => achieve.mutate(g.id)}><Trophy aria-hidden /> {t("markAchieved")}</Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {logging && <LogProgressDialog goal={logging} student={student} open={!!logging} onOpenChange={(o) => !o && setLogging(null)} />}
    </section>
  );
}
