#!/usr/bin/env bash
# Runs ON the EC2 host, invoked by SSM Run Command from .github/workflows/deploy.yml.
# Not meant to be run by hand — use ./deploy/deploy-native.sh for that.
#
# SSM executes as root, but /opt/itadis and both systemd services are owned by
# `ubuntu`. Building as root leaves root-owned files in the tree and the
# services then fail at runtime with permission errors that point nowhere
# useful, so every step that touches the tree goes through runuser.
#
# Full build output is kept on the box and only the tail is printed, because
# `ssm get-command-invocation` truncates its output at 24,000 characters and an
# npm install plus a Next build goes well past that. The whole log stays at
# $LOG for when the tail is not enough.
set -euo pipefail

ROOT=/opt/itadis
LOG=/var/log/itadis-deploy.log

echo "=== deploy $(date -Is) ==="
echo "commit: $(runuser -l ubuntu -c "cd $ROOT && git rev-parse --short HEAD") on $(runuser -l ubuntu -c "cd $ROOT && git rev-parse --abbrev-ref HEAD")"

if runuser -l ubuntu -c "cd $ROOT && ./deploy/deploy-native.sh --no-pull" >>"$LOG" 2>&1; then
  echo "--- deploy OK ---"
  tail -n 30 "$LOG"
else
  rc=$?
  echo "--- deploy FAILED (exit $rc) ---"
  tail -n 150 "$LOG"
  exit "$rc"
fi
