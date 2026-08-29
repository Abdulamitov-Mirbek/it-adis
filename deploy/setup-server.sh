#!/usr/bin/env bash
# One-time server bootstrap — Ubuntu 24.04 / 22.04 on x86_64, NO Docker.
#
# Installs Node.js, Caddy and swap, then creates /opt/itadis owned by the
# deploying user. Run it once, with sudo, on a fresh instance:
#
#   sudo bash setup-server.sh
#
# Idempotent: safe to re-run.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

DEPLOY_USER="${SUDO_USER:-ubuntu}"
APP_DIR=/opt/itadis

# ── Wait for the apt lock ─────────────────────────────────────────────────────
# On a fresh Ubuntu boot, cloud-init and unattended-upgrades hold dpkg's lock.
# Running apt-get immediately fails with "Could not get lock
# /var/lib/dpkg/lock-frontend" and aborts the whole script.
wait_for_apt() {
  for i in $(seq 1 60); do
    if ! fuser /var/lib/dpkg/lock-frontend /var/lib/apt/lists/lock \
          /var/lib/dpkg/lock >/dev/null 2>&1; then
      return 0
    fi
    echo "apt is locked by another process; waiting (${i}/60)"
    sleep 5
  done
  echo "apt still locked after 5 minutes; continuing anyway"
}

wait_for_apt
apt-get update -y
# gettext-base provides envsubst, which deploy-native.sh uses to render the
# Caddyfile; it is not present on a minimal Ubuntu image.
apt-get install -y ca-certificates curl gnupg git build-essential gettext-base

# ── Node.js 22 LTS ────────────────────────────────────────────────────────────
# From NodeSource, not Ubuntu's repo: `apt install nodejs` on 24.04 gives
# Node 18, and Next 16 refuses to build on it.
if ! node --version 2>/dev/null | grep -q '^v22\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  wait_for_apt
  apt-get install -y nodejs
fi

# ── Caddy ─────────────────────────────────────────────────────────────────────
# Terminates TLS and reverse-proxies to Next.js. Certificates are obtained and
# renewed automatically; there is no certbot step and no renewal cron.
if ! command -v caddy >/dev/null 2>&1; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  wait_for_apt
  apt-get update -y
  apt-get install -y caddy
fi

# ── Swap ──────────────────────────────────────────────────────────────────────
# A t3.small has 2 GB of RAM. `next build` peaks above that and gets OOM-killed
# with a bare "Killed" message that reads like a build bug rather than a memory
# limit. Swap turns that failure into a merely slow build.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── App directory ─────────────────────────────────────────────────────────────
mkdir -p "$APP_DIR"
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"

echo
echo "Bootstrap complete."
echo "  node    $(node --version)"
echo "  npm     $(npm --version)"
echo "  caddy   $(caddy version | head -1)"
echo "  swap    $(free -h | awk '/Swap:/ {print $2}')"
echo "  disk    $(df -h / | awk 'NR==2 {print $4 " free of " $2}')"
echo
echo "Next: clone the repo DIRECTLY into $APP_DIR (not a subfolder):"
echo "  cd $APP_DIR && git clone <repo-url> ."
