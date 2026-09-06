"use client";

import { useTranslations } from "next-intl";
import { AdminShell } from "@/components/admin/AdminShell";
import { TeachersTable } from "@/components/admin/TeachersTable";

export default function AdminTeachersPage() {
  const t = useTranslations("admin.pages.teachers");

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <TeachersTable />
    </AdminShell>
  );
}
