"use client";

import { useTranslations } from "next-intl";
import { StudentAvatar } from "@/components/common/student-avatar";
import { CategoryChips } from "@/components/common/category-chips";
import { ageInYears } from "@/lib/format";
import type { Student } from "@/types/api";

export function StudentHeader({ student }: { student: Student }) {
  const tc = useTranslations("common");
  const age = ageInYears(student.dateOfBirth);
  return (
    <section className="card-soft flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <StudentAvatar name={student.name} className="size-16 text-xl" />
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{student.name}</h1>
        <p className="text-muted-foreground">
          {student.section ? tc("gradeSection", { grade: student.grade, section: student.section }) : tc("grade", { grade: student.grade })}
          {age !== undefined && ` · ${tc("years", { count: age })}`}
        </p>
        <div className="mt-2">
          <CategoryChips categories={student.disabilityCategories} />
        </div>
      </div>
    </section>
  );
}
