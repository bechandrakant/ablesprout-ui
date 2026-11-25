"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "@/hooks/queries";
import { StudentAvatar } from "@/components/common/student-avatar";

/** "Which learner is this for?" – used by dashboard quick actions. */
export function StudentPickerDialog({
  open,
  onOpenChange,
  hrefFor,
  title,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  hrefFor: (id: string) => string;
  title: string;
}) {
  const t = useTranslations("dashboard");
  const ts = useTranslations("students");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useStudents({ search: search.trim() || undefined, limit: 20 });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-base">{t("pickStudentBody")}</DialogDescription>
        </DialogHeader>
        <label htmlFor="picker-search" className="sr-only">{tc("search")}</label>
        <Input id="picker-search" type="search" placeholder={ts("searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        <ul className="max-h-80 divide-y overflow-y-auto">
          {isLoading && <li><Skeleton className="h-12 w-full" /></li>}
          {data?.data.map((s) => (
            <li key={s.id}>
              <Link href={hrefFor(s.id)} onClick={() => onOpenChange(false)} className="flex min-h-14 items-center gap-3 rounded-lg px-2 hover:bg-accent">
                <StudentAvatar name={s.name} className="size-9" />
                <span className="font-medium">{s.name}</span>
                <span className="ml-auto text-muted-foreground">{tc("grade", { grade: s.grade })}</span>
              </Link>
            </li>
          ))}
          {data && !data.data.length && <li className="py-4 text-muted-foreground">{ts("emptyFiltered")}</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
