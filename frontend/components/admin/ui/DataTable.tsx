"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Pagination as PaginationMeta } from "@/lib/types/admin";
import { Button } from "./primitives";

/**
 * Table shell for the admin lists.
 *
 * The wrapper scrolls horizontally on its own rather than letting the page
 * scroll sideways, so a wide table on a laptop never drags the whole layout
 * out from under the sidebar.
 */

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-5 py-3 bg-white/[0.03] border-b border-dark-border",
        "text-[11px] font-semibold uppercase tracking-wider text-green-100/45",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-5 py-3.5 text-sm text-green-100/80 align-middle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}

export function Tr({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-dark-border/60 last:border-0 hover:bg-white/[0.03] transition-colors">
      {children}
    </tr>
  );
}

export function Pagination({
  pagination,
  onPageChange,
  disabled = false,
}: {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const { page, limit, total, pages } = pagination;

  // Guard against a zero-result response, where first would otherwise read 1
  // and produce "Showing 1 to 0 of 0".
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-dark-border">
      <p className="text-[13px] text-green-100/50" aria-live="polite">
        Showing <span className="font-medium text-green-50">{first}</span>–
        <span className="font-medium text-green-50">{last}</span> of{" "}
        <span className="font-medium text-green-50">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          Previous
        </Button>
        <span className="text-[13px] text-green-100/50 tabular-nums px-1">
          {page} / {Math.max(pages, 1)}
        </span>
        <Button
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= pages}
          aria-label="Next page"
        >
          Next
          <ChevronRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
