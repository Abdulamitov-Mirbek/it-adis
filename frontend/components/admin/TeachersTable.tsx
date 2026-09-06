"use client";

import { useCallback, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { adminAPI, ApiRequestError } from "@/lib/admin-api";
import type { Teacher } from "@/lib/types/admin";
import { Badge, Button, Card, CardHeader, StatusBadge } from "./ui/primitives";
import { EmptyState, ErrorState, TableSkeleton } from "./ui/states";
import { TableWrap, Td, Th, Tr } from "./ui/DataTable";
import { useAdminQuery } from "./useAdminQuery";
import { TeacherFormDialog } from "./TeacherFormDialog";
import { teacherColor } from "./teacher-colors";

/**
 * The mentor roster.
 *
 * Unpaginated on purpose: the backend returns every teacher in display order
 * and a school has tens of them, not thousands. Paging would only hide the
 * ordering the operator is trying to reason about.
 */
export function TeachersTable() {
  const t = useTranslations("admin.teachers");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Bumped on every open so the dialog remounts with fresh state each time.
  const [formInstance, setFormInstance] = useState(0);

  const { data, error, isLoading, reload } = useAdminQuery(
    useCallback(() => adminAPI.getTeachers(), [])
  );

  const openCreate = useCallback(() => {
    setEditing(undefined);
    setFormInstance((value) => value + 1);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((teacher: Teacher) => {
    setEditing(teacher);
    setFormInstance((value) => value + 1);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (teacher: Teacher) => {
      // Teachers are deleted outright, not archived like courses, so the
      // confirmation says so plainly rather than borrowing the softer wording.
      if (!window.confirm(t("deleteConfirm", { name: teacher.name }))) return;

      setPendingDelete(teacher.id);
      setActionError(null);
      try {
        await adminAPI.deleteTeacher(teacher.id);
        reload();
      } catch (caught) {
        setActionError(
          caught instanceof ApiRequestError ? caught.message : t("deleteFailed")
        );
      } finally {
        setPendingDelete(null);
      }
    },
    [reload, t]
  );

  const teachers = data ?? [];

  return (
    <>
      <Card>
        <CardHeader
          title={t("title")}
          description={t("description")}
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={15} aria-hidden="true" />
              {t("new")}
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

        {isLoading && <TableSkeleton rows={5} columns={4} />}

        {!isLoading && error && (
          <ErrorState message={error.message} code={error.code} onRetry={reload} />
        )}

        {!isLoading && !error && teachers.length === 0 && (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={
              <Button variant="primary" size="sm" onClick={openCreate}>
                <Plus size={15} aria-hidden="true" />
                {t("new")}
              </Button>
            }
          />
        )}

        {!isLoading && !error && teachers.length > 0 && (
          <TableWrap>
            <thead>
              <tr>
                <Th>{t("columns.mentor")}</Th>
                <Th>{t("columns.tags")}</Th>
                <Th align="right">{t("columns.order")}</Th>
                <Th>{t("columns.status")}</Th>
                <Th align="right">
                  <span className="sr-only">{t("columns.actions")}</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <Tr key={teacher.id}>
                  <Td>
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`relative w-10 h-10 rounded-xl overflow-hidden shrink-0 grid place-items-center text-xs font-semibold text-slate-900 bg-gradient-to-br ${teacherColor(teacher.color)}`}
                        aria-hidden="true"
                      >
                        {teacher.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={teacher.photoUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          teacher.initials
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {teacher.name}
                        </p>
                        <p className="text-[13px] text-slate-500 truncate max-w-xs">
                          {teacher.role}
                        </p>
                      </div>
                    </div>
                  </Td>

                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {(teacher.tags ?? []).map((tag) => (
                        <Badge key={tag} tone="neutral">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </Td>

                  <Td align="right" className="tabular-nums text-slate-600">
                    {teacher.order}
                  </Td>

                  <Td>
                    <StatusBadge
                      tone={teacher.isActive ? "green" : "neutral"}
                      label={teacher.isActive ? t("visible") : t("hidden")}
                    />
                  </Td>

                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(teacher)}
                        aria-label={t("editAria", { name: teacher.name })}
                      >
                        <Pencil size={14} aria-hidden="true" />
                        {t("edit")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-red-700 hover:bg-red-50"
                        loading={pendingDelete === teacher.id}
                        onClick={() => void handleDelete(teacher)}
                        aria-label={t("deleteAria", { name: teacher.name })}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <TeacherFormDialog
        key={formInstance}
        open={dialogOpen}
        teacher={editing}
        onOpenChange={setDialogOpen}
        onSaved={reload}
      />
    </>
  );
}
