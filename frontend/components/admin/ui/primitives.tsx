"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The admin panel's design primitives.
 *
 * The panel shares the marketing site's language — white surfaces, green
 * accents, hairline borders — so moving between the public site and the
 * back-office feels like one product. Where it diverges is density: this is a
 * tool someone sits in reading tables of names, so radii are tighter, type is
 * smaller, and the landing page's soft elevation is dialled right back.
 *
 * Colour tokens (--color-dark, --color-dark-card, --color-dark-border) come
 * from the @theme block in globals.css.
 */

// ── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  // White label on the green fill — dark text on green-600 scores about 2:1.
  // The old hover was `hover:bg-green-600`, identical to the resting state, so
  // the primary button had no hover feedback at all; it now darkens. The
  // `shadow-[0_0_20px_-8px_...]` glow is gone: a neon bloom belongs to the dark
  // theme, and on white it rendered as a green haze around the button.
  primary:
    "bg-green-700 text-white hover:bg-green-800 active:bg-green-900 focus-visible:outline-green-700 shadow-soft",
  secondary:
    "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus-visible:outline-green-600",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-green-600",
  danger:
    "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 focus-visible:outline-red-600",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading = false, disabled, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      // A busy button must not be clickable twice, but it also must not
      // silently swallow the click without saying why — hence the spinner.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap",
        "transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-40 disabled:pointer-events-none",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

// ── Card ────────────────────────────────────────────────────────────────────

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-dark-card border border-dark-border rounded-xl overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-5 py-4 border-b border-dark-border">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="text-[13px] text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────

export type BadgeTone = "neutral" | "amber" | "blue" | "green" | "red";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-slate-50 text-slate-600 ring-slate-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-500/25",
  blue: "bg-blue-50 text-blue-700 ring-blue-500/25",
  green: "bg-green-50 text-green-700 ring-green-600/30",
  red: "bg-red-50 text-red-700 ring-red-200",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5",
        "text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** A badge with a leading dot, so a status can be read down a long column
 *  without colour being the only signal. */
export function StatusBadge({ tone, label }: { tone: BadgeTone; label: string }) {
  const dot: Record<BadgeTone, string> = {
    neutral: "bg-slate-400",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    green: "bg-green-600",
    red: "bg-red-500",
  };
  return (
    <Badge tone={tone}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot[tone])} aria-hidden="true" />
      {label}
    </Badge>
  );
}

// ── Form controls ───────────────────────────────────────────────────────────

const FIELD_STYLES =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 " +
  "placeholder:text-slate-400 transition-colors " +
  "focus:border-green-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:bg-slate-100 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(FIELD_STYLES, "h-10", className)} {...props} />;
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(FIELD_STYLES, "py-2 min-h-20", className)} {...props} />;
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    // Native <option> lists are painted by the OS and ignore the page
    // surface, so the options carry their own background explicitly.
    <select
      ref={ref}
      className={cn(FIELD_STYLES, "h-10 pr-8 [&>option]:bg-dark-card [&>option]:text-slate-900", className)}
      {...props}
    >
      {children}
    </select>
  );
});

export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-600">
        {label}
        {required && <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
