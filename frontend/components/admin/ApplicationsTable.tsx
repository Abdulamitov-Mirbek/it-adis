"use client";

import { useCallback, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { adminAPI, ApiRequestError } from "@/lib/admin-api";
import type { Application } from "@/lib/types/admin";
import { Card, CardHeader, Select } from "./ui/primitives";
import { EmptyState, ErrorState, TableSkeleton } from "./ui/states";
import { Pagination, TableWrap, Td, Th, Tr } from "./ui/DataTable";
import { APPLICATION_STATUSES, formatDate, statusMeta } from "./status";
import { useAdminQuery } from "./useAdminQuery";

const PAGE_SIZE = 10;

/** Inline status control. Writing the status was impossible before this — the
 *  panel could list applications but never act on one. */
function StatusControl({
  application,
  onChanged,
}: {
  application: Application;
  onChanged: (updated: Application["status"]) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const handleChange = async (next: Application["status"]) => {
    if (next === application.status) return;

    const previous = application.status;
    setSaving(true);
    setFailed(null);
    // Optimistic: the row updates immediately, and reverts below if the write
    // is rejected. Waiting on the round trip made the select feel broken.
    onChanged(next);

    try {
      await adminAPI.updateApplicationStatus(application.id, next);
    } catch (error) {
      onChanged(previous);
      setFailed(
        error instanceof ApiRequestError ? error.message : "Could not save the change"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Select
        aria-label={`Status for ${application.name}`}
        value={application.status}
        disabled={saving}
        onChange={(event) => handleChange(event.target.value as Application["status"])}
        className="h-8 text-[13px] w-36"
      >
        {APPLICATION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {statusMeta(status).label}
          </option>
        ))}
      </Select>
      {failed && (
        <span className="text-[11px] text-red-700 max-w-36" role="alert">
          {failed}
        </span>
      )}
    </div>
  );
}

export function ApplicationsTable() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, error, isLoading, reload, setData } = useAdminQuery(
    useCallback(
      () => adminAPI.getApplications(page, PAGE_SIZE, statusFilter || undefined),
      [page, statusFilter]
    )
  );

  const applyLocalStatus = useCallback(
    (id: string, status: Application["status"]) => {
      setData((current) =>
        current
          ? {
              ...current,
              applications: current.applications.map((application) =>
                application.id === id ? { ...application, status } : application
              ),
            }
          : current
      );
    },
    [setData]
  );

  const applications = data?.applications ?? [];

  return (
    <Card>
      <CardHeader
        title="Applications"
        description="Every submission from the website, newest first"
        action={
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              // A filter change reshuffles the result set, so page 3 of the old
              // filter is meaningless against the new one.
              setPage(1);
            }}
            className="h-9 text-[13px] w-40"
          >
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusMeta(status).label}
              </option>
            ))}
          </Select>
        }
      />

      {isLoading && <TableSkeleton rows={PAGE_SIZE} columns={5} />}

      {!isLoading && error && (
        <ErrorState message={error.message} code={error.code} onRetry={reload} />
      )}

      {!isLoading && !error && applications.length === 0 && (
        <EmptyState
          title={statusFilter ? "No applications with that status" : "No applications yet"}
          description={
            statusFilter
              ? "Try clearing the filter to see everything that has come in."
              : "Submissions from the website's application form will appear here."
          }
        />
      )}

      {!isLoading && !error && applications.length > 0 && (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>Applicant</Th>
                <Th>Contact</Th>
                <Th>Programme</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <Tr key={application.id}>
                  <Td>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {application.name}
                      </p>
                      {application.message && (
                        <p
                          className="text-[13px] text-slate-500 truncate max-w-xs"
                          title={application.message}
                        >
                          {application.message}
                        </p>
                      )}
                    </div>
                  </Td>

                  <Td>
                    <div className="space-y-0.5">
                      <a
                        href={`mailto:${application.email}`}
                        className="flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-green-700 transition-colors"
                      >
                        <Mail size={13} className="text-slate-500 shrink-0" aria-hidden="true" />
                        <span className="truncate max-w-[14rem]">{application.email}</span>
                      </a>
                      {application.phone && (
                        <a
                          href={`tel:${application.phone}`}
                          className="flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-green-700 transition-colors"
                        >
                          <Phone size={13} className="text-slate-500 shrink-0" aria-hidden="true" />
                          {application.phone}
                        </a>
                      )}
                    </div>
                  </Td>

                  <Td>
                    <span className="text-slate-600">
                      {application.course?.title ?? application.program}
                    </span>
                  </Td>

                  <Td className="text-slate-500 whitespace-nowrap tabular-nums">
                    {formatDate(application.createdAt)}
                  </Td>

                  <Td>
                    <StatusControl
                      application={application}
                      onChanged={(status) => applyLocalStatus(application.id, status)}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>

          {data?.pagination && (
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          )}
        </>
      )}
    </Card>
  );
}
