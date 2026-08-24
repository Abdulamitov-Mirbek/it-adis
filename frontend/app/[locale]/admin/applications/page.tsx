"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { ApplicationsTable } from "@/components/admin/ApplicationsTable";

export default function AdminApplicationsPage() {
  return (
    <AdminShell title="Applications" description="Review and respond to student applications">
      <ApplicationsTable />
    </AdminShell>
  );
}
