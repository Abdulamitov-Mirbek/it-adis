#!/bin/bash
# EC2 user-data: paste into "Advanced details → User data" when launching the
# instance. cloud-init runs it once, as root, on first boot.
#
# Target AMI: Ubuntu Server 24.04 LTS, architecture 64-bit (x86).
# Everything here is idempotent, so it is also safe to re-run by hand later.
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

# ── Wait for the apt lock ─────────────────────────────────────────────────────
# On a fresh Ubuntu boot, cloud-init and unattended-upgrades are both already
# holding dpkg's lock. Running apt-get straight away fails with
# "Could not get lock /var/lib/dpkg/lock-frontend" and kills the whole script —
# the single most common reason this bootstrap appears to do nothing.
wait_for_apt() {
  local i
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
apt-get install -y ca-certificates curl gnupg git

# ── Docker, from Docker's own apt repository ──────────────────────────────────
# Not Ubuntu's `docker.io` package: that ships an older engine and, critically,
# has no `docker compose` plugin, so `docker compose` would not exist and
# deploy.sh would fail on its first command.
install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

# dpkg --print-architecture resolves to amd64 on this x86_64 instance; using it
# rather than a hardcoded value keeps the file correct if the AMI ever changes.
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

wait_for_apt
apt-get update -y
apt-get install -y \
  docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker

# Let the default Ubuntu login run docker without sudo. Takes effect on the next
# SSH session, which is why the README has you connect after this has finished.
usermod -aG docker ubuntu

# ── Swap ──────────────────────────────────────────────────────────────────────
# A t3.small has 2 GB of RAM. `next build` routinely peaks above that and gets
# OOM-killed with a bare "Killed" message that reads like a build bug. Swap
# turns that failure into a merely slow build.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── Housekeeping ──────────────────────────────────────────────────────────────
# Docker images and build cache fill a disk quietly; reclaim dangling layers
# weekly rather than at 3am on a full volume. Ubuntu Server ships cron, and
# run-parts requires the filename to have no dots or extension.
cat >/etc/cron.weekly/docker-prune <<'CRON'
#!/bin/sh
docker system prune -af --filter "until=168h"
CRON
chmod +x /etc/cron.weekly/docker-prune

mkdir -p /opt/itadis
chown ubuntu:ubuntu /opt/itadis

echo "bootstrap complete — clone the repo into /opt/itadis and run deploy/deploy.sh"
