#!/usr/bin/env bash
#
# Creates an admin login for a new manager.
#
#   ./create-admin.sh manager@itadis.edu "Aigerim Eralieva"
#   ./create-admin.sh manager@itadis.edu "Aigerim Eralieva" --generate
#   ./create-admin.sh manager@itadis.edu "Aigerim Eralieva" --docker
#
# The real work is in backend/src/scripts/create-admin.ts. This wrapper only
# picks a runner, because the same script has to work in three places: a dev
# machine with ts-node, the built dist/, and the production container.
#
# On Windows use create-admin.ps1 instead, or run this under Git Bash.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Pull --docker out of the arguments; everything else goes through to the
# script untouched.
DOCKER=0
ARGS=()
for arg in "$@"; do
  if [ "$arg" = "--docker" ]; then
    DOCKER=1
  else
    ARGS+=("$arg")
  fi
done

if [ "$DOCKER" = "1" ]; then
  # Runs against the deployed stack. --no-deps so this does not boot the whole
  # compose project just to add a row; the container needs nothing but its own
  # environment to reach Supabase.
  cd "$ROOT"
  exec docker compose -f docker-compose.prod.yml --env-file .env.production \
    run --rm --no-deps backend \
    node dist/scripts/create-admin.js "${ARGS[@]+"${ARGS[@]}"}"
fi

# backend/.env is read relative to the working directory, so this must run from
# backend/ regardless of where the wrapper was invoked from.
cd "$ROOT/backend"

if [ -f dist/scripts/create-admin.js ]; then
  exec node dist/scripts/create-admin.js "${ARGS[@]+"${ARGS[@]}"}"
fi

echo "dist/ not built — falling back to ts-node." >&2
exec npx ts-node src/scripts/create-admin.ts "${ARGS[@]+"${ARGS[@]}"}"
