"use client";

import { useCallback } from "react";
import {
  BookOpen,
  ClipboardList,
  Clock,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { adminAPI } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { Card } from "./ui/primitives";
import { ErrorState, Skeleton } from "./ui/states";
import { useAdminQuery } from "./useAdminQuery";

/** Four figures across the top: the shape of the business at a glance. */

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-green-100/50">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-green-50 tabular-nums tracking-tight">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-green-100/40">{hint}</p>}
        </div>
        <span
          className={cn("grid place-items-center w-9 h-9 rounded-lg shrink-0", accent)}
          aria-hidden="true"
        >
          <Icon size={17} />
        </span>
      </div>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-16 mt-3" />
      <Skeleton className="h-3 w-20 mt-2" />
    </Card>
  );
}

export function DashboardStats() {
  const { data, error, isLoading, reload } = useAdminQuery(
    useCallback(() => adminAPI.getDashboardStats(), [])
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <ErrorState message={error.message} code={error.code} onRetry={reload} />
      </Card>
    );
  }

  if (!data) return null;

  const pending = data.applicationsByStatus?.pending ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total applications"
        value={data.totalApplications}
        icon={ClipboardList}
        accent="bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20"
      />
      <StatCard
        label="Awaiting review"
        value={pending}
        hint={pending > 0 ? "Needs your attention" : "All caught up"}
        icon={Clock}
        accent={pending > 0 ? "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20" : "bg-white/5 text-green-100/40 ring-1 ring-white/10"}
      />
      <StatCard
        label="Active courses"
        value={data.totalCourses}
        icon={BookOpen}
        accent="bg-green-500/10 text-green-300 ring-1 ring-green-500/20"
      />
      <StatCard
        label="Acceptance rate"
        value={data.acceptanceRate}
        hint={`${data.applicationsByStatus?.accepted ?? 0} accepted`}
        icon={TrendingUp}
        accent="bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20"
      />
    </div>
  );
}
