"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/admin-api";

export interface QueryError {
  message: string;
  code?: string;
}

/**
 * Data fetching for the admin views: one place for the loading flag, the typed
 * error and the retry.
 *
 * `fetcher` must be stable — wrap it in useCallback at the call site, with the
 * things it reads (page, filter) as its dependencies. Refetching is then just
 * a consequence of that identity changing, so there is no second list of
 * dependencies here to drift out of step with the first.
 *
 * `reload` re-runs the fetcher. The old panel offered window.location.reload()
 * instead, which threw away the whole client and the operator's place in the
 * table to recover from a single failed request.
 */
export function useAdminQuery<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<QueryError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  // react-hooks/set-state-in-effect flags this pattern because it assumes a
  // framework-level data layer is available. There is none in this project, and
  // an effect with a cancellation flag is the correct primitive for a fetch
  // tied to a component's lifetime.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        // A 401 has already cleared the session and triggered a redirect;
        // surfacing it as an error too would flash a scary message on the way
        // out to the login screen.
        if (caught instanceof ApiRequestError && caught.code === "UNAUTHORIZED") return;

        setError({
          message: caught instanceof Error ? caught.message : "Unexpected error",
          code: caught instanceof ApiRequestError ? caught.code : undefined,
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      // Guards against a slow first request resolving after the filter changed
      // and overwriting the newer results.
      cancelled = true;
    };
  }, [fetcher, nonce]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, error, isLoading, reload, setData };
}
