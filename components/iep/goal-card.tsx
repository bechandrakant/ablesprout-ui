"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { DOMAINS, GOAL_STATUSES, type GoalInput, type GoalStatus } from "@/types/api";
import { cn } from "@/lib/utils";

export const STATUS_STYLES: Record<GoalStatus, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-800",
  IN_PROGRESS: "bg-blue-100 text-blue-900",
  ACHIEVED: "bg-teal-100 text-teal-900",
};

const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

/** One IEP goal: inline-editable when `editable`, otherwise a clean read-only card. */
export function GoalCard({
  goal,
  index,
  editable,
  onChange,
  onRemove,
  onStatusChange,
}: {
  goal: GoalInput;
  index: number;
  editable: boolean;
  onChange?: (g: GoalInput) => void;
  onRemove?: () => void;
  onStatusChange?: (s: GoalStatus) => void;
}) {
  const t = useTranslations("iep");
  const te = useTranslations("enums");
  const ta = useTranslations("assessments");
  const id = `goal-${index}`;
  const set = (patch: Partial<GoalInput>) => onChange?.({ ...goal, ...patch });

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="text-lg font-semibold">{t("goal", { n: index + 1 })}</h3>
      {!editable && <Badge className="bg-accent text-accent-foreground">{te(`domain.${goal.domain}`)}</Badge>}
      {goal.status && !onStatusChange && <Badge className={STATUS_STYLES[goal.status]}>{te(`goalStatus.${goal.status}`)}</Badge>}
      <div className="ml-auto flex items-center gap-2">
        {onStatusChange && goal.status && (
          <>
            <label htmlFor={`${id}-status`} className="sr-only">{t("status")}</label>
            <NativeSelect id={`${id}-status`} value={goal.status} onChange={(e) => onStatusChange(e.target.value as GoalStatus)} className="w-44">
              {GOAL_STATUSES.map((s) => <option key={s} value={s}>{te(`goalStatus.${s}`)}</option>)}
            </NativeSelect>
          </>
        )}
        {editable && onRemove && (
          <Button type="button" variant="ghost" size="icon" aria-label={`${t("removeGoal")} ${index + 1}`} onClick={onRemove}>
            <Trash2 aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );

  if (!editable) {
    const row = (label: string, value?: string) =>
      value ? (
        <div>
          <dt className="font-medium text-muted-foreground">{label}</dt>
          <dd>{value}</dd>
        </div>
      ) : null;
    const list = (label: string, items: string[]) =>
      items.length ? (
        <div>
          <dt className="font-medium text-muted-foreground">{label}</dt>
          <dd>
            <ul className="list-disc pl-5">{items.map((x) => <li key={x}>{x}</li>)}</ul>
          </dd>
        </div>
      ) : null;
    return (
      <article className="card-soft p-5">
        {header}
        <p className="mt-3 text-lg leading-relaxed">{goal.goalText}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          {row(t("baseline"), goal.baseline)}
          {row(t("target"), goal.target)}
          {row(t("measurement"), goal.measurement)}
        </dl>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {list(t("accommodations"), goal.accommodations)}
          {list(t("interventions"), goal.interventions)}
        </dl>
      </article>
    );
  }

  return (
    <fieldset className={cn("card-soft flex flex-col gap-4 p-5")}>
      <legend className="sr-only">{t("goal", { n: index + 1 })}</legend>
      {header}
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-domain`} className="font-medium">{ta("domain")}</label>
          <NativeSelect id={`${id}-domain`} value={goal.domain} onChange={(e) => set({ domain: e.target.value as GoalInput["domain"] })}>
            {DOMAINS.map((d) => <option key={d} value={d}>{te(`domain.${d}`)}</option>)}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-text`} className="font-medium">{t("goalText")}</label>
          <Textarea id={`${id}-text`} rows={3} value={goal.goalText} onChange={(e) => set({ goalText: e.target.value })} required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {(["baseline", "target", "measurement"] as const).map((k) => (
          <div key={k} className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-${k}`} className="font-medium">{t(k)}</label>
            <Input id={`${id}-${k}`} value={goal[k] ?? ""} onChange={(e) => set({ [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["accommodations", "interventions"] as const).map((k) => (
          <div key={k} className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-${k}`} className="font-medium">{t(k)}</label>
            <Textarea
              id={`${id}-${k}`}
              rows={3}
              aria-describedby={`${id}-${k}-hint`}
              defaultValue={goal[k].join("\n")}
              onBlur={(e) => set({ [k]: lines(e.target.value) })}
            />
            <p id={`${id}-${k}-hint`} className="text-muted-foreground">{t("listHint")}</p>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
