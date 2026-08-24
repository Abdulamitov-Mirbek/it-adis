"use client";

import { AlertTriangle, Inbox, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./primitives";

/**
 * Loading, empty and error states.
 *
 * The panel previously had only one of these — an indefinite spinner — which
 * is why a misconfigured backend URL looked identical to a slow network and
 * to an empty database. Each state now says something different and, where
 * the operator can do something about it, offers the action.
 */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-white/8", className)}
      aria-hidden="true"
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-dark-border" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-5 py-4">
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn("h-4", columnIndex === 0 ? "w-1/4" : "flex-1")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid place-items-center w-11 h-11 rounded-full bg-white/5 text-green-100/40 mb-4">
        <Inbox size={20} aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-green-50">{title}</p>
      {description && (
        <p className="text-[13px] text-green-100/50 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/**
 * `code` comes from the API error envelope. A connectivity problem is the
 * operator's to escalate; a server error is not, and the difference is worth
 * showing rather than flattening into "something went wrong".
 */
export function ErrorState({
  message,
  code,
  onRetry,
}: {
  message: string;
  code?: string;
  onRetry?: () => void;
}) {
  const isConnectivity =
    code === "BACKEND_UNREACHABLE" ||
    code === "BACKEND_TIMEOUT" ||
    code === "NETWORK_ERROR";

  const Icon = isConnectivity ? WifiOff : AlertTriangle;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid place-items-center w-11 h-11 rounded-full bg-red-500/10 text-red-400 mb-4">
        <Icon size={20} aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-green-50">
        {isConnectivity ? "Cannot reach the server" : "Something went wrong"}
      </p>
      <p className="text-[13px] text-green-100/50 mt-1 max-w-md">{message}</p>
      {isConnectivity && (
        <p className="text-xs text-green-100/35 mt-2 max-w-md">
          If this persists, check that BACKEND_API_URL is set correctly in the
          deployment settings.
        </p>
      )}
      {onRetry && (
        <Button onClick={onRetry} className="mt-5" size="sm">
          <RefreshCw size={14} aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
