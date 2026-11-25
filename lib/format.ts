import type { Iep, Message, ProgressEntry } from "@/types/api";

const fmt = (locale: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { timeZone: "Asia/Kolkata", ...opts });

export const formatDate = (iso: string | undefined, locale = "en") =>
  iso ? fmt(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "—";
export const formatShortDate = (iso: string, locale = "en") => fmt(locale, { day: "numeric", month: "short" }).format(new Date(iso));
export const formatTime = (iso: string, locale = "en") => fmt(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export function ageInYears(dob?: string): number | undefined {
  if (!dob) return undefined;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age -= 1;
  return age >= 0 ? age : undefined;
}

/** yyyy-mm-dd for <input type="date">. */
export const toDateInput = (iso?: string | Date) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
export const today = () => toDateInput(new Date());

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export const studentOf = (iep: Iep) =>
  typeof iep.studentId === "string" ? { id: iep.studentId, name: "" } : iep.studentId;
export const progressStudent = (p: ProgressEntry) =>
  typeof p.studentId === "string" ? { id: p.studentId, name: "" } : p.studentId;
export const senderOf = (m: Message) => (typeof m.senderId === "string" ? { id: m.senderId, name: "", role: undefined } : m.senderId);

export const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
