/**
 * Per-route rate limits.
 *
 * The global config in app.module.ts registers two named buckets, "burst" and
 * "sustained". A `@Throttle` override replaces only the buckets it names, so an
 * override that mentions one of them leaves the other running at its permissive
 * global value — which is how a "5 login attempts per minute" rule quietly ends
 * up allowing 100. Every entry here sets both, so the limit written is the
 * limit enforced.
 */

/** Both buckets set to the same window and count. */
function bothBuckets(ttl: number, limit: number) {
  return { burst: { ttl, limit }, sustained: { ttl, limit } };
}

const MINUTE = 60_000;
const HOUR = 3_600_000;

/**
 * Admin login. The one endpoint where request throughput converts directly into
 * guessed passwords, so this is by far the tightest limit on the API. Five a
 * minute is invisible to a real operator and useless to a dictionary attack.
 */
export const THROTTLE_LOGIN = bothBuckets(MINUTE, 5);

/**
 * Public application form: unauthenticated and it writes a row, so it is the
 * obvious spam target. A real applicant submits once; five an hour leaves room
 * for a genuine correction without letting a script fill the table.
 */
export const THROTTLE_APPLICATION = bothBuckets(HOUR, 5);

/**
 * Page-view tracking: unauthenticated by necessity and called on every
 * navigation. Generous enough for real browsing, bounded enough that it cannot
 * be used to inflate the table indefinitely.
 */
export const THROTTLE_ANALYTICS = bothBuckets(MINUTE, 30);

/**
 * Exempt a route from both buckets.
 *
 * A bare `@SkipThrottle()` expands to `{ default: true }`, and there is no
 * bucket called "default" here — so it silently exempts nothing and the route
 * stays rate limited. Both names have to be listed, for the same reason the
 * overrides above list both.
 */
export const SKIP_THROTTLE = { burst: true, sustained: true };
