"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link2, Mail, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { SectionCard } from "@/components/dashboard/section-card";
import { InviteDialog } from "@/components/team/invite-dialog";
import { AssignDialog } from "@/components/team/assign-dialog";
import { useAuth } from "@/components/providers/auth-provider";
import { useUsers } from "@/hooks/queries";
import type { User } from "@/types/api";

function MemberList({ role, emptyText, onAssign, onInvite }: { role: "EDUCATOR" | "PARENT"; emptyText: string; onAssign: (u: User) => void; onInvite: () => void }) {
  const t = useTranslations("team");
  const { data, isLoading, error, refetch } = useUsers(role);
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data?.data.length) return <EmptyState icon={Users} title={emptyText} action={<Button onClick={onInvite}><UserPlus aria-hidden /> {t("invite")}</Button>} className="py-6" />;
  return (
    <ul className="divide-y">
      {data.data.map((u) => (
        <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{u.name}</p>
            <a href={`mailto:${u.email}`} className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:underline">
              <Mail className="size-4" aria-hidden /> {u.email}
            </a>
          </div>
          <Button variant="outline" onClick={() => onAssign(u)} aria-label={`${t("assign")}: ${u.name}`}>
            <Link2 aria-hidden /> {t("assign")}
          </Button>
        </li>
      ))}
    </ul>
  );
}

export default function TeamPage() {
  const t = useTranslations("team");
  const { can, user } = useAuth();
  const router = useRouter();
  const [inviteRole, setInviteRole] = useState<"EDUCATOR" | "PARENT" | null>(null);
  const [assigning, setAssigning] = useState<User | null>(null);

  // Middleware already redirects non-admins; this covers client-side navigation too.
  useEffect(() => {
    if (user && !can("ADMIN")) router.replace("/app/dashboard");
  }, [user, can, router]);
  if (!can("ADMIN")) return null;

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={<Button onClick={() => setInviteRole("EDUCATOR")}><UserPlus aria-hidden /> {t("invite")}</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={t("educators")}>
          <MemberList role="EDUCATOR" emptyText={t("emptyEducators")} onAssign={setAssigning} onInvite={() => setInviteRole("EDUCATOR")} />
        </SectionCard>
        <SectionCard title={t("parents")}>
          <MemberList role="PARENT" emptyText={t("emptyParents")} onAssign={setAssigning} onInvite={() => setInviteRole("PARENT")} />
        </SectionCard>
      </div>
      <InviteDialog open={inviteRole !== null} onOpenChange={(o) => !o && setInviteRole(null)} defaultRole={inviteRole ?? "EDUCATOR"} />
      <AssignDialog member={assigning} onOpenChange={(o) => !o && setAssigning(null)} />
    </>
  );
}
