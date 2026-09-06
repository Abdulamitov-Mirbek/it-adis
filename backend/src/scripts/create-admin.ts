/**
 * Creates an admin_users row — the login for a new manager.
 *
 * Locally:   ./create-admin.sh manager@itadis.edu "Aigerim Eralieva"
 * In Docker: ./create-admin.sh manager@itadis.edu "Aigerim Eralieva" --docker
 *
 * Lives under src/ for the same reason seed.ts does: everything under src/ is
 * compiled into dist/, so this ships inside the runtime image and can be run
 * against the deployed stack, where there is no ts-node. The repo-root
 * create-admin.sh is a thin wrapper that picks the right runner.
 *
 * Why this exists when seed.ts already writes an admin: the seed hardcodes the
 * name "IT ADIS Admin", re-seeds the entire course catalogue on every run, and
 * silently resets the password of any email it finds. This touches admin_users
 * alone, keeps real names, and refuses to overwrite an existing account unless
 * you say --update.
 *
 * admin_users has no role column: every row here is a full admin.
 */
import { randomBytes, randomUUID } from "crypto";
import * as bcrypt from "bcryptjs";
import { supabase, supabaseUrl, nowIso, check } from "./env";

/**
 * LoginDto only requires 6 characters, which is the floor for the public login
 * endpoint. These are admin credentials being minted by hand, so hold them to
 * something an offline bcrypt attack cannot chew through.
 */
const MIN_PASSWORD_LENGTH = 12;

/** Matches class-validator's @IsEmail closely enough to catch a typo. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USAGE = `
Creates an admin login for a new manager.

  Usage: ./create-admin.sh <email> "<Full Name>" [options]

  Options:
    --generate   Generate a strong random password and print it once,
                 instead of prompting for one.
    --update     Update an existing account (password and name) instead of
                 refusing. Without this, an email already in admin_users is
                 an error, so a typo cannot lock a colleague out.
    --docker     Run inside the deployed backend container (wrapper only).
    -h, --help   Show this message.

  Every account created here is a full admin: admin_users has no roles.
`;

interface Args {
  email: string;
  name: string;
  generate: boolean;
  update: boolean;
}

/**
 * A message meant for the operator, not a stack trace.
 *
 * These throw rather than calling process.exit, because by the time most of
 * them fire supabase-js is holding open sockets. Tearing the process down
 * underneath them trips a libuv assertion on Windows
 * ("UV_HANDLE_CLOSING", src/win/async.c) and — worse — replaces the intended
 * exit code with 127, so any caller checking the status gets nonsense. Setting
 * process.exitCode and letting the event loop drain costs under a second and
 * exits correctly.
 */
class CliError extends Error {}

function fail(message: string): never {
  throw new CliError(message);
}

/** Null means the caller asked for --help and nothing else should run. */
function parseArgs(argv: string[]): Args | null {
  if (argv.includes("-h") || argv.includes("--help")) {
    console.log(USAGE);
    return null;
  }

  const known = new Set(["--generate", "--update"]);
  const flags = argv.filter((a) => a.startsWith("-"));
  const positional = argv.filter((a) => !a.startsWith("-"));

  const unknown = flags.filter((f) => !known.has(f));
  if (unknown.length) {
    fail(`Unknown option: ${unknown.join(", ")}\n${USAGE}`);
  }

  const [email, name] = positional;
  if (!email || !name) {
    fail(`Both an email and a name are required.\n${USAGE}`);
  }
  if (positional.length > 2) {
    fail(
      "Too many arguments. Quote the name as one word:\n" +
        `  ./create-admin.sh ${email} "${positional.slice(1).join(" ")}"\n`
    );
  }
  if (!EMAIL_RE.test(email)) {
    fail(`"${email}" does not look like an email address.`);
  }

  return {
    email: email.trim().toLowerCase(),
    name: name.trim(),
    generate: flags.includes("--generate"),
    update: flags.includes("--update"),
  };
}

// Control bytes a raw-mode terminal delivers as ordinary data. Built by code
// point rather than written literally so they survive copy-paste and diffs.
const CTRL_C = String.fromCharCode(3);
const CTRL_D = String.fromCharCode(4);
const BACKSPACE = String.fromCharCode(8);
const DELETE = String.fromCharCode(127);

/**
 * Reads a password without echoing it.
 *
 * Raw mode rather than readline: readline's own masking hooks are private API,
 * and this needs to restore the terminal exactly as it found it even when the
 * user hits Ctrl-C mid-entry.
 */
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      reject(
        new Error(
          "No terminal available to prompt for a password.\n" +
            "  Run this from an interactive shell, or pass --generate."
        )
      );
      return;
    }

    process.stdout.write(question);
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(wasRaw);
      stdin.pause();
      process.stdout.write("\n");
    };

    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === CTRL_D) {
          cleanup();
          resolve(value);
          return;
        }
        // Raw mode swallows the interrupt signal, so act on it here.
        if (ch === CTRL_C) {
          cleanup();
          reject(new Error("Cancelled."));
          return;
        }
        if (ch === DELETE || ch === BACKSPACE) {
          value = value.slice(0, -1);
          continue;
        }
        // Anything below space is a control or escape sequence, not input.
        if (ch >= " ") value += ch;
      }
    };

    stdin.on("data", onData);
  });
}

/** 24 URL-safe characters, ~144 bits. */
function generatePassword(): string {
  return randomBytes(18).toString("base64url");
}

async function resolvePassword(
  args: Args
): Promise<{ password: string; generated: boolean }> {
  if (args.generate) {
    return { password: generatePassword(), generated: true };
  }

  const password = await promptHidden(`  Password for ${args.email}: `);
  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters ` +
        `(got ${password.length}). Or use --generate.`
    );
  }

  const confirm = await promptHidden("  Confirm password: ");
  if (password !== confirm) {
    fail("Passwords did not match.");
  }

  return { password, generated: false };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args) return;

  console.log(`\nCreating admin login on ${supabaseUrl}`);

  const { data: existing, error: findError } = await supabase
    .from("admin_users")
    .select("id, name")
    .eq("email", args.email)
    .maybeSingle();
  check("look up admin user", findError);

  if (existing && !args.update) {
    fail(
      `${args.email} is already an admin ("${existing.name}").\n` +
        "  To reset that account's password and name, re-run with --update."
    );
  }

  const { password, generated } = await resolvePassword(args);
  const passwordHash = bcrypt.hashSync(password, 10);

  if (existing) {
    const { error } = await supabase
      .from("admin_users")
      .update({ passwordHash, name: args.name, updatedAt: nowIso() })
      .eq("email", args.email);
    check("update admin user", error);
    console.log(`\n  ✓ Updated admin: ${args.name} <${args.email}>`);
  } else {
    const now = nowIso();
    const { error } = await supabase.from("admin_users").insert({
      id: randomUUID(),
      email: args.email,
      passwordHash,
      name: args.name,
      createdAt: now,
      updatedAt: now,
    });
    check("insert admin user", error);
    console.log(`\n  ✓ Created admin: ${args.name} <${args.email}>`);
  }

  if (generated) {
    console.log(`\n  Password: ${password}`);
    console.log("  ! Shown once and never stored in plain text. Save it now.");
  }

  console.log("\n  They can now sign in at the admin panel.\n");
}

main().catch((e) => {
  // A CliError is a message for the operator; anything else is a genuine bug
  // and keeps its stack trace.
  if (e instanceof CliError) {
    console.error(`\n✗ ${e.message}\n`);
  } else {
    console.error(e);
  }
  // Not process.exit — see CliError. The process ends once supabase-js lets
  // go of its sockets, which takes well under a second.
  process.exitCode = 1;
});
