#!/usr/bin/env python3
"""
Repair itadis-backend / itadis-frontend systemd units after a 226/NAMESPACE failure.

status=226/NAMESPACE means systemd could not build the unit's mount namespace.
With these units the cause is almost always ReadWritePaths= (or WorkingDirectory=)
naming a directory that does not exist: ProtectSystem=strict makes the filesystem
read-only, ReadWritePaths punches a hole back through it, and systemd refuses to
start the service at all if that hole points at nothing. The service never
execs, so the log mentions node without node being the problem.

This script finds where the code actually is, finds a node systemd can execute,
rewrites both units to match, and restarts them.

Run as root:   sudo python3 fix-services.py
Dry run:       sudo python3 fix-services.py --dry-run
"""

from __future__ import annotations

import argparse
import glob
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime

SERVICES = {
    "itadis-backend": {
        "unit": "/etc/systemd/system/itadis-backend.service",
        "component": "backend",
        # Proof the directory is a built backend, not just a folder with the name.
        "marker": os.path.join("dist", "main.js"),
        "port": 3001,
    },
    "itadis-frontend": {
        "unit": "/etc/systemd/system/itadis-frontend.service",
        "component": "frontend",
        "marker": os.path.join("node_modules", "next", "dist", "bin", "next"),
        "port": 3000,
    },
}

SEARCH_ROOTS = ["/opt/itadis", "/opt", "/srv", "/home"]
MAX_DEPTH = 4

GREEN, RED, YELLOW, DIM, BOLD, RESET = (
    "\033[32m", "\033[31m", "\033[33m", "\033[2m", "\033[1m", "\033[0m"
)


def say(msg: str) -> None:
    print(f"{msg}", flush=True)


def step(n: str, msg: str) -> None:
    print(f"\n{BOLD}[{n}]{RESET} {msg}", flush=True)


def ok(msg: str) -> None:
    print(f"  {GREEN}OK{RESET}   {msg}", flush=True)


def warn(msg: str) -> None:
    print(f"  {YELLOW}WARN{RESET} {msg}", flush=True)


def fail(msg: str) -> None:
    print(f"  {RED}FAIL{RESET} {msg}", flush=True)


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if check and proc.returncode != 0:
        fail(" ".join(cmd))
        if proc.stdout.strip():
            print(f"       {proc.stdout.strip()}")
        if proc.stderr.strip():
            print(f"       {proc.stderr.strip()}")
        raise SystemExit(1)
    return proc


# ── 1. Locate the application directories ────────────────────────────────────

def find_component(component: str, marker: str) -> str | None:
    """Find e.g. .../backend containing dist/main.js.

    Ordered by how likely the answer is, so a correct layout costs one stat call
    and a misplaced clone is still found by the walk.
    """
    preferred = [
        f"/opt/itadis/{component}",
        f"/opt/itadis/it-adis/{component}",
    ]
    for path in preferred:
        if os.path.isfile(os.path.join(path, marker)):
            return path

    seen: set[str] = set()
    for root in SEARCH_ROOTS:
        if not os.path.isdir(root):
            continue
        base_depth = root.rstrip("/").count("/")
        for dirpath, dirnames, _ in os.walk(root):
            # Never descend into these: node_modules alone is tens of thousands
            # of directories and would make this take minutes.
            dirnames[:] = [
                d for d in dirnames
                if d not in {"node_modules", ".git", ".next", "dist", "proc", "sys"}
            ]
            if dirpath.count("/") - base_depth > MAX_DEPTH:
                dirnames[:] = []
                continue
            candidate = os.path.join(dirpath, component)
            if candidate in seen:
                continue
            seen.add(candidate)
            if os.path.isfile(os.path.join(candidate, marker)):
                return candidate
    return None


def find_component_loose(component: str) -> str | None:
    """Fallback: the directory exists but is not built yet."""
    for path in (f"/opt/itadis/{component}", f"/opt/itadis/it-adis/{component}"):
        if os.path.isdir(path):
            return path
    hits = glob.glob(f"/opt/itadis/*/{component}") + glob.glob(f"/opt/*/{component}")
    return hits[0] if hits else None


# ── 2. Locate a node binary systemd can actually execute ─────────────────────

def candidate_nodes() -> list[str]:
    found: list[str] = []
    which = shutil.which("node")
    if which:
        found.append(which)
    found += ["/usr/bin/node", "/usr/local/bin/node", "/snap/bin/node"]
    # nvm / fnm / volta installs, for any user on the box
    patterns = [
        "/root/.nvm/versions/node/*/bin/node",
        "/home/*/.nvm/versions/node/*/bin/node",
        "/home/*/.local/share/fnm/node-versions/*/installation/bin/node",
        "/home/*/.volta/tools/image/node/*/bin/node",
        "/usr/local/n/versions/node/*/bin/node",
    ]
    for pattern in patterns:
        found += sorted(glob.glob(pattern), reverse=True)
    # De-duplicate, preserving order.
    out: list[str] = []
    for path in found:
        real = os.path.realpath(path)
        if real not in out and os.path.isfile(real) and os.access(real, os.X_OK):
            out.append(real)
    return out


def node_version(path: str) -> str | None:
    try:
        proc = subprocess.run([path, "--version"], capture_output=True, text=True, timeout=15)
        return proc.stdout.strip() if proc.returncode == 0 else None
    except Exception:
        return None


def pick_node() -> tuple[str | None, str | None, bool]:
    """Return (path, version, under_home).

    `under_home` matters: these units set ProtectHome=true, which hides /home
    from the service. A node living in /home/ubuntu/.nvm/... is then genuinely
    absent at exec time — the same "No such file or directory" with the binary
    sitting right there for any interactive shell.
    """
    for path in candidate_nodes():
        version = node_version(path)
        if not version:
            continue
        major = int(re.sub(r"[^0-9].*$", "", version.lstrip("v")) or 0)
        if major < 20:
            warn(f"skipping {path} ({version}) — Next requires Node 20+")
            continue
        return path, version, path.startswith(("/home/", "/root/"))
    return None, None, False


# ── 3. Rewrite the unit files ────────────────────────────────────────────────

def patch_exec_start(line: str, node_path: str) -> str:
    """Replace only argv[0] when it is a node binary; keep every argument."""
    value = line.split("=", 1)[1].strip()
    prefixes = ""
    while value[:1] in ("-", "@", "+", "!"):
        prefixes += value[0]
        value = value[1:]
    parts = value.split()
    if not parts:
        return line
    first = parts[0]
    if first == "node" or os.path.basename(first) == "node":
        parts[0] = node_path
    return f"ExecStart={prefixes}{' '.join(parts)}"


def patch_unit(unit_path: str, app_dir: str, node_path: str, dry_run: bool) -> bool:
    if not os.path.isfile(unit_path):
        fail(f"{unit_path} does not exist")
        return False

    with open(unit_path, "r", encoding="utf-8") as handle:
        original = handle.read()

    out_lines: list[str] = []
    changes: list[str] = []

    for raw in original.splitlines():
        stripped = raw.strip()
        key = stripped.split("=", 1)[0].strip() if "=" in stripped else ""

        if key == "WorkingDirectory":
            new = f"WorkingDirectory={app_dir}"
            if stripped != new:
                changes.append(f"{stripped}  ->  {new}")
            out_lines.append(new)

        elif key == "ReadWritePaths":
            # The actual cause of 226/NAMESPACE. Left pointing at a missing
            # directory, systemd aborts before it ever looks at ExecStart.
            new = f"ReadWritePaths={app_dir}"
            if stripped != new:
                changes.append(f"{stripped}  ->  {new}")
            out_lines.append(new)

        elif key == "ExecStart":
            new = patch_exec_start(stripped, node_path)
            if stripped != new:
                changes.append(f"{stripped}  ->  {new}")
            out_lines.append(new)

        elif key == "EnvironmentFile":
            path = stripped.split("=", 1)[1].strip().lstrip("-")
            if not os.path.isfile(path):
                # A missing EnvironmentFile is a hard start failure unless the
                # path is prefixed with '-'. Point it at the real file if we can
                # find one, rather than silently making it optional.
                for guess in (
                    os.path.join(os.path.dirname(app_dir), ".env.production"),
                    "/opt/itadis/.env.production",
                    "/opt/itadis/it-adis/.env.production",
                ):
                    if os.path.isfile(guess):
                        new = f"EnvironmentFile={guess}"
                        changes.append(f"{stripped}  ->  {new}")
                        out_lines.append(new)
                        break
                else:
                    warn(f"EnvironmentFile {path} not found and no replacement located")
                    out_lines.append(raw)
            else:
                out_lines.append(raw)

        else:
            out_lines.append(raw)

    updated = "\n".join(out_lines) + "\n"

    if updated == original:
        ok(f"{os.path.basename(unit_path)} already correct")
        return True

    for change in changes:
        say(f"       {DIM}{change}{RESET}")

    if dry_run:
        warn(f"dry run — {unit_path} not written")
        return True

    backup = f"{unit_path}.bak-{datetime.now():%Y%m%d-%H%M%S}"
    shutil.copy2(unit_path, backup)
    with open(unit_path, "w", encoding="utf-8") as handle:
        handle.write(updated)
    ok(f"{os.path.basename(unit_path)} updated (backup: {os.path.basename(backup)})")
    return True


# ── 4. Restart and validate ──────────────────────────────────────────────────

def service_state(name: str) -> tuple[str, str]:
    active = run(["systemctl", "is-active", name], check=False).stdout.strip()
    enabled = run(["systemctl", "is-enabled", name], check=False).stdout.strip()
    return active or "unknown", enabled or "unknown"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="show changes, write nothing")
    args = parser.parse_args()

    print(f"{BOLD}itadis systemd repair{RESET}")

    # getattr: geteuid does not exist on non-POSIX platforms, and this file is
    # edited on Windows. Treat "cannot tell" as root so --dry-run stays testable.
    if getattr(os, "geteuid", lambda: 0)() != 0:
        fail("must run as root:  sudo python3 fix-services.py")
        return 1

    # ── Locate code ──────────────────────────────────────────────────────────
    step("1/5", "Locating application directories")
    dirs: dict[str, str] = {}
    for name, meta in SERVICES.items():
        component = meta["component"]
        path = find_component(component, meta["marker"])
        if path:
            ok(f"{component:<9} {path}  (built)")
        else:
            path = find_component_loose(component)
            if path:
                warn(f"{component:<9} {path}  (found, but NOT built — run deploy-native.sh)")
            else:
                fail(f"{component:<9} not found under {', '.join(SEARCH_ROOTS)}")
                return 1
        dirs[name] = path

    # ── Locate node ──────────────────────────────────────────────────────────
    step("2/5", "Locating a node binary")
    node_path, version, under_home = pick_node()
    if not node_path:
        fail("no usable node found (need v20+)")
        say("       Install it system-wide:")
        say("         curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -")
        say("         sudo apt-get install -y nodejs")
        return 1
    ok(f"{node_path}  ({version})")
    if under_home:
        warn("this node lives under a home directory, and the units set")
        warn("ProtectHome=true — systemd will not be able to exec it.")
        warn("Install node system-wide (NodeSource) and re-run this script.")

    # ── Patch units ──────────────────────────────────────────────────────────
    step("3/5", "Rewriting unit files")
    for name, meta in SERVICES.items():
        say(f"  {BOLD}{name}{RESET}")
        if not patch_unit(meta["unit"], dirs[name], node_path, args.dry_run):
            return 1

    if args.dry_run:
        say(f"\n{YELLOW}Dry run complete — nothing was changed.{RESET}")
        return 0

    # ── Reload and restart ───────────────────────────────────────────────────
    step("4/5", "Reloading systemd and restarting services")
    run(["systemctl", "daemon-reload"])
    ok("daemon-reload")
    for name in SERVICES:
        run(["systemctl", "enable", name], check=False)
        # reset-failed clears a latched start-limit, which otherwise makes the
        # restart look like the old failure persisting.
        run(["systemctl", "reset-failed", name], check=False)
        run(["systemctl", "restart", name], check=False)
        ok(f"restarted {name}")

    # ── Validate ─────────────────────────────────────────────────────────────
    step("5/5", "Validating")
    time.sleep(6)

    all_good = True
    for name, meta in SERVICES.items():
        active, enabled = service_state(name)
        if active == "active":
            ok(f"{name:<18} active   enabled={enabled}   dir={dirs[name]}")
        else:
            all_good = False
            fail(f"{name:<18} {active}   enabled={enabled}")
            log = run(
                ["journalctl", "-u", name, "-n", "20", "--no-pager", "--output=cat"],
                check=False,
            ).stdout.strip()
            for line in log.splitlines()[-20:]:
                print(f"       {DIM}{line}{RESET}")

    print()
    print(f"{BOLD}Summary{RESET}")
    print(f"  node            {node_path}  ({version})")
    for name in SERVICES:
        print(f"  {name:<18}{dirs[name]}")

    if all_good:
        print(f"\n{GREEN}Both services are running.{RESET}")
        print("  Check they answer:")
        print("    curl -sS -o /dev/null -w 'backend  %{http_code}\\n' http://127.0.0.1:3001/health")
        print("    curl -sS -o /dev/null -w 'frontend %{http_code}\\n' http://127.0.0.1:3000/en")
        return 0

    print(f"\n{RED}At least one service is still failing — see the log above.{RESET}")
    print("  Most common remaining causes:")
    print("    * the app is not built     -> cd <dir>/.. && ./deploy/deploy-native.sh")
    print("    * .env.production missing  -> EnvironmentFile path in the unit")
    print("    * wrong owner              -> sudo chown -R ubuntu:ubuntu /opt/itadis")
    return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\ninterrupted")
        sys.exit(130)
