"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { CoursesTable } from "@/components/admin/CoursesTable";

export default function AdminCoursesPage() {
  return (
    <AdminShell title="Courses" description="Create, edit and archive the course catalogue">
      <CoursesTable />
    </AdminShell>
  );
}
