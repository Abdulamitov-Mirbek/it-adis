"use client";

import { useTranslations } from "next-intl";
import { AdminShell } from "@/components/admin/AdminShell";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { RecentActivity } from "@/components/admin/RecentActivity";

export default function AdminDashboardPage() {
  const t = useTranslations("admin.pages.dashboard");

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <div className="space-y-6">
        <DashboardStats />
        <RecentActivity />
      </div>
    </AdminShell>
  );
}
