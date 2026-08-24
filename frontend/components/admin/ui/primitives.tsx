"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The admin panel's design primitives.
 *
 * The panel shares the marketing site's language — near-black surfaces, green
 * accents, hairline borders — so moving between the public site and the
 * back-office feels like one product. Where it diverges is density: this is a
 * tool someone sits in reading tables of names, so radii are tighter, type is
 * smaller, and the decorative glow of the landing page is absent.
 *
 * Colour tokens (--color-dark, --color-dark-card, --color-dark-border) come
 * from the @theme block in globals.css.
 */

// ── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-green-600 text-white hover:bg-green-500 active:bg-green-700 focus-visible:outline-green-400 shadow-[0_0_20px_-8px_var(--color-green-500)]",
  secondary:
    "bg-white/5 text-green-50 border border-white/10 hover:bg-white/10 hover:border-white/20 active:bg-white/15 focus-visible:outline-green-400",
  ghost:
    "bg-transparent text-green-100/70 hover:bg-white/5 hover:text-green-50 focus-visible:outline-green-400",
  danger:
    "bg-red-500/10 text-red-300 border border-red-500/25 hover:bg-red-500/20 hover:text-red-200 focus-visible:outline-red-400",
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
        <h2 className="text-sm font-semibold text-green-50">{title}</h2>
        {description && (
          <p className="text-[13px] text-green-100/50 mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────

export type BadgeTone = "neutral" | "amber" | "blue" | "green" | "red";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-white/5 text-green-100/70 ring-white/10",
  amber: "bg-amber-500/10 text-amber-300 ring-amber-500/25",
  blue: "bg-blue-500/10 text-blue-300 ring-blue-500/25",
  green: "bg-green-500/10 text-green-300 ring-green-500/25",
  red: "bg-red-500/10 text-red-300 ring-red-500/25",
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
    neutral: "bg-green-100/40",
    amber: "bg-amber-400",
    blue: "bg-blue-400",
    green: "bg-green-400",
    red: "bg-red-400",
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
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-green-50 " +
  "placeholder:text-green-100/25 transition-colors " +
  "focus:border-green-500/60 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white/8 " +
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
    // Native <option> lists are painted by the OS and ignore the dark surface,
    // so the options carry their own background rather than rendering as
    // black-on-black in some browsers.
    <select
      ref={ref}
      className={cn(FIELD_STYLES, "h-10 pr-8 [&>option]:bg-dark-card [&>option]:text-green-50", className)}
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
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-green-100/80">
        {label}
        {required && <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-green-100/40">{hint}</p>}
    </div>
  );
}
