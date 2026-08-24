"use client";

import { useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { adminAPI } from "@/lib/admin-api";
import { Card, CardHeader, StatusBadge } from "./ui/primitives";
import { EmptyState, ErrorState, Skeleton } from "./ui/states";
import { formatDateTime, statusMeta } from "./status";
import { useAdminQuery } from "./useAdminQuery";

/** The latest applications, as a feed — the one thing worth seeing on opening
 *  the panel without navigating anywhere. */
export function RecentActivity() {
  const { data, error, isLoading, reload } = useAdminQuery(
    useCallback(() => adminAPI.getRecentActivity(), [])
  );

  const applications = data?.recentApplications ?? [];

  return (
    <Card>
      <CardHeader
        title="Recent applications"
        description="The most recent submissions from the website"
        action={
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-green-400 hover:text-green-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400 rounded"
          >
            View all
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        }
      />

      {isLoading && (
        <div className="divide-y divide-dark-border" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-3.5">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <ErrorState message={error.message} code={error.code} onRetry={reload} />
      )}

      {!isLoading && !error && applications.length === 0 && (
        <EmptyState
          title="No applications yet"
          description="New submissions from the website will appear here as they arrive."
        />
      )}

      {!isLoading && !error && applications.length > 0 && (
        <ul className="divide-y divide-dark-border">
          {applications.map((application) => {
            const { label, tone } = statusMeta(application.status);
            return (
              <li
                key={application.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
              >
                <span
                  className="grid place-items-center w-8 h-8 rounded-full bg-green-500/15 text-green-300 ring-1 ring-green-500/20 text-xs font-semibold shrink-0"
                  aria-hidden="true"
                >
                  {application.applicantName?.[0]?.toUpperCase() ?? "?"}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-green-50 truncate">
                    {application.applicantName}
                  </p>
                  <p className="text-[13px] text-green-100/50 truncate">
                    {application.courseName || "No course selected"}
                    <span className="text-green-100/25 mx-1.5" aria-hidden="true">·</span>
                    {formatDateTime(application.createdAt)}
                  </p>
                </div>

                <StatusBadge tone={tone} label={label} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
