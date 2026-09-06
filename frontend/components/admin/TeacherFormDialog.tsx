"use client";

import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ImagePlus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { adminAPI, ApiRequestError } from "@/lib/admin-api";
import type { Teacher } from "@/lib/types/admin";
import { Button, Field, Input, Select, Textarea } from "./ui/primitives";
import { TEACHER_COLORS } from "./teacher-colors";

/**
 * Create or edit a mentor.
 *
 * The photo is handled separately from the rest of the form because it needs a
 * teacher id to attach to. On an edit it uploads immediately; on a create the
 * file is held until the teacher exists, then uploaded, so a new mentor can be
 * added with a photo in one pass without the dialog needing two steps.
 */

interface FormState {
  name: string;
  role: string;
  bio: string;
  tags: string;
  initials: string;
  color: string;
  order: string;
  isActive: boolean;
}

const EMPTY: FormState = {
  name: "",
  role: "",
  bio: "",
  tags: "",
  initials: "",
  color: TEACHER_COLORS[0].value,
  order: "0",
  isActive: true,
};

/** Same rule the backend applies when initials are left blank. */
function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function toFormState(teacher: Teacher): FormState {
  return {
    name: teacher.name,
    role: teacher.role,
    bio: teacher.bio,
    tags: (teacher.tags ?? []).join(", "),
    initials: teacher.initials,
    color: teacher.color,
    order: String(teacher.order ?? 0),
    isActive: teacher.isActive,
  };
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function TeacherFormDialog({
  open,
  teacher,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  /** Omit to create a new mentor. */
  teacher?: Teacher;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const t = useTranslations("admin.teacherForm");
  const isEdit = Boolean(teacher);

  const [form, setForm] = useState<FormState>(() =>
    teacher ? toFormState(teacher) : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(teacher?.photoUrl ?? null);
  /** Held for a create, where there is no id to upload against yet. */
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleFileChosen = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (file.size > MAX_PHOTO_BYTES) {
      setError(t("photoTooLarge"));
      return;
    }

    if (isEdit && teacher) {
      setSaving(true);
      try {
        const updated = await adminAPI.uploadTeacherPhoto(teacher.id, file);
        setPhotoUrl(updated.photoUrl);
        setPreviewUrl(null);
        setPendingPhoto(null);
        onSaved();
      } catch (caught) {
        setError(
          caught instanceof ApiRequestError ? caught.message : t("photoFailed")
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    // Creating: show it locally and upload once the row exists.
    setPendingPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemovePhoto = async () => {
    setPendingPhoto(null);
    setPreviewUrl(null);
    if (!isEdit || !teacher) {
      setPhotoUrl(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminAPI.updateTeacher(teacher.id, { photoUrl: null });
      setPhotoUrl(null);
      onSaved();
    } catch (caught) {
      setError(caught instanceof ApiRequestError ? caught.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Partial<Teacher> = {
      name: form.name.trim(),
      role: form.role.trim(),
      bio: form.bio.trim(),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      initials: form.initials.trim() || initialsFrom(form.name),
      color: form.color,
      order: Number(form.order) || 0,
      isActive: form.isActive,
    };

    try {
      if (isEdit && teacher) {
        await adminAPI.updateTeacher(teacher.id, payload);
      } else {
        const created = await adminAPI.createTeacher(payload);
        if (pendingPhoto) {
          await adminAPI.uploadTeacherPhoto(created.id, pendingPhoto);
        }
      }
      onSaved();
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof ApiRequestError ? caught.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const shownPhoto = previewUrl ?? photoUrl;
  const shownInitials = form.initials.trim() || initialsFrom(form.name) || "?";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[calc(100vw-2rem)] max-w-2xl max-h-[calc(100vh-3rem)] overflow-y-auto
                     bg-dark-card rounded-2xl border border-dark-border shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-dark-border sticky top-0 bg-dark-card rounded-t-2xl z-10">
            <div>
              <Dialog.Title className="font-display text-base font-semibold text-slate-900">
                {isEdit ? t("editTitle") : t("newTitle")}
              </Dialog.Title>
              <Dialog.Description className="text-[13px] text-slate-500 mt-0.5">
                {isEdit ? t("editDescription") : t("newDescription")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="grid place-items-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                aria-label={t("close")}
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div
                className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 grid place-items-center font-display text-2xl font-bold text-slate-900 shadow-lg bg-gradient-to-br ${form.color}`}
              >
                {shownPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shownPhoto}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  shownInitials
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[13px] font-medium text-slate-900">{t("photo")}</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-2">{t("photoHint")}</p>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      void handleFileChosen(event.target.files?.[0]);
                      // Cleared so choosing the same file twice still fires.
                      event.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={saving}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus size={14} aria-hidden="true" />
                    {shownPhoto ? t("photoReplace") : t("photoUpload")}
                  </Button>
                  {shownPhoto && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={saving}
                      className="text-slate-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => void handleRemovePhoto()}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      {t("photoRemove")}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("name")} htmlFor="teacher-name" required>
                <Input
                  id="teacher-name"
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                  placeholder={t("namePlaceholder")}
                  required
                />
              </Field>

              <Field label={t("role")} htmlFor="teacher-role" required>
                <Input
                  id="teacher-role"
                  value={form.role}
                  onChange={(event) => set("role", event.target.value)}
                  placeholder={t("rolePlaceholder")}
                  required
                />
              </Field>
            </div>

            <Field label={t("bio")} htmlFor="teacher-bio" hint={t("bioHint")} required>
              <Textarea
                id="teacher-bio"
                value={form.bio}
                onChange={(event) => set("bio", event.target.value)}
                maxLength={600}
                required
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("tags")} htmlFor="teacher-tags" hint={t("tagsHint")}>
                <Input
                  id="teacher-tags"
                  value={form.tags}
                  onChange={(event) => set("tags", event.target.value)}
                />
              </Field>

              <Field
                label={t("initials")}
                htmlFor="teacher-initials"
                hint={t("initialsHint")}
              >
                <Input
                  id="teacher-initials"
                  value={form.initials}
                  onChange={(event) => set("initials", event.target.value)}
                  placeholder={initialsFrom(form.name)}
                  maxLength={4}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("color")} htmlFor="teacher-color" hint={t("colorHint")}>
                <Select
                  id="teacher-color"
                  value={form.color}
                  onChange={(event) => set("color", event.target.value)}
                >
                  {TEACHER_COLORS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t("order")} htmlFor="teacher-order" hint={t("orderHint")}>
                <Input
                  id="teacher-order"
                  type="number"
                  value={form.order}
                  onChange={(event) => set("order", event.target.value)}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => set("isActive", event.target.checked)}
                className="w-4 h-4 rounded border-slate-200 bg-slate-50 text-green-700 focus:ring-green-600/30"
              />
              {t("isActive")}
            </label>

            {error && (
              <p
                className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-dark-border -mx-6 px-6 pt-4">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary">
                  {t("cancel")}
                </Button>
              </Dialog.Close>
              <Button type="submit" variant="primary" loading={saving}>
                {isEdit ? t("save") : t("create")}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
