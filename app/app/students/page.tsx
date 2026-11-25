"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap, Plus, Search, ChevronRight } from "lucide-react";
import { useStudents } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import { RoleGate } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { StudentAvatar } from "@/components/common/student-avatar";
import { CategoryChips } from "@/components/common/category-chips";
import { StudentFormDialog } from "@/components/students/student-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { GRADES } from "@/lib/constants";
import { DISABILITY_CATEGORIES, type DisabilityCategory } from "@/types/api";

export default function StudentsPage() {
  const t = useTranslations("students");
  const tc = useTranslations("common");
  const te = useTranslations("enums.category");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DisabilityCategory | "">("");
  const [grade, setGrade] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const debounced = useDebounce(search.trim(), 350);

  const { data, isLoading, isFetching, error, refetch } = useStudents({
    search: debounced || undefined,
    category: category || undefined,
    grade: grade || undefined,
    page,
    limit: 20,
  });
  const filtered = Boolean(debounced || category || grade);
  const clear = () => {
    setSearch("");
    setCategory("");
    setGrade("");
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={data ? t("subtitle", { count: data.pagination.total }) : undefined}
        actions={
          <RoleGate roles={["ADMIN", "EDUCATOR"]}>
            <Button onClick={() => setAdding(true)}>
              <Plus aria-hidden /> {t("add")}
            </Button>
          </RoleGate>
        }
      />

      <div role="search" className="card-soft mb-6 grid gap-3 p-4 sm:grid-cols-[2fr_1fr_1fr]">
        <div className="relative">
          <label htmlFor="student-search" className="sr-only">{tc("search")}</label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="student-search"
            type="search"
            placeholder={t("searchPlaceholder")}
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div>
          <label htmlFor="f-category" className="sr-only">{t("filterCategory")}</label>
          <NativeSelect id="f-category" value={category} onChange={(e) => { setCategory(e.target.value as DisabilityCategory | ""); setPage(1); }}>
            <option value="">{t("allCategories")}</option>
            {DISABILITY_CATEGORIES.map((c) => <option key={c} value={c}>{te(c)}</option>)}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="f-grade" className="sr-only">{t("filterGrade")}</label>
          <NativeSelect id="f-grade" value={grade} onChange={(e) => { setGrade(e.target.value); setPage(1); }}>
            <option value="">{t("allGrades")}</option>
            {GRADES.map((g) => <option key={g} value={g}>{tc("grade", { grade: g })}</option>)}
          </NativeSelect>
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : !data?.data.length ? (
        filtered ? (
          <EmptyState icon={Search} title={t("emptyFiltered")} action={<Button variant="outline" onClick={clear}>{t("clearFilters")}</Button>} />
        ) : (
          <EmptyState
            icon={GraduationCap}
            title={t("emptyTitle")}
            body={t("emptyBody")}
            action={<RoleGate roles={["ADMIN", "EDUCATOR"]}><Button onClick={() => setAdding(true)}><Plus aria-hidden /> {t("add")}</Button></RoleGate>}
          />
        )
      ) : (
        <>
          <ul className="grid gap-3" aria-busy={isFetching}>
            {data.data.map((s) => (
              <li key={s.id}>
                <Link href={`/app/students/${s.id}`} className="card-soft flex items-center gap-4 p-4 transition-colors hover:border-primary">
                  <StudentAvatar name={s.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-muted-foreground">
                      {s.section ? tc("gradeSection", { grade: s.grade, section: s.section }) : tc("grade", { grade: s.grade })}
                    </p>
                    <div className="mt-1.5"><CategoryChips categories={s.disabilityCategories} max={3} /></div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          {data.pagination.totalPages > 1 && (
            <nav aria-label={tc("pagination")} className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{tc("previous")}</Button>
              <span aria-live="polite">{tc("pageOf", { page, total: data.pagination.totalPages })}</span>
              <Button variant="outline" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>{tc("next")}</Button>
            </nav>
          )}
        </>
      )}

      <StudentFormDialog open={adding} onOpenChange={setAdding} />
    </>
  );
}
