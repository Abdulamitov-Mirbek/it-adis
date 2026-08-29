/**
 * Secret loading, validated once at boot.
 *
 * JWT_SECRET previously fell back to the literal string 'itadis-jwt-secret-2026'
 * in two places. That string is in the git history of a public repository, so
 * any deployment that forgot to set the variable could be handed a forged admin
 * token by anyone who had read the source — the signature would verify, the
 * strategy would look the user up by `sub`, and the request would sail through
 * every guard. A missing secret must stop the process, never silently degrade
 * into a known one.
 */

/** Rejects the values a hurried deploy is most likely to paste in. */
const FORBIDDEN = new Set([
  "itadis-jwt-secret-2026",
  "itadis_admin_2026",
  "secret",
  "changeme",
  "development",
  "production",
]);

const MIN_LENGTH = 32;

export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not set. Generate one with `node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"` " +
        "and set it in the environment before starting the API."
    );
  }

  if (FORBIDDEN.has(secret.toLowerCase())) {
    throw new Error(
      "JWT_SECRET is one of the placeholder values published in this repository. " +
        "Replace it with a freshly generated random secret."
    );
  }

  if (secret.length < MIN_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_LENGTH} characters; got ${secret.length}. ` +
        "A short secret is brute-forceable offline once an attacker holds any signed token."
    );
  }

  return secret;
}

/**
 * How long an admin session stays valid. Overridable for local testing.
 *
 * Was 24h. Shortened because there is no refresh or revocation path here: a
 * token that leaks stays valid for its full lifetime, so the lifetime is the
 * only lever available. Rejected outright if it is not a duration jsonwebtoken
 * understands, rather than silently signing tokens that never expire.
 */
const DURATION = /^\d+(\.\d+)?\s*(ms|s|m|h|d|w|y)?$/i;

function readExpiry(): string {
  const raw = process.env.JWT_EXPIRES_IN?.trim();
  if (!raw) return "8h";
  if (!DURATION.test(raw)) {
    throw new Error(
      `JWT_EXPIRES_IN must be a duration such as "8h", "30m" or "7d"; got "${raw}".`
    );
  }
  return raw;
}

export const JWT_EXPIRES_IN = readExpiry();
