"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Download, Pencil, Printer, Send } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { RoleGate } from "@/components/providers/auth-provider";
import { errorMessage, messagesApi, worksheetsApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Worksheet } from "@/types/api";

export function WorksheetActions({ worksheet, canShare, onEdit }: { worksheet: Worksheet; canShare: boolean; onEdit?: () => void }) {
  const t = useTranslations("worksheets");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  const [downloading, setDownloading] = useState(false);

  const share = useMutation({
    mutationFn: () =>
      messagesApi.send(worksheet.studentId!, { body: t("shareMessage", { title: worksheet.title }), attachmentWorksheetId: worksheet.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.messages(worksheet.studentId!) });
      toast.success(t("shared"));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/app/worksheets/${worksheet.id}/print`} className={buttonVariants({ variant: "outline" })}>
        <Printer aria-hidden /> {t("printView")}
      </Link>
      <Button
        variant="outline"
        disabled={downloading}
        onClick={async () => {
          setDownloading(true);
          try {
            await worksheetsApi.downloadPdf(worksheet.id);
          } catch (err) {
            toast.error(errorMessage(err));
          } finally {
            setDownloading(false);
          }
        }}
      >
        <Download aria-hidden /> {downloading ? tc("downloading") : tc("downloadPdf")}
      </Button>
      <RoleGate roles={["ADMIN", "EDUCATOR"]}>
        {onEdit && (
          <Button variant="outline" onClick={onEdit}>
            <Pencil aria-hidden /> {tc("edit")}
          </Button>
        )}
        {worksheet.studentId && (
          <Button
            className="bg-brand-teal-dark hover:bg-teal-800"
            disabled={!canShare || share.isPending}
            title={!canShare ? t("noParents") : undefined}
            onClick={() => share.mutate()}
          >
            <Send aria-hidden /> {t("shareWithParent")}
          </Button>
        )}
      </RoleGate>
      {!canShare && worksheet.studentId && (
        <RoleGate roles={["ADMIN", "EDUCATOR"]}>
          <p className="w-full text-muted-foreground">{t("noParents")}</p>
        </RoleGate>
      )}
    </div>
  );
}
