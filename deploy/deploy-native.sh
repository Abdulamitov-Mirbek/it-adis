#!/usr/bin/env bash
# Deploy or update the site WITHOUT Docker. Run on the EC2 host:
#
#   cd /opt/itadis && ./deploy/deploy-native.sh
#
# Safe to re-run. Options:
#   --no-pull      rebuild the working tree as-is instead of fetching origin
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"
ENV_FILE="$ROOT/.env.production"

PULL=1
for arg in "$@"; do
  case "$arg" in
    --no-pull) PULL=0 ;;
    # Accepted and ignored: there is no migration step any more (Prisma is
    # gone), and rejecting it would break anyone's existing deploy command.
    --skip-migrate) ;;
    *) echo "unknown option: $arg"; exit 1 ;;
  esac
done

# ── Preflight ─────────────────────────────────────────────────────────────────

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found."
  echo "       cp .env.production.example .env.production && nano .env.production"
  exit 1
fi

node_major=$(node --version 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/')
if [[ -z "$node_major" || "$node_major" -lt 20 ]]; then
  echo "ERROR: Node 20+ required, found ${node_major:-none}. Run deploy/setup-server.sh."
  exit 1
fi

# The build needs roughly 3 GB of headroom: two node_modules trees plus the
# Next build output. Running out mid-build produces
# "npm error ENOSPC: no space left on device", which reads like an npm bug —
# checking up front turns that into a clear message before anything is touched.
avail_mb=$(df -Pm "$ROOT" | awk 'NR==2 {print $4}')
if (( avail_mb < 3000 )); then
  echo "ERROR: only ${avail_mb} MB free on this filesystem; the build needs ~3000 MB."
  echo
  echo "  Reclaim space:      sudo apt-get clean && npm cache clean --force"
  echo "  If Docker was used: sudo docker system prune -af --volumes"
  echo "  Check the big ones: sudo du -xh / --max-depth=2 2>/dev/null | sort -rh | head"
  echo
  echo "  Still tight? Grow the EBS volume in the EC2 console, then:"
  echo "    sudo growpart /dev/nvme0n1 1 && sudo resize2fs /dev/nvme0n1p1"
  exit 1
fi

# Read the env file WITHOUT letting the shell evaluate it.
#
# `set -a; source .env.production` looks equivalent and is what most deploy
# scripts do, but bash expands `$` inside double-quoted values: a Supabase
# password containing `$$` becomes the shell's PID, and the deploy then fails
# with a database authentication error that points nowhere near the real cause.
# systemd's EnvironmentFile does no expansion at all, so sourcing would also
# make the build and the running service disagree about the same password.
#
# This parses the same subset systemd accepts — KEY=value, # comments, optional
# surrounding single or double quotes — and expands nothing.
load_env() {
  local line key val
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
    [[ "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"   # trim leading space
    key="${key%"${key##*[![:space:]]}"}"   # trim trailing space
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    # Strip one layer of matching quotes, exactly as systemd does.
    if [[ ${#val} -ge 2 && "${val:0:1}" == '"' && "${val: -1}" == '"' ]]; then
      val="${val:1:${#val}-2}"
    elif [[ ${#val} -ge 2 && "${val:0:1}" == "'" && "${val: -1}" == "'" ]]; then
      val="${val:1:${#val}-2}"
    fi
    export "$key=$val"
  done < "$1"
}

load_env "$ENV_FILE"

: "${SITE_DOMAIN:?SITE_DOMAIN must be set in .env.production}"
: "${JWT_SECRET:?JWT_SECRET must be set in .env.production}"
: "${SUPABASE_URL:?SUPABASE_URL must be set in .env.production}"
: "${SUPABASE_SECRET_KEY:?SUPABASE_SECRET_KEY must be set in .env.production}"

# Let's Encrypt issues certificates for domain names only — never for a bare IP
# address. Pointing Caddy at an IP and asking for HTTPS fails the ACME challenge
# and leaves it serving nothing, so an IP (or an unset domain) is served over
# plain HTTP on :80 instead, and HTTPS switches itself on the moment
# SITE_DOMAIN becomes a real hostname.
if [[ -z "${SITE_DOMAIN:-}" || "$SITE_DOMAIN" =~ ^[0-9]+(\.[0-9]+){3}$ ]]; then
  SITE_ADDRESS=":80"
  SITE_URL="http://${SITE_DOMAIN:-localhost}"
  TLS_MODE="plain HTTP (no certificate — Let's Encrypt cannot issue for an IP)"
else
  SITE_ADDRESS="$SITE_DOMAIN"
  SITE_URL="https://${SITE_DOMAIN}"
  TLS_MODE="HTTPS with an automatic Let's Encrypt certificate"
fi
export SITE_ADDRESS


# ── Code ──────────────────────────────────────────────────────────────────────

if [[ $PULL -eq 1 ]]; then
  echo "==> Fetching latest code"
  git pull --ff-only
fi

# ── Backend ───────────────────────────────────────────────────────────────────

echo "==> Building backend"
cd "$ROOT/backend"

# --include=dev is NOT redundant.
#
# .env.production sets NODE_ENV=production, and load_env exports it above. npm
# derives --omit=dev from NODE_ENV, so a plain `npm ci` here removes every
# devDependency — including @nestjs/cli and typescript, the two things the build
# needs. The failure is deeply unhelpful: `nest build` dies with
# "npm ERR! could not determine executable to run", which says nothing about
# missing dev packages. Same trap on the frontend, where tailwindcss and
# typescript are devDependencies.
npm ci --include=dev

if [[ ! -x node_modules/.bin/nest ]]; then
  echo "ERROR: @nestjs/cli is missing after install."
  echo "       Something stripped devDependencies — check for NODE_ENV=production"
  echo "       or an --omit=dev in ~/.npmrc, then retry."
  exit 1
fi

npm run build

# No `prisma generate` and no `prisma migrate deploy`. The backend reaches
# Supabase over PostgREST now, so there is no client to generate, and schema
# changes are made in the Supabase SQL editor — backend/supabase/*.sql records
# what the API expects. `migrate deploy` had become a guaranteed failure here
# anyway: it exits P3005 against a database that already has tables.

# Reclaim the build-only packages now the compiled output exists. `node
# dist/main` needs prod dependencies only — this is exactly what the Docker
# runner stage does — and on an 8 GB volume those ~255 packages are worth
# having back.
echo "==> Pruning backend build dependencies"
npm prune --omit=dev

# ── Frontend ──────────────────────────────────────────────────────────────────

echo "==> Building frontend"
cd "$ROOT/frontend"

# --include=dev for the same reason as the backend: tailwindcss and typescript
# are devDependencies, and `next build` fails without them.
npm ci --include=dev

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so this
# has to be exported for `next build` — setting it only in the systemd unit
# would be too late and the canonical/OpenGraph URLs would stay localhost.
export NEXT_PUBLIC_SITE_URL="$SITE_URL"
npm run build

# Deliberately NOT pruned, unlike the backend: `next start` resolves parts of
# the build output lazily at request time, and stripping packages after the fact
# has been a recurring source of runtime module-not-found errors. The disk is
# better spent here than on a subtle 500 in production.

# ── Services ──────────────────────────────────────────────────────────────────

cd "$ROOT"

echo "==> Installing systemd units"
sudo cp deploy/systemd/itadis-backend.service /etc/systemd/system/
sudo cp deploy/systemd/itadis-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable itadis-backend itadis-frontend >/dev/null

echo "==> Installing Caddy config"
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy

# envsubst, not Caddy's own {$VAR}: the systemd caddy unit does not load
# .env.production, so Caddy would expand those to empty. Only ${SITE_ADDRESS} is
# substituted — naming TLS_EMAIL here too is what previously mangled the global
# block into a literal `{}`.
{
  # The ACME contact address is prepended rather than kept in the template, so
  # that the global block is absent entirely when there is nothing to put in it.
  # `email` with an empty value is a parse error, not a no-op.
  if [[ "$SITE_ADDRESS" != ":80" && -n "${TLS_EMAIL:-}" ]]; then
    printf '{\n\temail %s\n}\n\n' "$TLS_EMAIL"
  fi
  envsubst '${SITE_ADDRESS}' < deploy/Caddyfile
} | sudo tee /etc/caddy/Caddyfile >/dev/null

if ! sudo caddy validate --config /etc/caddy/Caddyfile; then
  echo
  echo "ERROR: the generated Caddyfile is invalid. It is at /etc/caddy/Caddyfile:"
  sudo sed -n '1,25p' /etc/caddy/Caddyfile
  exit 1
fi
echo "    serving ${SITE_ADDRESS} — ${TLS_MODE}"

echo "==> Restarting services"
sudo systemctl restart itadis-backend
sudo systemctl restart itadis-frontend
sudo systemctl reload caddy || sudo systemctl restart caddy

# ── Verify ────────────────────────────────────────────────────────────────────
# `systemctl restart` returns as soon as the process is spawned, which says
# nothing about whether it can actually serve. Poll the real endpoints.

echo "==> Waiting for services to answer"
ok=0
for i in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:3001/health >/dev/null 2>&1 \
  && curl -fsS --max-time 5 http://127.0.0.1:3000/en   >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 3
done

if [[ $ok -ne 1 ]]; then
  echo
  echo "ERROR: services did not come up. Recent logs:"
  echo "--- backend ---";  sudo journalctl -u itadis-backend  -n 30 --no-pager
  echo "--- frontend ---"; sudo journalctl -u itadis-frontend -n 30 --no-pager
  exit 1
fi

echo
echo "==> Deployed. ${SITE_URL}  (${TLS_MODE})"
echo "    logs:   sudo journalctl -u itadis-backend -u itadis-frontend -f"
echo "    status: systemctl status itadis-backend itadis-frontend caddy"
