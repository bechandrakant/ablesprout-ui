import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("registerTitle") };
}

export default async function RegisterSchoolPage() {
  const t = await getTranslations("auth");
  return (
    <AuthShell title={t("registerTitle")} subtitle={t("registerSubtitle")} wide>
      <RegisterForm />
    </AuthShell>
  );
}
