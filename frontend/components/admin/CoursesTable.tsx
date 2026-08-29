"use client";

import { useCallback, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { adminAPI, ApiRequestError } from "@/lib/admin-api";
import type { Course } from "@/lib/types/admin";
import { Badge, Button, Card, CardHeader, StatusBadge } from "./ui/primitives";
import { EmptyState, ErrorState, TableSkeleton } from "./ui/states";
import { Pagination, TableWrap, Td, Th, Tr } from "./ui/DataTable";
import { formatDate, levelMeta } from "./status";
import { useAdminQuery } from "./useAdminQuery";
import { CourseFormDialog } from "./CourseFormDialog";

const PAGE_SIZE = 10;

export function CoursesTable() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Course | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Bumped on every open so the dialog remounts with fresh state each time,
  // including two "New course" opens in a row.
  const [formInstance, setFormInstance] = useState(0);

  const { data, error, isLoading, reload } = useAdminQuery(
    useCallback(() => adminAPI.getCourses(page, PAGE_SIZE), [page])
  );

  const openCreate = useCallback(() => {
    setEditing(undefined);
    setFormInstance((value) => value + 1);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((course: Course) => {
    setEditing(course);
    setFormInstance((value) => value + 1);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (course: Course) => {
      // The backend soft-deletes, so this is reversible by editing the course
      // and switching it back to active. The confirmation says so, because
      // "Delete" on its own reads as permanent and stops people using it.
      const confirmed = window.confirm(
        `Archive “${course.title}”?\n\nIt will be hidden from the website. ` +
          `Existing applications are kept, and you can make it active again later.`
      );
      if (!confirmed) return;

      setPendingDelete(course.slug);
      setActionError(null);
      try {
        await adminAPI.deleteCourse(course.slug);
        reload();
      } catch (caught) {
        setActionError(
          caught instanceof ApiRequestError ? caught.message : "Could not archive the course"
        );
      } finally {
        setPendingDelete(null);
      }
    },
    [reload]
  );

  const courses = data?.courses ?? [];

  return (
    <>
      <Card>
        <CardHeader
          title="Courses"
          description="What the school offers, as shown on the public website"
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={15} aria-hidden="true" />
              New course
            </Button>
          }
        />

        {actionError && (
          <p
            className="mx-5 mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700"
            role="alert"
          >
            {actionError}
          </p>
        )}

        {isLoading && <TableSkeleton rows={5} columns={5} />}

        {!isLoading && error && (
          <ErrorState message={error.message} code={error.code} onRetry={reload} />
        )}

        {!isLoading && !error && courses.length === 0 && (
          <EmptyState
            title="No courses yet"
            description="Add the first course and it will appear on the website straight away."
            action={
              <Button variant="primary" size="sm" onClick={openCreate}>
                <Plus size={15} aria-hidden="true" />
                New course
              </Button>
            }
          />
        )}

        {!isLoading && !error && courses.length > 0 && (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Course</Th>
                  <Th>Level</Th>
                  <Th>Duration</Th>
                  <Th align="right">Applications</Th>
                  <Th>Status</Th>
                  <Th align="right">
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const level = levelMeta(course.level);
                  return (
                    <Tr key={course.id}>
                      <Td>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 truncate">
                              {course.title}
                            </p>
                            {course.isFeatured && <Badge tone="amber">Featured</Badge>}
                          </div>
                          <p className="text-[13px] text-slate-500 truncate max-w-sm">
                            {course.description}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            /{course.slug}
                            <span className="text-slate-500 mx-1.5" aria-hidden="true">
                              ·
                            </span>
                            added {formatDate(course.createdAt)}
                          </p>
                        </div>
                      </Td>

                      <Td>
                        <Badge tone={level.tone}>{level.label}</Badge>
                      </Td>

                      <Td className="text-slate-600 whitespace-nowrap">{course.duration}</Td>

                      <Td align="right" className="tabular-nums text-slate-900">
                        {course._count?.applications ?? 0}
                      </Td>

                      <Td>
                        <StatusBadge
                          tone={course.isActive ? "green" : "neutral"}
                          label={course.isActive ? "Active" : "Archived"}
                        />
                      </Td>

                      <Td align="right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(course)}
                            aria-label={`Edit ${course.title}`}
                          >
                            <Pencil size={14} aria-hidden="true" />
                            Edit
                          </Button>
                          {course.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-500 hover:text-red-700 hover:bg-red-50"
                              loading={pendingDelete === course.slug}
                              onClick={() => handleDelete(course)}
                              aria-label={`Archive ${course.title}`}
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </TableWrap>

            {data?.pagination && (
              <Pagination pagination={data.pagination} onPageChange={setPage} />
            )}
          </>
        )}
      </Card>

      <CourseFormDialog
        key={formInstance}
        open={dialogOpen}
        course={editing}
        onOpenChange={setDialogOpen}
        onSaved={reload}
      />
    </>
  );
}
