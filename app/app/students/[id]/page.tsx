"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";
import { StudentHeader } from "@/components/students/student-header";
import { OverviewTab } from "@/components/students/tabs/overview-tab";
import { AssessmentsTab } from "@/components/students/tabs/assessments-tab";
import { IepTab } from "@/components/students/tabs/iep-tab";
import { ProgressTab } from "@/components/students/tabs/progress-tab";
import { WorksheetsTab } from "@/components/students/tabs/worksheets-tab";
import { MessagesTab } from "@/components/students/tabs/messages-tab";
import { useStudent } from "@/hooks/queries";
import { ApiError } from "@/lib/api";

const TABS = ["overview", "assessments", "iep", "progress", "worksheets", "messages"] as const;
type Tab = (typeof TABS)[number];

export default function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("students");
  const tc = useTranslations("common");
  const search = useSearchParams();
  const tab = (TABS as readonly string[]).includes(search.get("tab") ?? "") ? (search.get("tab") as Tab) : "overview";
  const { data, isLoading, error, refetch } = useStudent(id);

  const setTab = (value: Tab) => {
    const next = new URLSearchParams(search.toString());
    next.set("tab", value);
    next.delete("new");
    // Native history update: Next syncs useSearchParams without a server round-trip or remount,
    // so in-progress work (AI generation, unsaved edits) in a tab is never thrown away.
    window.history.replaceState(null, "", `/app/students/${id}?${next.toString()}`);
  };

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="py-16 text-center">
          <p className="mb-4 text-lg">{tc("notFound")}</p>
          <Link href="/app/students" className="font-semibold text-primary underline">{t("title")}</Link>
        </div>
      );
    }
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }
  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const { student, team } = data;
  return (
    <>
      <Link href="/app/students" className="no-print mb-4 inline-flex min-h-11 items-center gap-2 font-medium text-primary">
        <ArrowLeft className="size-5" aria-hidden /> {t("title")}
      </Link>
      <StudentHeader student={student} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-6">
        <div className="no-print -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-auto w-max gap-1 rounded-xl bg-white p-1 shadow-soft">
            {TABS.map((k) => (
              <TabsTrigger key={k} value={k} className="min-h-11 px-4 text-base text-ink data-active:bg-primary data-active:text-white">
                {t(`tabs.${k}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview" className="pt-4"><OverviewTab student={student} team={team} /></TabsContent>
        <TabsContent value="assessments" className="pt-4"><AssessmentsTab student={student} openNew={search.get("new") === "1"} /></TabsContent>
        <TabsContent value="iep" className="pt-4"><IepTab student={student} /></TabsContent>
        <TabsContent value="progress" className="pt-4"><ProgressTab student={student} /></TabsContent>
        <TabsContent value="worksheets" className="pt-4"><WorksheetsTab student={student} team={team} /></TabsContent>
        <TabsContent value="messages" className="pt-4"><MessagesTab student={student} /></TabsContent>
      </Tabs>
    </>
  );
}
