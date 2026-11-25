"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { FileText, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiLoading } from "@/components/common/ai-loading";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { useAuth } from "@/components/providers/auth-provider";
import { WorksheetView } from "@/components/worksheets/worksheet-view";
import { WorksheetEditor } from "@/components/worksheets/worksheet-editor";
import { WorksheetActions } from "@/components/worksheets/worksheet-actions";
import { useStudentIeps, useWorksheets } from "@/hooks/queries";
import { errorMessage, worksheetsApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { ADAPTATIONS, type Adaptation, type Language, type Student, type StudentDetail, type Worksheet } from "@/types/api";

function AdaptationPicker({ value, onChange, idPrefix }: { value: Adaptation[]; onChange: (v: Adaptation[]) => void; idPrefix: string }) {
  const t = useTranslations("worksheets");
  const te = useTranslations("enums");
  return (
    <fieldset>
      <legend className="mb-2 font-medium">{t("adaptations")}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {ADAPTATIONS.map((a) => (
          <label key={a} htmlFor={`${idPrefix}-${a}`} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 has-checked:border-primary has-checked:bg-accent">
            <input
              id={`${idPrefix}-${a}`}
              type="checkbox"
              className="mt-1 size-5"
              checked={value.includes(a)}
              onChange={(e) => onChange(e.target.checked ? [...value, a] : value.filter((x) => x !== a))}
            />
            <span>
              <span className="block font-medium">{te(`adaptation.${a}`)}</span>
              <span className="block text-muted-foreground">{te(`adaptationHint.${a}`)}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Shows a saved worksheet with actions, or the inline editor. */
function Result({ worksheet, studentName, canShare, before }: { worksheet: Worksheet; studentName: string; canShare: boolean; before?: string }) {
  const t = useTranslations("worksheets");
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(worksheet);
  if (editing) return <WorksheetEditor worksheet={current} onDone={(w) => { setCurrent(w); setEditing(false); }} />;
  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="rounded-lg bg-teal-50 p-3 text-teal-900">{t("editBeforeSaving")}</p>
      <WorksheetActions worksheet={current} canShare={canShare} onEdit={() => setEditing(true)} />
      {before !== undefined ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section aria-label={t("before")} className="flex flex-col gap-2">
            <h3 className="font-semibold">{t("before")}</h3>
            <pre className="min-h-40 flex-1 overflow-auto rounded-2xl border bg-muted p-5 font-sans whitespace-pre-wrap">{before}</pre>
          </section>
          <section aria-label={t("after")} className="flex flex-col gap-2">
            <h3 className="font-semibold">{t("after")}</h3>
            <WorksheetView worksheet={current} studentName={studentName} />
          </section>
        </div>
      ) : (
        <WorksheetView worksheet={current} studentName={studentName} />
      )}
    </div>
  );
}

function GenerateForm({ student, canShare }: { student: Student; canShare: boolean }) {
  const t = useTranslations("worksheets");
  const te = useTranslations("enums");
  const v = useTranslations("validation");
  const locale = useLocale();
  const qc = useQueryClient();
  const ieps = useStudentIeps(student.id);
  const goals = (ieps.data?.data ?? []).filter((i) => i.status !== "ARCHIVED").flatMap((i) => i.goals);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [goalId, setGoalId] = useState("");
  const [language, setLanguage] = useState<Language>(locale === "hi" ? "hi" : "en");
  const [adaptations, setAdaptations] = useState<Adaptation[]>(
    student.disabilityCategories.includes("SPECIFIC_LEARNING_DISABILITIES") ? ["dyslexia_font", "chunked_steps"] : student.disabilityCategories.includes("LOW_VISION") ? ["large_print", "high_contrast"] : ["chunked_steps"],
  );
  const [errors, setErrors] = useState<{ subject?: string; topic?: string }>({});

  const gen = useMutation({
    mutationFn: () => worksheetsApi.generate(student.id, { subject: subject.trim(), topic: topic.trim(), goalId: goalId || undefined, adaptations, language }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.worksheets(student.id) });
      toast.success(t("created"));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (gen.isPending) return <AiLoading title={t("generating")} hint={t("generatingHint")} />;
  if (gen.data) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="outline" className="self-start" onClick={() => gen.reset()}>
          <Sparkles aria-hidden /> {t("generate")}
        </Button>
        <Result worksheet={gen.data.worksheet} studentName={student.name} canShare={canShare} />
      </div>
    );
  }

  return (
    <form
      noValidate
      className="card-soft flex flex-col gap-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const errs = { subject: subject.trim() ? undefined : v("required"), topic: topic.trim() ? undefined : v("required") };
        setErrors(errs);
        if (!errs.subject && !errs.topic) gen.mutate();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wg-subject" className="font-medium">{t("subject")} <span aria-hidden className="text-destructive">*</span></label>
          <Input id="wg-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("subjectPlaceholder")} aria-invalid={!!errors.subject} aria-describedby={errors.subject ? "wg-subject-err" : undefined} />
          {errors.subject && <p id="wg-subject-err" role="alert" className="font-medium text-destructive">{errors.subject}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wg-topic" className="font-medium">{t("topic")} <span aria-hidden className="text-destructive">*</span></label>
          <Input id="wg-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t("topicPlaceholder")} aria-invalid={!!errors.topic} aria-describedby={errors.topic ? "wg-topic-err" : undefined} />
          {errors.topic && <p id="wg-topic-err" role="alert" className="font-medium text-destructive">{errors.topic}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wg-goal" className="font-medium">{t("linkedGoal")}</label>
          <NativeSelect id="wg-goal" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">{t("noGoal")}</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {te(`domain.${g.domain}`)}: {g.goalText.slice(0, 70)}
                {g.goalText.length > 70 ? "…" : ""}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wg-lang" className="font-medium">{t("language")}</label>
          <NativeSelect id="wg-lang" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </NativeSelect>
        </div>
      </div>
      <AdaptationPicker value={adaptations} onChange={setAdaptations} idPrefix="wg" />
      <Button type="submit" size="lg" className="self-start bg-brand-orange text-ink hover:bg-amber-400">
        <Sparkles aria-hidden /> {t("generate")}
      </Button>
    </form>
  );
}

function AdaptForm({ student, canShare }: { student: Student; canShare: boolean }) {
  const t = useTranslations("worksheets");
  const v = useTranslations("validation");
  const locale = useLocale();
  const qc = useQueryClient();
  const [sourceText, setSourceText] = useState("");
  const [profile, setProfile] = useState<"student" | "generic">("student");
  const [language, setLanguage] = useState<Language>(locale === "hi" ? "hi" : "en");
  const [adaptations, setAdaptations] = useState<Adaptation[]>(["simplified_language", "chunked_steps"]);
  const [error, setError] = useState<string>();

  const adapt = useMutation({
    mutationFn: () => worksheetsApi.adapt({ sourceText: sourceText.trim(), adaptations, language, studentId: profile === "student" ? student.id : undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.worksheets(student.id) });
      toast.success(t("created"));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (adapt.isPending) return <AiLoading title={t("adapting")} hint={t("generatingHint")} />;
  if (adapt.data) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="outline" className="self-start" onClick={() => adapt.reset()}>
          <Wand2 aria-hidden /> {t("adapt")}
        </Button>
        <Result worksheet={adapt.data.worksheet} studentName={profile === "student" ? student.name : ""} canShare={canShare && profile === "student"} before={sourceText} />
      </div>
    );
  }

  return (
    <form
      noValidate
      className="card-soft flex flex-col gap-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const msg = sourceText.trim().length < 20 ? v("min", { min: 20 }) : !adaptations.length ? t("selectAdaptation") : undefined;
        setError(msg);
        if (!msg) adapt.mutate();
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="wa-source" className="font-medium">{t("sourceText")} <span aria-hidden className="text-destructive">*</span></label>
        <Textarea id="wa-source" rows={8} value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder={t("sourcePlaceholder")} maxLength={20000} aria-describedby={error ? "wa-err" : undefined} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wa-profile" className="font-medium">{t("learnerProfile")}</label>
          <NativeSelect id="wa-profile" value={profile} onChange={(e) => setProfile(e.target.value as "student" | "generic")}>
            <option value="student">{student.name}</option>
            <option value="generic">{t("genericProfile")}</option>
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wa-lang" className="font-medium">{t("language")}</label>
          <NativeSelect id="wa-lang" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </NativeSelect>
        </div>
      </div>
      <AdaptationPicker value={adaptations} onChange={setAdaptations} idPrefix="wa" />
      {error && <p id="wa-err" role="alert" className="font-medium text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="self-start">
        <Wand2 aria-hidden /> {t("adapt")}
      </Button>
    </form>
  );
}

function Library({ student, canShare }: { student: Student; canShare: boolean }) {
  const t = useTranslations("worksheets");
  const te = useTranslations("enums");
  const locale = useLocale();
  const { data, isLoading, error, refetch } = useWorksheets(student.id);
  const [open, setOpen] = useState<string | null>(null);

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  if (!data?.data.length) return <EmptyState icon={FileText} title={t("emptyTitle")} body={t("emptyBody")} />;
  return (
    <ul className="flex flex-col gap-3">
      {data.data.map((w) => (
        <li key={w.id} className="card-soft p-5">
          <div className="flex flex-wrap items-start gap-3">
            <FileText className="mt-1 size-6 text-brand-orange" aria-hidden />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{w.title}</h3>
              <p className="text-muted-foreground">{[w.subject, w.level, formatDate(w.createdAt, locale)].filter(Boolean).join(" · ")}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {w.adaptations.map((a) => <Badge key={a} className="bg-accent text-accent-foreground">{te(`adaptation.${a}`)}</Badge>)}
              </div>
            </div>
            <Button variant="outline" aria-expanded={open === w.id} onClick={() => setOpen(open === w.id ? null : w.id)}>
              {t("preview")}
            </Button>
          </div>
          {open === w.id && (
            <div className="mt-4 flex flex-col gap-3">
              <WorksheetActions worksheet={w} canShare={canShare} />
              <WorksheetView worksheet={w} studentName={student.name} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function WorksheetsTab({ student, team }: { student: Student; team: StudentDetail["team"] }) {
  const t = useTranslations("worksheets");
  const { can } = useAuth();
  const isStaff = can("ADMIN", "EDUCATOR");
  const canShare = team.parents.length > 0;
  const [tab, setTab] = useState(isStaff ? "generate" : "library");

  if (!isStaff) return <Library student={student} canShare={false} />;
  return (
    <section aria-labelledby="ws-title">
      <h2 id="ws-title" className="mb-4 text-xl font-semibold">{t("title")}</h2>
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-auto w-max gap-1 rounded-xl bg-muted p-1">
            {(["generate", "adapt", "library"] as const).map((k) => (
              <TabsTrigger key={k} value={k} className="min-h-11 px-4 text-base text-ink data-active:bg-white">
                {t(k === "generate" ? "tabGenerate" : k === "adapt" ? "tabAdapt" : "tabLibrary")}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="generate" className="pt-4"><GenerateForm student={student} canShare={canShare} /></TabsContent>
        <TabsContent value="adapt" className="pt-4"><AdaptForm student={student} canShare={canShare} /></TabsContent>
        <TabsContent value="library" className="pt-4"><Library student={student} canShare={canShare} /></TabsContent>
      </Tabs>
    </section>
  );
}
