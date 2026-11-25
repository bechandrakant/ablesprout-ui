"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, GraduationCap, ShieldCheck, TrendingUp } from "lucide-react";
import { useSchoolAnalytics } from "@/hooks/queries";
import { useUser } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarListChart, DonutChart } from "@/components/charts";
import { GOAL_STATUS_COLORS } from "@/components/charts/palette";
import { KpiCard } from "./kpi-card";
import { SectionCard } from "./section-card";
import { formatDate } from "@/lib/format";

export function AdminDashboard() {
  const t = useTranslations("dashboard");
  const te = useTranslations("enums");
  const locale = useLocale();
  const user = useUser();
  const { data, isLoading, error, refetch } = useSchoolAnalytics();

  const header = <PageHeader title={t("greeting", { name: user.name.split(" ")[0] })} subtitle={t("adminSubtitle")} />;
  if (error) return (<>{header}<ErrorState error={error} onRetry={() => refetch()} /></>);
  if (isLoading || !data) {
    return (
      <>
        {header}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </>
    );
  }

  const goalCount = data.averageProgressByDomain.reduce((a, d) => a + d.goals, 0);
  const avgProgress = goalCount
    ? Math.round(data.averageProgressByDomain.reduce((a, d) => a + d.averageProgress * d.goals, 0) / goalCount)
    : null;

  return (
    <>
      {header}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={GraduationCap} label={t("kpiStudents")} value={data.totalStudents} tone="blue" />
        <KpiCard icon={ShieldCheck} label={t("kpiApproved")} value={`${data.approvedIep.percentage}%`} hint={`${data.approvedIep.students} / ${data.totalStudents}`} tone="teal" />
        <KpiCard icon={CalendarClock} label={t("kpiDue")} value={data.iepsDueForReview.within30Days} hint={t("kpiDueHint")} tone="orange" />
        <KpiCard icon={TrendingUp} label={t("kpiProgress")} value={avgProgress === null ? "—" : `${avgProgress}%`} hint={t("kpiProgressHint")} tone="slate" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title={t("byCategory")}>
          {data.studentsByDisabilityCategory.length ? (
            <BarListChart
              ariaLabel={data.studentsByDisabilityCategory.map((c) => `${te(`category.${c.category}`)}: ${c.count}`).join(", ")}
              data={data.studentsByDisabilityCategory.map((c) => ({ label: te(`category.${c.category}`), value: c.count }))}
            />
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </SectionCard>
        <SectionCard title={t("goalStatus")}>
          {data.goalStatusBreakdown.length ? (
            <DonutChart
              ariaLabel={data.goalStatusBreakdown.map((g) => `${te(`goalStatus.${g.status}`)}: ${g.count}`).join(", ")}
              data={(["NOT_STARTED", "IN_PROGRESS", "ACHIEVED"] as const).map((s) => ({
                label: te(`goalStatus.${s}`),
                value: data.goalStatusBreakdown.find((g) => g.status === s)?.count ?? 0,
                color: GOAL_STATUS_COLORS[s],
              }))}
            />
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </SectionCard>
        <SectionCard title={t("progressByDomain")}>
          {data.averageProgressByDomain.length ? (
            <BarListChart
              max={100}
              valueSuffix="%"
              ariaLabel={data.averageProgressByDomain.map((d) => `${te(`domain.${d.domain}`)}: ${d.averageProgress}%`).join(", ")}
              data={data.averageProgressByDomain.map((d) => ({ label: te(`domain.${d.domain}`), value: d.averageProgress }))}
            />
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </SectionCard>
        <SectionCard title={t("dueList")}>
          {data.iepsDueForReview.items.length ? (
            <ul className="divide-y">
              {data.iepsDueForReview.items.map((i) => (
                <li key={i.iepId} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/app/students/${i.studentId}?tab=iep`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {i.studentName}
                  </Link>
                  <span className="text-muted-foreground">{t("reviewOn", { date: formatDate(i.reviewDate, locale) })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">{t("noDue")}</p>
          )}
        </SectionCard>
      </div>

      <SectionCard title={t("educatorActivity")} className="mt-6">
        {data.educatorActivityLast30Days.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{t("colEducator")}</TableHead>
                  <TableHead scope="col" className="text-right">{t("colAssessments")}</TableHead>
                  <TableHead scope="col" className="text-right">{t("colIeps")}</TableHead>
                  <TableHead scope="col" className="text-right">{t("colProgress")}</TableHead>
                  <TableHead scope="col" className="text-right">{t("colWorksheets")}</TableHead>
                  <TableHead scope="col" className="text-right">{t("colTotal")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.educatorActivityLast30Days.map((e) => (
                  <TableRow key={e.educatorId}>
                    <TableHead scope="row" className="font-medium text-ink">{e.name}</TableHead>
                    <TableCell className="text-right">{e.assessments}</TableCell>
                    <TableCell className="text-right">{e.ieps}</TableCell>
                    <TableCell className="text-right">{e.progressEntries}</TableCell>
                    <TableCell className="text-right">{e.worksheets}</TableCell>
                    <TableCell className="text-right font-semibold">{e.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground">{t("noActivity")}</p>
        )}
      </SectionCard>
    </>
  );
}
