"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Worksheet } from "@/types/api";

const CUE = /\[(?:picture|image|चित्र)\s*:\s*([^\]]+)\]/gi;
/** Split instructions into one-action steps (handles English full stops and the Hindi danda). */
export const toSteps = (s: string) => s.split(/(?<=[.!?।])\s+|\n+/).map((x) => x.trim()).filter(Boolean);

/**
 * Renders a worksheet exactly as it should be printed, honouring the learner's adaptations
 * (dyslexia font, large print, chunked steps, visual supports, spacing, contrast).
 */
export function WorksheetView({ worksheet, studentName, className }: { worksheet: Pick<Worksheet, "title" | "subject" | "level" | "adaptations" | "content" | "language">; studentName?: string; className?: string }) {
  const t = useTranslations("worksheets");
  const a = new Set(worksheet.adaptations);
  let n = 0;

  return (
    <article
      lang={worksheet.language}
      className={cn(
        "worksheet rounded-2xl border bg-white p-6 sm:p-10",
        a.has("dyslexia_font") && "ws-dyslexia",
        a.has("large_print") && "ws-large-print",
        (a.has("extra_spacing") || a.has("dyslexia_font") || a.has("large_print")) && "ws-extra-spacing",
        a.has("high_contrast") && "ws-high-contrast",
        className,
      )}
    >
      <h2 className="font-heading text-[1.6em] font-bold">{worksheet.title}</h2>
      {(worksheet.subject || worksheet.level) && <p className="text-[0.85em] text-slate-600">{[worksheet.subject, worksheet.level].filter(Boolean).join(" · ")}</p>}
      <p className="mt-4 mb-6 flex flex-wrap gap-x-8 gap-y-2">
        <span>{t("name")}: {studentName ?? "____________________"}</span>
        <span>{t("dateLine")}: ____________</span>
      </p>

      {worksheet.content.sections.map((section, si) => (
        <section key={si} className="mb-8">
          {section.heading && <h3 className="mb-2 font-heading text-[1.2em] font-semibold">{section.heading}</h3>}
          {section.instructions &&
            (a.has("chunked_steps") ? (
              <ol className="mb-4 flex flex-col gap-1">
                {toSteps(section.instructions).map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 rounded-md bg-blue-50 px-2 font-semibold text-blue-900">{t("step", { n: i + 1 })}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mb-4">{section.instructions}</p>
            ))}
          <ol className="flex flex-col gap-5">
            {section.questions.map((q, qi) => {
              n += 1;
              const cues = [...q.text.matchAll(CUE)].map((m) => m[1]);
              const text = q.text.replace(CUE, "").trim();
              return (
                <li key={qi} className="ws-question">
                  <p className="font-semibold">
                    {n}. {text}
                  </p>
                  {a.has("visual_supports") &&
                    cues.map((c) => (
                      <div key={c} className="ws-box mt-2 grid place-items-center p-4 text-[0.85em] text-slate-600">
                        {t("pictureCue", { cue: c })}
                      </div>
                    ))}
                  <div className="mt-2 pl-4">
                    {q.answerType === "multiple_choice" || q.answerType === "true_false" ? (
                      <ul className="flex flex-col gap-1.5">
                        {(q.answerType === "true_false" ? [t("true"), t("false")] : q.options ?? []).map((o) => (
                          <li key={o} className="flex items-center gap-3">
                            <span aria-hidden className="inline-block size-[1em] rounded-full border-2 border-current" />
                            {o}
                          </li>
                        ))}
                      </ul>
                    ) : q.answerType === "match" ? (
                      <ul className="flex flex-col gap-1.5">
                        {(q.options ?? []).map((o) => (
                          <li key={o}>• {o} &nbsp;________</li>
                        ))}
                      </ul>
                    ) : q.answerType === "draw" ? (
                      <div className="ws-box h-40" aria-hidden />
                    ) : q.answerType === "number" ? (
                      <div className="ws-box h-14 w-32 min-h-0" aria-hidden />
                    ) : (
                      <>
                        <div className="ws-line" aria-hidden />
                        {q.answerType === "long_text" && (
                          <>
                            <div className="ws-line" aria-hidden />
                            <div className="ws-line" aria-hidden />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <p className="text-right text-[0.75em] text-slate-500">AbleSprout</p>
    </article>
  );
}
