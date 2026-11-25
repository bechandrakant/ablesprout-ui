"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ClipboardPlus, FileText, Sparkles, GraduationCap, CalendarClock, TrendingUp } from "lucide-react";
import { useCaseloadIeps, useRecentProgress, useStudents } from "@/hooks/queries";
import { useUser } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StudentAvatar } from "@/components/common/student-avatar";
import { CategoryChips } from "@/components/common/category-chips";
import { EmptyState } from "@/components/common/empty-state";
import { StudentPickerDialog } from "@/components/students/student-picker-dialog";
import { SectionCard } from "./section-card";
import { formatDate, formatShortDate, progressStudent, studentOf } from "@/lib/format";

type Action = "assessment" | "iep" | "worksheet";
const HREF: Record<Action, (id: string) => string> = {
  assessment: (id) => `/app/students/${id}?tab=assessments&new=1`,
  iep: (id) => `/app/students/${id}?tab=iep`,
  worksheet: (id) => `/app/students/${id}?tab=worksheets`,
};

export function EducatorDashboard() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const ts = useTranslations("students");
  const locale = useLocale();
  const user = useUser();
  const students = useStudents({ limit: 6 });
  const due = useCaseloadIeps({ status: "APPROVED", dueWithinDays: 30, limit: 5 });
  const recent = useRecentProgress();
  const [picker, setPicker] = useState<Action | null>(null);

  const actions: { key: Action; label: string; icon: typeof Sparkles; className: string }[] = [
    { key: "assessment", label: t("qaAssessment"), icon: ClipboardPlus, className: "" },
    { key: "iep", label: t("qaIep"), icon: Sparkles, className: "bg-brand-teal-dark hover:bg-teal-800" },
    { key: "worksheet", label: t("qaWorksheet"), icon: FileText, className: "bg-brand-orange text-ink hover:bg-amber-400" },
  ];

  return (
    <>
      <PageHeader title={t("greeting", { name: user.name.split(" ")[0] })} subtitle={t("educatorSubtitle")} />

      <section aria-labelledby="qa-title" className="mb-6">
        <h2 id="qa-title" className="sr-only">{t("quickActions")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {actions.map(({ key, label, icon: Icon, className }) => (
            <Button key={key} size="lg" className={`h-14 justify-start gap-3 text-lg ${className}`} onClick={() => setPicker(key)}>
              <Icon className="size-6" aria-hidden /> {label}
            </Button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title={t("myStudents")}
          className="lg:col-span-2"
          action={<Link href="/app/students" className="font-medium text-primary underline-offset-4 hover:underline">{tc("viewAll")}</Link>}
        >
          {students.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : students.data?.data.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {students.data.data.map((s) => (
                <li key={s.id}>
                  <Link href={`/app/students/${s.id}`} className="flex gap-3 rounded-xl border p-3 transition-colors hover:border-primary hover:bg-accent">
                    <StudentAvatar name={s.name} />
                    <span className="min-w-0">
                      <span className="block font-semibold">{s.name}</span>
                      <span className="block text-muted-foreground">{tc("grade", { grade: s.grade })}</span>
                      <span className="mt-1 block"><CategoryChips categories={s.disabilityCategories} max={1} /></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={GraduationCap} title={t("noStudents")} body={ts("emptyBody")} />
          )}
        </SectionCard>

        <SectionCard title={t("dueSoon")}>
          {due.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : due.data?.data.length ? (
            <ul className="divide-y">
              {due.data.data.map((iep) => {
                const s = studentOf(iep);
                return (
                  <li key={iep.id} className="py-3">
                    <Link href={`/app/students/${s.id}?tab=iep`} className="font-medium text-primary underline-offset-4 hover:underline">{s.name}</Link>
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarClock className="size-4" aria-hidden /> {t("reviewOn", { date: formatDate(iep.reviewDate, locale) })}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">{t("noDue")}</p>
          )}
        </SectionCard>
      </div>

      <SectionCard title={t("recentProgress")} className="mt-6">
        {recent.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : recent.data?.data.length ? (
          <ul className="divide-y">
            {recent.data.data.map((p) => {
              const s = progressStudent(p);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  <TrendingUp className="size-5 text-brand-teal-dark" aria-hidden />
                  <Link href={`/app/students/${s.id}?tab=progress`} className="font-medium text-primary underline-offset-4 hover:underline">{s.name}</Link>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{p.goal?.goalText}</span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 font-semibold text-secondary-foreground">{p.value}%</span>
                  <span className="text-muted-foreground">{formatShortDate(p.date, locale)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t("noProgress")}</p>
        )}
      </SectionCard>

      <StudentPickerDialog
        open={picker !== null}
        onOpenChange={(o) => !o && setPicker(null)}
        title={picker ? actions.find((a) => a.key === picker)!.label : t("pickStudent")}
        hrefFor={(id) => HREF[picker ?? "assessment"](id)}
      />
    </>
  );
}
