#!/usr/bin/env bash
# Deploy or update the stack. Run from the repo root on the EC2 host:
#
#   cd /opt/itadis && ./deploy/deploy.sh
#
# Safe to re-run. Pass --no-pull to rebuild the working tree as-is instead of
# fetching origin first (useful when testing a local change on the server).
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE_FILE=docker-compose.prod.yml
ENV_FILE=.env.production
PULL=1
[[ "${1:-}" == "--no-pull" ]] && PULL=0

# ── Preflight ─────────────────────────────────────────────────────────────────

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed. Did the user-data bootstrap run?"
  echo "       Check with: sudo cloud-init status --long"
  exit 1
fi

# user-data adds `ubuntu` to the docker group, but group membership only applies
# to sessions started afterwards. Connecting too quickly after launch leaves you
# in a shell that cannot reach the daemon, and the error Docker prints
# ("permission denied ... /var/run/docker.sock") does not hint at the fix.
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: cannot talk to the Docker daemon."
  echo "       Usually this means your shell predates the docker group change."
  echo "       Log out and back in (or run: newgrp docker), then retry."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: the 'docker compose' plugin is missing."
  echo "       Install it with: sudo apt-get install -y docker-compose-plugin"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found."
  echo "       cp .env.production.example $ENV_FILE && nano $ENV_FILE"
  exit 1
fi

compose() { docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"; }

# ── Deploy ────────────────────────────────────────────────────────────────────

if [[ $PULL -eq 1 ]]; then
  echo "==> Fetching latest code"
  git pull --ff-only
fi

echo "==> Building images"
compose build

# Migrations run BEFORE the new containers start serving, in a throwaway
# container. `migrate deploy` only applies committed migrations and never
# generates or resets anything, so it is safe on every deploy — and because it
# runs first, a failed migration leaves the previous version untouched and still
# serving rather than half-upgrading the site.
echo "==> Applying database migrations"
compose run --rm --no-deps backend npx prisma migrate deploy

echo "==> Starting services"
compose up -d --remove-orphans

# ── Wait for health ───────────────────────────────────────────────────────────
# Poll the container health status rather than sleeping a fixed amount. Reports
# the actual outcome instead of exiting 0 the moment `up -d` returns, which says
# only that the containers were created, not that they work.
echo "==> Waiting for health checks"

# `docker inspect` rather than `docker compose ps --format '{{...}}'`: Go
# template support in `compose ps` varies between Compose v2 releases, while
# inspect's format flag has been stable for years. Containers without a
# healthcheck (caddy) report "none" and are treated as fine.
container_health() {
  local id
  for id in $(compose ps -q 2>/dev/null); do
    docker inspect --format \
      '{{.Name}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
      "$id" 2>/dev/null || true
  done
}

deadline=$((SECONDS + 180))
while :; do
  statuses=$(container_health)

  if grep -q ' starting$' <<<"$statuses" && (( SECONDS < deadline )); then
    sleep 5
    continue
  fi

  if grep -q ' unhealthy$' <<<"$statuses"; then
    echo
    echo "ERROR: a service failed its health check:"
    grep ' unhealthy$' <<<"$statuses" | sed 's/^/       /'
    echo
    echo "Recent logs:"
    compose logs --tail=40
    exit 1
  fi

  if (( SECONDS >= deadline )); then
    echo "WARNING: gave up waiting after 180s; services may still be starting."
    break
  fi
  break
done

compose ps

# Old image layers accumulate fast on a small root volume.
docker image prune -f >/dev/null

echo
echo "==> Deployed. Tail logs with:"
echo "    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
