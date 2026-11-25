"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { CheckCheck, FileText, MessageCircle, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { useUser } from "@/components/providers/auth-provider";
import { useMessages, useWorksheets } from "@/hooks/queries";
import { errorMessage, messagesApi } from "@/lib/api";
import { formatShortDate, formatTime, senderOf } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { Message, Paginated, Student } from "@/types/api";

export function MessagesTab({ student }: { student: Student }) {
  const t = useTranslations("messages");
  const tr = useTranslations("enums.role");
  const locale = useLocale();
  const user = useUser();
  const qc = useQueryClient();
  const key = qk.messages(student.id);
  const { data, isLoading, error, refetch } = useMessages(student.id, { poll: true });
  const worksheets = useWorksheets(student.id);
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const messages = useMemo(() => data?.data ?? [], [data]);
  const marked = useRef(new Set<string>());
  const wsTitle = (id: string | null) => worksheets.data?.data.find((w) => w.id === id)?.title;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Mark what I've now seen as read (fire-and-forget, deduped by the API).
  useEffect(() => {
    messages
      .filter((m) => !m.pending && !marked.current.has(m.id) && !m.readBy.some((r) => r.userId === user.id))
      .slice(-20)
      .forEach((m) => {
        marked.current.add(m.id);
        messagesApi.markRead(m.id).catch(() => marked.current.delete(m.id));
      });
  }, [messages, user.id]);

  const send = useMutation({
    mutationFn: (vars: { body: string; attachmentWorksheetId?: string; tempId: string }) =>
      messagesApi.send(student.id, { body: vars.body, attachmentWorksheetId: vars.attachmentWorksheetId }),
    // Optimistic: show the bubble immediately, reconcile when the server answers.
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const optimistic: Message = {
        id: vars.tempId,
        studentId: student.id,
        senderId: { id: user.id, name: user.name, role: user.role },
        body: vars.body,
        attachmentWorksheetId: vars.attachmentWorksheetId ?? null,
        readBy: [{ userId: user.id, readAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
        pending: true,
      };
      qc.setQueryData<Paginated<Message>>(key, (old) =>
        old ? { ...old, data: [...old.data, optimistic] } : { data: [optimistic], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } },
      );
      setBody("");
      setAttachment("");
      setShowAttach(false);
    },
    onSuccess: ({ message }, vars) => {
      qc.setQueryData<Paginated<Message>>(key, (old) => old && { ...old, data: old.data.map((m) => (m.id === vars.tempId ? message : m)) });
    },
    onError: (err, vars) => {
      qc.setQueryData<Paginated<Message>>(key, (old) => old && { ...old, data: old.data.filter((m) => m.id !== vars.tempId) });
      setBody(vars.body);
      toast.error(errorMessage(err));
    },
  });

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    send.mutate({ body: text, attachmentWorksheetId: attachment || undefined, tempId: `tmp-${Date.now()}` });
  };

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <section aria-label={t("chatLabel", { name: student.name })} className="card-soft flex h-[70dvh] min-h-[28rem] flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4" role="log" aria-live="polite" aria-relevant="additions">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-14 w-2/3" />
            <Skeleton className="ml-auto h-14 w-2/3" />
          </div>
        ) : !messages.length ? (
          <EmptyState icon={MessageCircle} title={t("emptyTitle")} body={t("emptyBody")} className="border-none" />
        ) : (
          <ol className="flex flex-col gap-3">
            {messages.map((m, i) => {
              const s = senderOf(m);
              const mine = s.id === user.id;
              const newDay = i === 0 || formatShortDate(messages[i - 1].createdAt, locale) !== formatShortDate(m.createdAt, locale);
              const seenByOthers = m.readBy.some((r) => r.userId !== user.id);
              return (
                <li key={m.id} className="flex flex-col">
                  {newDay && <p className="my-2 self-center rounded-full bg-muted px-3 py-0.5 text-muted-foreground">{formatShortDate(m.createdAt, locale)}</p>}
                  <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5", mine ? "self-end rounded-br-md bg-primary text-white" : "self-start rounded-bl-md bg-muted text-ink", m.pending && "opacity-70")}>
                    {!mine && (
                      <p className="font-semibold">
                        {s.name} {s.role && <span className="font-normal text-muted-foreground">· {tr(s.role)}</span>}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    {m.attachmentWorksheetId && (
                      <Link
                        href={`/app/worksheets/${m.attachmentWorksheetId}/print`}
                        className={cn("mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 font-medium", mine ? "border-white/40 bg-white/10 text-white" : "border-input bg-white text-primary")}
                      >
                        <FileText className="size-5 shrink-0" aria-hidden />
                        {t("homeActivity")}
                        {wsTitle(m.attachmentWorksheetId) ? `: ${wsTitle(m.attachmentWorksheetId)}` : ""}
                      </Link>
                    )}
                    <p className={cn("mt-1 flex items-center justify-end gap-1", mine ? "text-blue-100" : "text-muted-foreground")}>
                      {formatTime(m.createdAt, locale)}
                      {mine && seenByOthers && (
                        <>
                          <CheckCheck className="size-4" aria-hidden />
                          <span className="sr-only">{t("read")}</span>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="border-t bg-white p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {attachment && (
          <p className="mb-2 flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5">
            <Paperclip className="size-4" aria-hidden /> {t("attached", { title: wsTitle(attachment) ?? "" })}
            <button type="button" className="ml-auto grid size-9 place-items-center rounded-md hover:bg-white" aria-label={t("removeAttachment")} onClick={() => setAttachment("")}>
              <X className="size-4" aria-hidden />
            </button>
          </p>
        )}
        {showAttach && !attachment && !!worksheets.data?.data.length && (
          <div className="mb-2">
            <label htmlFor="msg-attach" className="sr-only">{t("attach")}</label>
            <NativeSelect id="msg-attach" value="" onChange={(e) => setAttachment(e.target.value)}>
              <option value="">{t("attach")}…</option>
              {worksheets.data.data.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
            </NativeSelect>
          </div>
        )}
        <div className="flex items-end gap-2">
          {!!worksheets.data?.data.length && (
            <Button type="button" variant="outline" size="icon" aria-label={t("attach")} aria-expanded={showAttach} onClick={() => setShowAttach((s) => !s)}>
              <Paperclip aria-hidden />
            </Button>
          )}
          <label htmlFor="msg-body" className="sr-only">{t("placeholder")}</label>
          <Textarea
            id="msg-body"
            rows={1}
            value={body}
            maxLength={5000}
            placeholder={t("placeholder")}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className="max-h-40 min-h-11 flex-1 resize-none"
          />
          <Button type="submit" size="icon" aria-label={t("send")} disabled={!body.trim()}>
            <Send aria-hidden />
          </Button>
        </div>
      </form>
    </section>
  );
}
