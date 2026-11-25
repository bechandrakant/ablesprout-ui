"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { EducatorDashboard } from "@/components/dashboard/educator-dashboard";
import { ParentDashboard } from "@/components/dashboard/parent-dashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === "ADMIN") return <AdminDashboard />;
  if (user?.role === "EDUCATOR") return <EducatorDashboard />;
  return <ParentDashboard />;
}
