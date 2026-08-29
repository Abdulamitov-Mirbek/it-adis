#!/usr/bin/env bash
# Deploy or update the site WITHOUT Docker. Run on the EC2 host:
#
#   cd /opt/itadis && ./deploy/deploy-native.sh
#
# Safe to re-run. Options:
#   --no-pull      rebuild the working tree as-is instead of fetching origin
#   --skip-migrate skip `prisma migrate deploy`
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"
ENV_FILE="$ROOT/.env.production"

PULL=1
MIGRATE=1
for arg in "$@"; do
  case "$arg" in
    --no-pull)      PULL=0 ;;
    --skip-migrate) MIGRATE=0 ;;
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
: "${DATABASE_URL:?DATABASE_URL must be set in .env.production}"

# ── Code ──────────────────────────────────────────────────────────────────────

if [[ $PULL -eq 1 ]]; then
  echo "==> Fetching latest code"
  git pull --ff-only
fi

# ── Backend ───────────────────────────────────────────────────────────────────

echo "==> Building backend"
cd "$ROOT/backend"
npm ci
npx prisma generate
npm run build

if [[ $MIGRATE -eq 1 ]]; then
  # Runs before either service restarts, so a failed migration leaves the
  # currently-running version untouched rather than half-upgrading the site.
  echo "==> Applying database migrations"
  npx prisma migrate deploy
fi

# ── Frontend ──────────────────────────────────────────────────────────────────

echo "==> Building frontend"
cd "$ROOT/frontend"
npm ci
# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so this
# has to be exported for `next build` — setting it only in the systemd unit
# would be too late and the canonical/OpenGraph URLs would stay localhost.
export NEXT_PUBLIC_SITE_URL="https://${SITE_DOMAIN}"
npm run build

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
# envsubst rather than Caddy's own {$VAR}: Caddy only reads those from its
# process environment, and the systemd caddy unit does not load .env.production.
export SITE_DOMAIN TLS_EMAIL
envsubst '${SITE_DOMAIN} ${TLS_EMAIL}' < deploy/Caddyfile | sudo tee /etc/caddy/Caddyfile >/dev/null
sudo caddy validate --config /etc/caddy/Caddyfile

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
echo "==> Deployed. https://${SITE_DOMAIN}"
echo "    logs:   sudo journalctl -u itadis-backend -u itadis-frontend -f"
echo "    status: systemctl status itadis-backend itadis-frontend caddy"
