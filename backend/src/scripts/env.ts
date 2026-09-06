/**
 * Environment and Supabase bootstrap shared by the scripts under this
 * directory (seed.ts, create-admin.ts).
 *
 * Importing this module has side effects by design: it loads backend/.env,
 * validates the credentials and exits if they are missing, so every script
 * gets the same failure message instead of its own. Nothing here imports Nest,
 * so the scripts stay free of the API's startup cost.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// In Docker (and under systemd) the variables are already in the environment,
// and there is no .env file — the read below just misses and this does nothing.
// Run by hand from backend/ it reads backend/.env, parsed the same way
// deploy-native.sh does it: no shell expansion, so a key containing `$`
// survives intact.
//
// Resolved from the working directory, not from __dirname: these files run
// from src/scripts under ts-node and from dist/scripts once compiled, so a
// relative path would point somewhere different in each case.
function loadDotEnv() {
  let raw: string;
  try {
    raw = readFileSync(join(process.cwd(), ".env"), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#") || !line.includes("=")) continue;
    const key = line.slice(0, line.indexOf("=")).trim();
    let value = line.slice(line.indexOf("=") + 1).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_KEY = (
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
)?.trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "SUPABASE_URL and SUPABASE_SECRET_KEY must be set (backend/.env or the environment)."
  );
  process.exit(1);
}

/** Service-role client. Bypasses RLS — never expose these scripts to user input. */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** The project this client writes to, for scripts that confirm before writing. */
export const supabaseUrl = SUPABASE_URL;

export const nowIso = () => new Date().toISOString();

/** Throws rather than letting supabase-js return a silent `{ error }`. */
export function check(context: string, error: { message: string } | null) {
  if (error) throw new Error(`${context}: ${error.message}`);
}
