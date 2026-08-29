"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { adminAPI, ApiRequestError } from "@/lib/admin-api";
import type { Course } from "@/lib/types/admin";
import { Button, Field, Input, Select, Textarea } from "./ui/primitives";
import { COURSE_LEVELS, levelMeta } from "./status";

/**
 * Create or edit a course.
 *
 * One component serves both. The only real difference is whether a slug
 * already exists, and the slug is the backend identifier, so it is locked once
 * set: editing it would create a second course and orphan every application
 * pointing at the original.
 */

interface FormState {
  slug: string;
  title: string;
  description: string;
  longDesc: string;
  duration: string;
  level: Course["level"];
  price: string;
  order: string;
  tags: string;
  isActive: boolean;
  isFeatured: boolean;
}

const EMPTY: FormState = {
  slug: "",
  title: "",
  description: "",
  longDesc: "",
  duration: "",
  level: "BEGINNER",
  price: "0",
  order: "0",
  tags: "",
  isActive: true,
  isFeatured: false,
};

function toFormState(course: Course): FormState {
  return {
    slug: course.slug,
    title: course.title,
    description: course.description,
    longDesc: course.longDesc ?? "",
    duration: course.duration,
    level: course.level,
    price: String(course.price ?? 0),
    order: String(course.order ?? 0),
    tags: (course.tags ?? []).join(", "),
    isActive: course.isActive,
    isFeatured: course.isFeatured,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CourseFormDialog({
  open,
  course,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  /** Omit to create a new course. */
  course?: Course;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(course);
  // Initialised once from props rather than synced in an effect. The parent
  // gives this component a key derived from the course, so switching which
  // course is being edited remounts it with fresh state — which also means a
  // cancelled edit cannot leak its values into the next course opened.
  const [form, setForm] = useState<FormState>(() =>
    course ? toFormState(course) : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Partial<Course> = {
      title: form.title.trim(),
      description: form.description.trim(),
      longDesc: form.longDesc.trim() || undefined,
      duration: form.duration.trim(),
      level: form.level,
      price: Number(form.price) || 0,
      order: Number(form.order) || 0,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };

    try {
      if (isEdit && course) {
        await adminAPI.updateCourse(course.slug, payload);
      } else {
        await adminAPI.createCourse({
          ...payload,
          slug: form.slug.trim() || slugify(form.title),
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof ApiRequestError ? caught.message : "Could not save the course"
      );
    } finally {
      setSaving(false);
    }
  };

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
                {isEdit ? "Edit course" : "New course"}
              </Dialog.Title>
              <Dialog.Description className="text-[13px] text-slate-500 mt-0.5">
                {isEdit
                  ? "Changes appear on the public site immediately."
                  : "The course goes live on the website as soon as it is active."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="grid place-items-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Title" htmlFor="course-title" required>
                <Input
                  id="course-title"
                  value={form.title}
                  onChange={(event) => set("title", event.target.value)}
                  placeholder="Python Development"
                  required
                />
              </Field>

              <Field
                label="Slug"
                htmlFor="course-slug"
                hint={
                  isEdit
                    ? "Fixed after creation, because applications reference it."
                    : "Leave blank to generate one from the title."
                }
              >
                <Input
                  id="course-slug"
                  value={isEdit ? form.slug : form.slug || slugify(form.title)}
                  onChange={(event) => set("slug", event.target.value)}
                  placeholder="python-development"
                  disabled={isEdit}
                />
              </Field>
            </div>

            <Field label="Short description" htmlFor="course-description" required>
              <Textarea
                id="course-description"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="One or two sentences, shown on the course card."
                required
              />
            </Field>

            <Field
              label="Full description"
              htmlFor="course-long"
              hint="Shown when a visitor opens the course from the website."
            >
              <Textarea
                id="course-long"
                value={form.longDesc}
                onChange={(event) => set("longDesc", event.target.value)}
                className="min-h-28"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Duration" htmlFor="course-duration" required>
                <Input
                  id="course-duration"
                  value={form.duration}
                  onChange={(event) => set("duration", event.target.value)}
                  placeholder="6 months"
                  required
                />
              </Field>

              <Field label="Level" htmlFor="course-level">
                <Select
                  id="course-level"
                  value={form.level}
                  onChange={(event) => set("level", event.target.value as Course["level"])}
                >
                  {COURSE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {levelMeta(level).label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Price" htmlFor="course-price" hint="Use 0 to show as free.">
                <Input
                  id="course-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(event) => set("price", event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Tags"
                htmlFor="course-tags"
                hint="Comma separated, for example: Python, Django, FastAPI"
              >
                <Input
                  id="course-tags"
                  value={form.tags}
                  onChange={(event) => set("tags", event.target.value)}
                />
              </Field>

              <Field
                label="Display order"
                htmlFor="course-order"
                hint="Lower numbers appear first on the website."
              >
                <Input
                  id="course-order"
                  type="number"
                  value={form.order}
                  onChange={(event) => set("order", event.target.value)}
                />
              </Field>
            </div>

            <fieldset className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
              <legend className="sr-only">Visibility</legend>
              <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => set("isActive", event.target.checked)}
                  className="w-4 h-4 rounded border-slate-200 bg-slate-50 text-green-700 focus:ring-green-600/30"
                />
                Active, visible on the website
              </label>
              <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) => set("isFeatured", event.target.checked)}
                  className="w-4 h-4 rounded border-slate-200 bg-slate-50 text-green-700 focus:ring-green-600/30"
                />
                Featured
              </label>
            </fieldset>

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
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" variant="primary" loading={saving}>
                {isEdit ? "Save changes" : "Create course"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
