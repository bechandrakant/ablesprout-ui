"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/providers/auth-provider";
import { CategoryChips } from "@/components/common/category-chips";
import { SectionCard } from "@/components/dashboard/section-card";
import { StudentFormDialog } from "@/components/students/student-form-dialog";
import { formatDate } from "@/lib/format";
import type { Student, StudentDetail } from "@/types/api";

function People({ people, empty }: { people: StudentDetail["team"]["educators"]; empty: string }) {
  if (!people.length) return <p className="text-muted-foreground">{empty}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {people.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium">{p.name}</span>
          {p.email && (
            <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
              <Mail className="size-4" aria-hidden /> {p.email}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export function OverviewTab({ student, team }: { student: Student; team: StudentDetail["team"] }) {
  const t = useTranslations("students");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard
        title={t("overview.needs")}
        action={
          <RoleGate roles={["ADMIN", "EDUCATOR"]}>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden /> {t("overview.editProfile")}
            </Button>
          </RoleGate>
        }
      >
        <CategoryChips categories={student.disabilityCategories} />
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <dt className="text-muted-foreground">{t("dob")}</dt>
            <dd className="font-medium">{formatDate(student.dateOfBirth, locale)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("grade")}</dt>
            <dd className="font-medium">{student.grade}{student.section ? `-${student.section}` : ""}</dd>
          </div>
        </dl>
      </SectionCard>
      <SectionCard title={t("overview.strengths")}>
        <p className="whitespace-pre-line">{student.notes || <span className="text-muted-foreground">{t("overview.noNotes")}</span>}</p>
      </SectionCard>
      <SectionCard title={t("overview.educators")}>
        <People people={team.educators} empty={t("overview.noEducators")} />
      </SectionCard>
      <SectionCard title={t("overview.parents")}>
        <People people={team.parents} empty={t("overview.noParents")} />
      </SectionCard>
      <StudentFormDialog open={editing} onOpenChange={setEditing} student={student} />
    </div>
  );
}
