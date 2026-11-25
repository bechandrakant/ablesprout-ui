"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";
import { WorksheetView } from "@/components/worksheets/worksheet-view";
import { useStudent, useWorksheet } from "@/hooks/queries";
import { errorMessage, worksheetsApi } from "@/lib/api";

/** Print view: the app chrome is hidden by `no-print`, adaptations are applied by WorksheetView. */
export default function WorksheetPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("worksheets");
  const tc = useTranslations("common");
  const router = useRouter();
  const { data, isLoading, error, refetch } = useWorksheet(id);
  const studentId = data?.worksheet.studentId ?? "";
  const student = useStudent(studentId);
  const [downloading, setDownloading] = useState(false);

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isLoading || !data) return <Skeleton className="h-[70vh] rounded-2xl" />;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft aria-hidden /> {tc("back")}
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={downloading}
            onClick={async () => {
              setDownloading(true);
              try {
                await worksheetsApi.downloadPdf(id);
              } catch (err) {
                toast.error(errorMessage(err));
              } finally {
                setDownloading(false);
              }
            }}
          >
            <Download aria-hidden /> {downloading ? tc("downloading") : tc("downloadPdf")}
          </Button>
          <Button onClick={() => window.print()}>
            <Printer aria-hidden /> {tc("print")}
          </Button>
        </div>
      </div>
      <h1 className="sr-only">{t("printView")}</h1>
      <WorksheetView worksheet={data.worksheet} studentName={studentId ? student.data?.student.name : undefined} />
    </div>
  );
}
