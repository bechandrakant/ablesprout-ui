"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FileText, MessageCircle, Target } from "lucide-react";
import { useMessages, useStudentAnalytics, useStudents } from "@/hooks/queries";
import { useUser } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { StudentAvatar } from "@/components/common/student-avatar";
import { CategoryChips } from "@/components/common/category-chips";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "./section-card";
import { ageInYears, formatDate, formatShortDate, senderOf } from "@/lib/format";
import type { Student } from "@/types/api";

function ChildPanel({ child }: { child: Student }) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const te = useTranslations("enums");
  const tm = useTranslations("messages");
  const locale = useLocale();
  const user = useUser();
  const analytics = useStudentAnalytics(child.id);
  const messages = useMessages(child.id);
  const latest = (messages.data?.data ?? []).slice(-3).reverse();
  const activities = (messages.data?.data ?? []).filter((m) => m.attachmentWorksheetId).slice(-4).reverse();
  const goals = (analytics.data?.goals ?? []).filter((g) => g.iepStatus === "APPROVED");
  const age = ageInYears(child.dateOfBirth);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section aria-label={child.name} className="card-soft flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <StudentAvatar name={child.name} className="size-14 text-lg" />
          <div>
            <h2 className="text-xl font-semibold">{child.name}</h2>
            <p className="text-muted-foreground">
              {tc("grade", { grade: child.grade })}
              {age !== undefined && ` · ${tc("years", { count: age })}`}
            </p>
          </div>
        </div>
        <CategoryChips categories={child.disabilityCategories} />
        <Link href={`/app/students/${child.id}`} className={buttonVariants({ variant: "outline" })}>
          {t("childCard")}
        </Link>
      </section>

      <SectionCard title={t("goalProgress")} className="lg:col-span-2">
        {analytics.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : goals.length ? (
          <ul className="flex flex-col gap-4">
            {goals.map((g) => (
              <li key={g.goalId}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="font-medium">{g.domain ? te(`domain.${g.domain}`) : ""}</span>
                  <span className="font-semibold">{g.latestValue}%</span>
                </div>
                <Progress value={g.latestValue} aria-label={`${g.goalText ?? ""} ${g.latestValue}%`} />
                <p className="mt-1 text-muted-foreground">{g.goalText}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Target} title={t("noGoals")} className="py-6" />
        )}
      </SectionCard>

      <SectionCard
        title={t("latestMessages")}
        className="lg:col-span-2"
        action={<Link href={`/app/students/${child.id}?tab=messages`} className="font-medium text-primary underline-offset-4 hover:underline">{t("openChat")}</Link>}
      >
        {messages.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : latest.length ? (
          <ul className="divide-y">
            {latest.map((m) => {
              const s = senderOf(m);
              return (
                <li key={m.id} className="flex gap-3 py-3">
                  <MessageCircle className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-medium">
                      {s.id === user.id ? tm("you") : s.name} <span className="font-normal text-muted-foreground">· {formatShortDate(m.createdAt, locale)}</span>
                    </p>
                    <p className="line-clamp-2 text-muted-foreground">{m.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t("noMessages")}</p>
        )}
      </SectionCard>

      <SectionCard title={t("homeActivities")}>
        {activities.length ? (
          <ul className="flex flex-col gap-2">
            {activities.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/app/worksheets/${m.attachmentWorksheetId}/print`}
                  className="flex items-center gap-3 rounded-xl border p-3 hover:border-primary hover:bg-accent"
                >
                  <FileText className="size-6 text-brand-orange" aria-hidden />
                  <span>
                    <span className="block font-medium">{tm("homeActivity")}</span>
                    <span className="block text-muted-foreground">{t("sharedOn", { date: formatDate(m.createdAt, locale) })}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t("noActivities")}</p>
        )}
      </SectionCard>
    </div>
  );
}

export function ParentDashboard() {
  const t = useTranslations("dashboard");
  const user = useUser();
  const { data, isLoading, error, refetch } = useStudents({ limit: 10 });

  return (
    <>
      <PageHeader title={t("greeting", { name: user.name.split(" ")[0] })} subtitle={t("parentSubtitle")} />
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : data?.data.length ? (
        <div className="flex flex-col gap-10">
          {data.data.map((c) => (
            <ChildPanel key={c.id} child={c} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Target} title={t("noChildren")} />
      )}
    </>
  );
}
