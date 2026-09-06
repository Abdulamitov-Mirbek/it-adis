"use client";

import { useTranslations } from "next-intl";
import { AdminShell } from "@/components/admin/AdminShell";
import { ApplicationsTable } from "@/components/admin/ApplicationsTable";

export default function AdminApplicationsPage() {
  const t = useTranslations("admin.pages.applications");

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <ApplicationsTable />
    </AdminShell>
  );
}
