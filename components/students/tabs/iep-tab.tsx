"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Download, FileText, Plus, Save, Sparkles, History } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AiLoading } from "@/components/common/ai-loading";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { useAuth } from "@/components/providers/auth-provider";
import { GoalCard } from "@/components/iep/goal-card";
import { useAssessments, useStudentIeps } from "@/hooks/queries";
import { errorMessage, goalsApi, iepsApi } from "@/lib/api";
import { formatDate, toDateInput } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { DOMAINS, type Domain, type GoalInput, type GoalStatus, type Iep, type Language, type Paginated, type Student } from "@/types/api";

type DraftGoal = GoalInput & { clientKey: string };
type Draft = { presentLevels: string; startDate: string; reviewDate: string; goals: DraftGoal[] };
const toDraft = (iep: Iep): Draft => ({
  presentLevels: iep.presentLevels ?? "",
  startDate: toDateInput(iep.startDate),
  reviewDate: toDateInput(iep.reviewDate),
  goals: iep.goals.map((g) => ({ ...g, clientKey: g.id })),
});
const emptyGoal = (): DraftGoal => ({ clientKey: Math.random().toString(36).slice(2), domain: "READING", goalText: "", baseline: "", target: "", measurement: "", accommodations: [], interventions: [] });

/** Pick which IEP to show first: a draft being worked on, else the active plan, else the newest. */
const pickCurrent = (ieps: Iep[]) => ieps.find((i) => i.status === "DRAFT") ?? ieps.find((i) => i.status === "APPROVED") ?? ieps[0];

function GeneratePanel({ student, hasAssessments, onGenerated, compact }: { student: Student; hasAssessments: boolean; onGenerated: (iep: Iep) => void; compact?: boolean }) {
  const t = useTranslations("iep");
  const te = useTranslations("enums.domain");
  const locale = useLocale();
  const qc = useQueryClient();
  const [language, setLanguage] = useState<Language>(locale === "hi" ? "hi" : "en");
  const [focus, setFocus] = useState<Domain[]>([]);

  const gen = useMutation({
    mutationFn: () => iepsApi.generate(student.id, { language, focusDomains: focus.length ? focus : undefined }),
    onSuccess: ({ iep }) => {
      qc.setQueryData<Paginated<Iep>>(qk.ieps(student.id), (old) =>
        old ? { ...old, data: [iep, ...old.data], pagination: { ...old.pagination, total: old.pagination.total + 1 } } : old,
      );
      qc.invalidateQueries({ queryKey: qk.ieps(student.id) });
      toast.success(t("draftCreated"));
      onGenerated(iep);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (gen.isPending) return <AiLoading title={t("generating")} steps={t("generatingSteps")} hint={t("generatingHint")} />;

  return (
    <div className={compact ? "flex flex-col gap-4" : "card-soft flex flex-col gap-4 p-5"}>
      {!hasAssessments && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden /> {t("noAssessmentsWarning")}
        </p>
      )}
      <fieldset>
        <legend className="mb-2 font-medium">{t("focusDomains")}</legend>
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((d) => (
            <label key={d} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 has-checked:border-primary has-checked:bg-accent">
              <input
                type="checkbox"
                className="size-5"
                checked={focus.includes(d)}
                onChange={(e) => setFocus((f) => (e.target.checked ? [...f, d].slice(-4) : f.filter((x) => x !== d)))}
              />
              {te(d)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5 sm:w-56">
          <label htmlFor="iep-lang" className="font-medium">{t("language")}</label>
          <NativeSelect id="iep-lang" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </NativeSelect>
        </div>
        <Button size="lg" onClick={() => gen.mutate()} className="bg-brand-teal-dark hover:bg-teal-800">
          <Sparkles aria-hidden /> {compact ? t("regenerate") : t("generate")}
        </Button>
      </div>
    </div>
  );
}

export function IepTab({ student }: { student: Student }) {
  const t = useTranslations("iep");
  const tc = useTranslations("common");
  const te = useTranslations("enums");
  const locale = useLocale();
  const qc = useQueryClient();
  const { can } = useAuth();
  const isStaff = can("ADMIN", "EDUCATOR");
  const ieps = useStudentIeps(student.id);
  const assessments = useAssessments(student.id);
  // The selected plan lives in the URL (?iep=) so it survives refetches, remounts and reloads.
  const searchParams = useSearchParams();
  const [selectedId, setSelectedIdState] = useState<string | undefined>(() => searchParams.get("iep") ?? undefined);
  const setSelectedId = (id: string) => {
    setSelectedIdState(id);
    const next = new URLSearchParams(window.location.search);
    next.set("iep", id);
    window.history.replaceState(null, "", `${window.location.pathname}?${next.toString()}`);
  };
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  const list = useMemo(() => ieps.data?.data ?? [], [ieps.data]);
  const current = list.find((i) => i.id === selectedId) ?? pickCurrent(list);
  const editable = isStaff && !!current && current.status !== "ARCHIVED";

  const [draft, setDraft] = useState<Draft | null>(null);
  useEffect(() => {
    setDraft(current ? toDraft(current) : null);
    // Reset local edits when switching IEP or after a server update.
  }, [current?.id, current?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = !!current && !!draft && JSON.stringify(toDraft(current)) !== JSON.stringify(draft);

  const replaceInCache = (iep: Iep) =>
    qc.setQueryData<Paginated<Iep>>(qk.ieps(student.id), (old) => (old ? { ...old, data: old.data.map((x) => (x.id === iep.id ? iep : x)) } : old));

  const save = useMutation({
    mutationFn: async () => {
      if (!current || !draft) throw new Error("Nothing to save");
      const goals = draft.goals.filter((g) => g.goalText.trim());
      return (
        await iepsApi.update(current.id, {
          presentLevels: draft.presentLevels,
          startDate: draft.startDate,
          reviewDate: draft.reviewDate,
          goals: goals.map((g) => ({
            id: g.id,
            domain: g.domain,
            goalText: g.goalText.trim(),
            baseline: g.baseline || undefined,
            target: g.target || undefined,
            measurement: g.measurement || undefined,
            accommodations: g.accommodations,
            interventions: g.interventions,
            status: g.status,
          })),
        })
      ).iep;
    },
    onSuccess: (iep) => {
      replaceInCache(iep);
      toast.success(t("saved"));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const approve = useMutation({
    mutationFn: async () => {
      if (!current) throw new Error("No IEP");
      if (dirty) await save.mutateAsync();
      return (await iepsApi.approve(current.id)).iep;
    },
    onSuccess: (approved) => {
      // Stay on the plan just approved (don't jump to another open draft).
      replaceInCache(approved);
      setSelectedId(approved.id);
      qc.invalidateQueries({ queryKey: qk.ieps(student.id) });
      qc.invalidateQueries({ queryKey: qk.studentAnalytics(student.id) });
      qc.invalidateQueries({ queryKey: ["caseload-ieps"] });
      toast.success(t("approved"));
      setConfirmApprove(false);
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      setConfirmApprove(false);
    },
  });

  // Optimistic goal status change on an approved plan.
  const setStatus = useMutation({
    mutationFn: ({ goalId, status }: { goalId: string; status: GoalStatus }) => goalsApi.update(goalId, { status }),
    onMutate: async ({ goalId, status }) => {
      await qc.cancelQueries({ queryKey: qk.ieps(student.id) });
      const prev = qc.getQueryData<Paginated<Iep>>(qk.ieps(student.id));
      if (current) replaceInCache({ ...current, goals: current.goals.map((g) => (g.id === goalId ? { ...g, status } : g)) });
      return { prev };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.ieps(student.id), ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.studentAnalytics(student.id) }),
  });

  const download = async () => {
    if (!current) return;
    setDownloading(true);
    try {
      await iepsApi.downloadPdf(current.id);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  if (ieps.error) return <ErrorState error={ieps.error} onRetry={() => ieps.refetch()} />;
  if (ieps.isLoading) return <Skeleton className="h-72 rounded-2xl" />;

  if (!current || !draft) {
    return isStaff ? (
      <div className="flex flex-col gap-4">
        <EmptyState icon={FileText} title={t("emptyTitle")} body={t("emptyBody")} />
        <GeneratePanel student={student} hasAssessments={!!assessments.data?.data.length} onGenerated={(i) => setSelectedId(i.id)} />
      </div>
    ) : (
      <EmptyState icon={FileText} title={t("emptyTitle")} body={t("emptyParent")} />
    );
  }

  const isDraft = current.status === "DRAFT";
  const others = list.filter((i) => i.id !== current.id);
  const updateGoal = (i: number, g: GoalInput) =>
    setDraft((d) => d && { ...d, goals: d.goals.map((x, j) => (j === i ? { ...g, clientKey: x.clientKey } : x)) });

  return (
    <div className="flex flex-col gap-5">
      {/* Status bar */}
      <div className="card-soft flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <Badge className={isDraft ? "bg-amber-100 text-amber-900" : current.status === "APPROVED" ? "bg-teal-100 text-teal-900" : "bg-slate-100 text-slate-800"}>
            {te(`iepStatus.${current.status}`)}
          </Badge>
          {isDraft && current.aiGenerated && (
            <Badge className="gap-1 bg-brand-orange/20 text-amber-950" data-testid="ai-draft-badge">
              <Sparkles className="size-4" aria-hidden /> {tc("aiDraft")}
            </Badge>
          )}
          {current.approvedAt && <span className="text-muted-foreground">{t("approvedOn", { date: formatDate(current.approvedAt, locale) })}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={download} disabled={downloading}>
            <Download aria-hidden /> {downloading ? tc("downloading") : tc("downloadPdf")}
          </Button>
          {editable && (
            <Button variant="outline" onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
              <Save aria-hidden /> {save.isPending ? tc("saving") : tc("saveChanges")}
            </Button>
          )}
          {isStaff && isDraft && (
            <Button onClick={() => (draft.goals.some((g) => g.goalText.trim()) ? setConfirmApprove(true) : toast.error(t("minGoals")))}>
              <CheckCircle2 aria-hidden /> {t("approve")}
            </Button>
          )}
        </div>
      </div>
      {dirty && <p role="status" className="rounded-lg bg-amber-50 px-4 py-2 text-amber-900">{t("unsaved")}</p>}
      {current.status === "ARCHIVED" && <p className="rounded-lg bg-muted px-4 py-2">{t("readOnlyArchived")}</p>}

      {/* Plan details */}
      <section aria-labelledby="pl-title" className="card-soft flex flex-col gap-4 p-5">
        <h3 id="pl-title" className="text-lg font-semibold">{t("presentLevels")}</h3>
        {editable ? (
          <>
            <label htmlFor="iep-present" className="sr-only">{t("presentLevels")}</label>
            <Textarea id="iep-present" rows={5} value={draft.presentLevels} onChange={(e) => setDraft({ ...draft, presentLevels: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="iep-start" className="font-medium">{t("startDate")}</label>
                <Input id="iep-start" type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="iep-review" className="font-medium">{t("reviewDate")}</label>
                <Input id="iep-review" type="date" min={draft.startDate} value={draft.reviewDate} onChange={(e) => setDraft({ ...draft, reviewDate: e.target.value })} />
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="whitespace-pre-line text-lg leading-relaxed">{current.presentLevels}</p>
            <p className="text-muted-foreground">
              {t("startDate")}: {formatDate(current.startDate, locale)} · {t("reviewDate")}: {formatDate(current.reviewDate, locale)}
            </p>
          </>
        )}
      </section>

      {/* Goals */}
      <section aria-labelledby="goals-title" className="flex flex-col gap-4">
        <h3 id="goals-title" className="text-lg font-semibold">{t("goals")}</h3>
        {draft.goals.map((g, i) => (
          <GoalCard
            key={`${current.id}-${g.clientKey}`}
            goal={g}
            index={i}
            editable={editable}
            onChange={(ng) => updateGoal(i, ng)}
            onRemove={isDraft ? () => setRemoveIndex(i) : undefined}
            onStatusChange={isStaff && current.status === "APPROVED" && g.id ? (s) => setStatus.mutate({ goalId: g.id!, status: s }) : undefined}
          />
        ))}
        {editable && isDraft && (
          <Button variant="outline" className="self-start" onClick={() => setDraft({ ...draft, goals: [...draft.goals, emptyGoal()] })} disabled={draft.goals.length >= 10}>
            <Plus aria-hidden /> {t("addGoal")}
          </Button>
        )}
      </section>

      {/* New draft + history */}
      {isStaff && (
        <section className="card-soft p-5">
          {showRegenerate ? (
            <GeneratePanel
              compact
              student={student}
              hasAssessments={!!assessments.data?.data.length}
              onGenerated={(i) => {
                setSelectedId(i.id);
                setShowRegenerate(false);
              }}
            />
          ) : (
            <Button variant="outline" onClick={() => setShowRegenerate(true)}>
              <Sparkles aria-hidden /> {t("regenerate")}
            </Button>
          )}
        </section>
      )}
      {others.length > 0 && (
        <section aria-labelledby="hist-title" className="card-soft p-5">
          <h3 id="hist-title" className="mb-3 flex items-center gap-2 text-lg font-semibold"><History className="size-5" aria-hidden /> {t("history")}</h3>
          <ul className="flex flex-wrap gap-2">
            {others.map((i) => (
              <li key={i.id}>
                <Button variant="outline" onClick={() => setSelectedId(i.id)}>
                  {te(`iepStatus.${i.status}`)} · {formatDate(i.createdAt, locale)}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AlertDialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">{t("approveTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">{t("approveBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => approve.mutate()} disabled={approve.isPending}>
              {approve.isPending ? tc("saving") : t("approveConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={removeIndex !== null} onOpenChange={(o) => !o && setRemoveIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">{t("removeGoal")}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">{t("removeGoalConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setDraft((d) => d && { ...d, goals: d.goals.filter((_, j) => j !== removeIndex) });
                setRemoveIndex(null);
              }}
            >
              {tc("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
