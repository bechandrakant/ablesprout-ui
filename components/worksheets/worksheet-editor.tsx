"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage, worksheetsApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Worksheet } from "@/types/api";

/** Inline edits to an AI worksheet: title, headings, instructions and question text. */
export function WorksheetEditor({ worksheet, onDone }: { worksheet: Worksheet; onDone: (w: Worksheet) => void }) {
  const tc = useTranslations("common");
  const t = useTranslations("worksheets");
  const qc = useQueryClient();
  const [title, setTitle] = useState(worksheet.title);
  const [sections, setSections] = useState(worksheet.content.sections.map((s) => ({ ...s, questions: s.questions.map((q) => ({ ...q })) })));

  const save = useMutation({
    mutationFn: () => worksheetsApi.update(worksheet.id, { title: title.trim(), content: { sections } }),
    onSuccess: ({ worksheet: w }) => {
      qc.setQueryData(qk.worksheet(w.id), { worksheet: w });
      if (w.studentId) qc.invalidateQueries({ queryKey: qk.worksheets(w.studentId) });
      toast.success(tc("saved"));
      onDone(w);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <form
      className="card-soft flex flex-col gap-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ws-title" className="font-medium">{t("title")}</label>
        <Input id="ws-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      {sections.map((s, si) => (
        <fieldset key={si} className="flex flex-col gap-3 rounded-xl border p-4">
          <legend className="px-1 font-semibold">{s.heading || `#${si + 1}`}</legend>
          <label htmlFor={`ws-h-${si}`} className="sr-only">{t("heading")}</label>
          <Input id={`ws-h-${si}`} value={s.heading ?? ""} onChange={(e) => setSections((all) => all.map((x, i) => (i === si ? { ...x, heading: e.target.value } : x)))} />
          <label htmlFor={`ws-i-${si}`} className="sr-only">{t("instructions")}</label>
          <Textarea id={`ws-i-${si}`} rows={2} value={s.instructions ?? ""} onChange={(e) => setSections((all) => all.map((x, i) => (i === si ? { ...x, instructions: e.target.value } : x)))} />
          {s.questions.map((q, qi) => (
            <div key={qi} className="flex flex-col gap-1">
              <label htmlFor={`ws-q-${si}-${qi}`} className="text-muted-foreground">{qi + 1}.</label>
              <Input
                id={`ws-q-${si}-${qi}`}
                value={q.text}
                required
                onChange={(e) =>
                  setSections((all) => all.map((x, i) => (i === si ? { ...x, questions: x.questions.map((y, j) => (j === qi ? { ...y, text: e.target.value } : y)) } : x)))
                }
              />
              {q.options && (
                <Input
                  aria-label={`${qi + 1}. ${t("options")}`}
                  value={q.options.join(", ")}
                  onChange={(e) =>
                    setSections((all) =>
                      all.map((x, i) =>
                        i === si ? { ...x, questions: x.questions.map((y, j) => (j === qi ? { ...y, options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) } : y)) } : x,
                      ),
                    )
                  }
                />
              )}
            </div>
          ))}
        </fieldset>
      ))}
      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? tc("saving") : tc("saveChanges")}</Button>
        <Button type="button" variant="outline" onClick={() => onDone(worksheet)}>{tc("cancel")}</Button>
      </div>
    </form>
  );
}
