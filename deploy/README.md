# Deploying IT ADIS to AWS EC2 (Ubuntu, x86_64)

One EC2 instance runs the whole site in Docker. Postgres stays on Supabase.

```
internet ──▶ Caddy :80/:443 ──▶ Next.js :3000 ──▶ NestJS :3001 ──▶ Supabase
             (auto HTTPS)        (public)          (internal only)
```

The browser only ever talks to Next.js. Its `/api/*` route handlers proxy to
NestJS server-side over a private Docker network, so **the API is not reachable
from the internet** and the security group never needs a port open for it.

Target host: **Ubuntu Server 24.04 LTS, 64-bit (x86)**. All images are built
natively on the instance, so they come out `linux/amd64` — no cross-build, no
`--platform` flags, no QEMU emulation.

Running cost: roughly **$17–22/month** (t3.small + 20 GB EBS + Elastic IP), plus
whatever Supabase tier you are on.

---

## 1. Launch the instance

EC2 → Launch instance:

| Setting | Value |
|---|---|
| Name | `itadis-prod` |
| AMI | **Ubuntu Server 24.04 LTS**, architecture **64-bit (x86)** |
| Instance type | **t3.small** (2 vCPU, 2 GB) |
| Key pair | Create one, download the `.pem`, keep it safe |
| Storage | **20 GB** gp3 (the 8 GB default fills up with Docker images) |

> 22.04 LTS works too — the bootstrap reads the release codename from
> `/etc/os-release` rather than hardcoding it. Do **not** pick a `t4g.*`
> instance type: those are ARM and will not boot an x86 AMI.

Under **Network settings → Edit**, create a security group with exactly three
inbound rules:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | **My IP** — not `0.0.0.0/0` |
| HTTP | 80 | `0.0.0.0/0` |
| HTTPS | 443 | `0.0.0.0/0` |

> Ports 3000 and 3001 stay closed. If you ever find yourself opening them,
> something is misconfigured — Caddy is the only thing that should be reachable.

Under **Advanced details → User data**, paste the entire contents of
[`user-data.sh`](./user-data.sh). On first boot it installs Docker from Docker's
official apt repository, adds 2 GB of swap and sets up a weekly image cleanup.

### Give it a fixed IP

EC2 → **Elastic IPs** → Allocate → Associate with the instance. Without this the
public IP changes on every stop/start and your DNS silently breaks.

---

## 2. Point DNS at it

At your registrar, create an **A record** for your domain → the Elastic IP.
Add a second A record for `www` if you want it.

Check it has propagated before continuing — Caddy's certificate request will
fail if the domain does not yet resolve to this host:

```bash
dig +short itadis.kg      # must print your Elastic IP
```

---

## 3. First deploy

The bootstrap takes 2–4 minutes. SSH in as **`ubuntu`** (not `ec2-user` — that
is the Amazon Linux default and does not exist here):

```bash
chmod 400 itadis-prod.pem          # macOS/Linux only; SSH refuses loose perms
ssh -i itadis-prod.pem ubuntu@<ELASTIC_IP>
```

Confirm the bootstrap finished before doing anything else:

```bash
cloud-init status --wait           # blocks until it prints "status: done"
docker --version && docker compose version
```

> If `docker` says **permission denied**, your shell started before the docker
> group was applied. Log out and back in, or run `newgrp docker`.

Clone the repo and configure it:

```bash
cd /opt/itadis
git clone https://github.com/<your-account>/it-adis.git .

cp .env.production.example .env.production
nano .env.production
```

Fill in every value. For `JWT_SECRET`, **generate a fresh one** — do not reuse
the development value:

```bash
docker run --rm node:22-alpine node -e \
  "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`DATABASE_URL` and `DIRECT_URL` come from Supabase → Project Settings →
Database → Connection string. You need both: the pooled one (port 6543) for the
app, the direct one (port 5432) for migrations.

Lock the file down and deploy:

```bash
chmod 600 .env.production
./deploy/deploy.sh
```

First build takes 5–10 minutes on a t3.small. When it finishes,
`https://your-domain` should be live with a valid certificate.

---

## 4. Deploying updates

```bash
ssh -i itadis-prod.pem ubuntu@<ELASTIC_IP>
cd /opt/itadis && ./deploy/deploy.sh
```

It pulls, rebuilds, runs `prisma migrate deploy`, restarts, then waits for the
health checks and fails loudly with logs if anything comes up unhealthy.
Migrations run **before** the new containers take over, so a failed migration
leaves the previous version serving untouched.

---

## 5. Day-to-day

```bash
cd /opt/itadis
alias dc='docker compose -f docker-compose.prod.yml --env-file .env.production'

dc ps                    # what is running and healthy
dc logs -f               # all logs
dc logs -f backend       # just the API
dc restart backend       # restart one service
dc down                  # stop everything
```

**Seeding the course catalogue** (first deploy only — this overwrites courses):

```bash
dc run --rm --no-deps backend npx prisma db seed
```

**System maintenance** (Ubuntu applies security patches automatically via
`unattended-upgrades`; kernel updates still need a reboot):

```bash
sudo apt-get update && sudo apt-get upgrade -y
[ -f /var/run/reboot-required ] && sudo reboot   # containers restart on boot
```

---

## 6. Things that will bite you

**`docker: permission denied`.** Your SSH session predates the docker group
change from user-data. Log out and back in, or `newgrp docker`.

**Bootstrap looks like it did nothing.** Almost always the apt lock — Ubuntu
runs `unattended-upgrades` on first boot and holds dpkg. `user-data.sh` waits up
to 5 minutes for it. Check what happened with:

```bash
sudo cloud-init status --long
sudo cat /var/log/cloud-init-output.log
```

**Certificate not issuing.** Caddy needs port 80 reachable from the internet for
the ACME challenge, and DNS pointing here. Check `dc logs caddy`. The rate limit
is 5 certificates per domain per week, so fix DNS *before* retrying in a loop.

**Build killed with no error.** Out of memory. The swap file should prevent it;
confirm with `free -h` that swap is active and `swapon --show` lists `/swapfile`.

**`prisma migrate deploy` fails on a pooled connection.** `DIRECT_URL` must be
the port-5432 connection string, not the 6543 pooler.

**Site loads unstyled.** The frontend image did not get `.next/static`. Rebuild
with `dc build --no-cache frontend`.

**Disk full.** `docker system prune -af`, then check `df -h`. The weekly cron
handles this normally.

---

## 7. Before you call it done

- [ ] `JWT_SECRET` in `.env.production` is freshly generated, not the dev value
- [ ] `.env.production` is `chmod 600` and **not** committed to git
- [ ] Security group SSH rule is your IP, not `0.0.0.0/0`
- [ ] `https://your-domain/api/docs` returns **404** (Swagger is off in prod)
- [ ] Admin login works, and a 6th rapid login attempt returns **429**
- [ ] Delete the stale `ADMIN_SECRET=itadis_admin_2026` line from any `.env`
- [ ] Supabase → Settings → Database → restrict network access to the Elastic IP
- [ ] `docker image inspect itadis-backend --format '{{.Architecture}}'` says
      `amd64`

---

## What I have not verified

The Compose file, the shell syntax and the build outputs all check out, but
**the Docker images have never actually been built** — the Docker daemon was not
running on the development machine. Expect to iterate on the first
`./deploy/deploy.sh`; the Dockerfiles are conventional, but an untested build is
an untested build.
