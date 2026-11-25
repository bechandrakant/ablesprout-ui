"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "@/hooks/queries";
import { errorMessage, studentsApi } from "@/lib/api";
import type { User } from "@/types/api";

/** Assign an educator or parent to one or more students (adds; existing links are kept). */
export function AssignDialog({ member, onOpenChange }: { member: User | null; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const ts = useTranslations("students");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const students = useStudents({ limit: 100 });
  useEffect(() => {
    setSelected([]);
    setSearch("");
  }, [member?.id]);

  const isLinked = (s: { educatorIds: string[]; parentIds: string[] }) =>
    !!member && (member.role === "PARENT" ? s.parentIds : s.educatorIds).includes(member.id);
  const visible = useMemo(
    () => (students.data?.data ?? []).filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase())),
    [students.data, search],
  );

  const save = useMutation({
    mutationFn: async () => {
      if (!member) return;
      await Promise.all(
        selected.map((sid) => (member.role === "PARENT" ? studentsApi.addParents(sid, [member.id]) : studentsApi.addEducators(sid, [member.id]))),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student"] });
      toast.success(t("assigned"));
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{member ? t("assignTitle", { name: member.name }) : ""}</DialogTitle>
          <DialogDescription className="text-base">{member ? t("assignBody", { name: member.name }) : ""}</DialogDescription>
        </DialogHeader>
        <label htmlFor="assign-search" className="sr-only">{tc("search")}</label>
        <Input id="assign-search" type="search" placeholder={ts("searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        <fieldset className="max-h-80 overflow-y-auto">
          <legend className="sr-only">{ts("title")}</legend>
          {students.isLoading && <Skeleton className="h-24 w-full" />}
          {visible.map((s) => {
            const linked = isLinked(s);
            return (
              <label key={s.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-muted has-disabled:cursor-default has-disabled:opacity-70">
                <input
                  type="checkbox"
                  className="size-5"
                  disabled={linked}
                  checked={linked || selected.includes(s.id)}
                  onChange={(e) => setSelected((sel) => (e.target.checked ? [...sel, s.id] : sel.filter((x) => x !== s.id)))}
                />
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">{tc("grade", { grade: s.grade })}</span>
                {linked && <span className="ml-auto text-muted-foreground">{t("alreadyAssigned")}</span>}
              </label>
            );
          })}
        </fieldset>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button onClick={() => save.mutate()} disabled={!selected.length || save.isPending}>{save.isPending ? tc("saving") : tc("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
