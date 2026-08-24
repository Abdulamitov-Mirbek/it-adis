"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { RecentActivity } from "@/components/admin/RecentActivity";

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Dashboard" description="Overview of courses and applications">
      <div className="space-y-6">
        <DashboardStats />
        <RecentActivity />
      </div>
    </AdminShell>
  );
}
