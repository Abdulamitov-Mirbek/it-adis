# Deploying IT ADIS to AWS EC2 — Ubuntu x86_64, no Docker

Node runs both apps directly under systemd; Caddy terminates TLS in front.
Postgres stays on Supabase. Deploys are `git pull` + rebuild + restart.

```
internet ──▶ Caddy :80/:443 ──▶ Next.js :3000 ──▶ NestJS :3001 ──▶ Supabase
             (auto HTTPS)        (systemd)         (systemd, loopback only)
```

The browser only ever talks to Next.js. Its `/api/*` route handlers proxy to
NestJS over `127.0.0.1`, so **the API is not reachable from the internet** and
the security group never needs a port open for it.

> The Docker files (`docker-compose.prod.yml`, root `Caddyfile`, the two
> `Dockerfile`s, `deploy/user-data.sh`, `deploy/deploy.sh`) are still in the
> repo and still work. They are simply not used by this path — ignore them, or
> delete them once you are happy here.

---

## 0. First: fix the disk

The Docker build failed with `ENOSPC: no space left on device`. That was never a
Docker bug — the root volume filled up. Building natively needs less space, but
not zero, so clear this before anything else.

```bash
df -h /                 # how much is actually free
```

Reclaim what Docker took (safe — you are not using it any more):

```bash
sudo systemctl stop docker
sudo docker system prune -af --volumes    # if docker is still installed
sudo apt-get remove -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo rm -rf /var/lib/docker
sudo apt-get autoremove -y && sudo apt-get clean
```

Check again. **You want at least 5 GB free.** If you are still short, the volume
is too small — the default AMI gives 8 GB, which is not enough:

1. EC2 console → **Elastic Block Store → Volumes** → select the volume →
   **Actions → Modify volume** → set **20 GiB** → Modify.
2. Wait for state `in-use - optimizing`, then on the box:

```bash
lsblk                                        # confirm the device name
sudo growpart /dev/nvme0n1 1
sudo resize2fs /dev/nvme0n1p1
df -h /                                      # should now show ~20G
```

> Growing an EBS volume is online and non-destructive. You cannot shrink it
> again, and the larger size is what you are billed for (~$0.08/GB/month).

---

## 1. Where the code lives

Your current clone is at `/opt/itadis/it-adis` — one level deeper than the
scripts expect. Flatten it:

```bash
sudo rm -rf /opt/itadis
sudo mkdir -p /opt/itadis
sudo chown ubuntu:ubuntu /opt/itadis
cd /opt/itadis
git clone https://github.com/<your-account>/it-adis.git .    # note the dot
```

Also: **stop working as `root`.** Log in as `ubuntu`. The systemd units run the
apps as `ubuntu`, and a tree owned by root will fail at runtime with permission
errors that point nowhere useful.

---

## 2. Bootstrap the server

Installs Node 22, Caddy, swap and `envsubst`. Once per instance:

```bash
cd /opt/itadis
sudo bash deploy/setup-server.sh
```

It prints the versions it installed plus free disk and swap. Node must be
**v22.x** — Ubuntu's own `nodejs` package is v18 and Next 16 will not build on
it, which is why the script uses NodeSource.

---

## 3. Configure

```bash
cd /opt/itadis
cp .env.production.example .env.production
nano .env.production
chmod 600 .env.production
```

Fill in every value. Generate a **fresh** `JWT_SECRET` — not the dev one:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`SUPABASE_URL` and `SUPABASE_SECRET_KEY` come from Supabase → Project
Settings → API. Use the **secret** (service_role) key, not the publishable one:
the API reads `admin_users` and applicant contact details, which row-level
security is meant to keep out of anonymous hands. That key never belongs in the
frontend or in any `NEXT_PUBLIC_*` variable.

There is no `DATABASE_URL` or `DIRECT_URL` any more. Prisma has been removed and
the backend talks to Supabase over its REST API, so nothing here opens a
Postgres connection.

The file sits **outside** the git tree at `/opt/itadis/.env.production`, so
`git pull` can never overwrite it.

---

## 4. Point DNS at the box

A record for your domain → the instance's **Elastic IP**. Verify before
deploying, or Caddy's certificate request will fail:

```bash
dig +short itadis.kg      # must print your Elastic IP
```

Security group inbound rules — exactly three:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | **My IP** |
| HTTP | 80 | `0.0.0.0/0` |
| HTTPS | 443 | `0.0.0.0/0` |

Ports 3000 and 3001 stay closed.

---

## 5. Deploy

```bash
cd /opt/itadis
./deploy/deploy-native.sh
```

It checks free disk first, builds the backend, runs migrations, builds the
frontend, installs the systemd units and Caddy config, restarts everything, then
**polls the real endpoints** and prints logs if either fails to answer.

First build takes 5–10 minutes on a t3.small.

Seed the course catalogue once, on the first deploy only. Pick an admin
password of your own — the one that used to be hardcoded in the seed script is
in this repository's git history, and the script now refuses to run without one:

```bash
cd /opt/itadis/backend
npm ci --include=dev            # the seed runs through ts-node
SEED_ADMIN_PASSWORD='<a password you chose>' npm run seed
npm prune --omit=dev
```

---

## 6. Updating

```bash
ssh ubuntu@<ELASTIC_IP>
cd /opt/itadis && ./deploy/deploy-native.sh
```

Flags: `--no-pull` (build the working tree as-is), `--skip-migrate`.

---

## 7. Day-to-day

```bash
sudo journalctl -u itadis-backend -u itadis-frontend -f   # live logs
sudo journalctl -u itadis-backend -n 100 --no-pager       # recent API logs
systemctl status itadis-backend itadis-frontend caddy
sudo systemctl restart itadis-backend
sudo systemctl reload caddy
free -h && df -h /                                        # memory and disk
```

System patches (Ubuntu auto-applies security updates; kernels need a reboot):

```bash
sudo apt-get update && sudo apt-get upgrade -y
[ -f /var/run/reboot-required ] && sudo reboot   # services come back on boot
```

---

## 8. Things that will bite you

**`ENOSPC` during npm install.** Disk again — see step 0. `deploy-native.sh`
now refuses to start below 3 GB free rather than dying halfway.

**Build killed with no message.** Out of memory. `free -h` should show 2 GB of
swap; if not, re-run `setup-server.sh`.

**`npm ERR! could not determine executable to run`** during the backend build.
`@nestjs/cli` is missing. The cause is almost always `NODE_ENV=production` in
the environment: npm derives `--omit=dev` from it and strips every
devDependency, including the Nest CLI and TypeScript. `deploy-native.sh` passes
`--include=dev` for exactly this reason. To fix a half-installed tree by hand:

```bash
cd /opt/itadis/backend && npm ci --include=dev && npm run build
```

The same trap hits the frontend, where tailwindcss and typescript are
devDependencies — a `next build` that cannot find Tailwind is this, not a
config problem.

**`Cannot find module 'dist/main'`.** The backend build did not run or failed.
`cd /opt/itadis/backend && npm run build`, and check for TypeScript errors.

**Service won't start, logs mention permissions.** The tree is owned by root
from an earlier root clone: `sudo chown -R ubuntu:ubuntu /opt/itadis`.

**Certificate not issuing.** Caddy needs port 80 open and DNS resolving here.
`sudo journalctl -u caddy -n 50`. The rate limit is 5 certificates per domain
per week — fix DNS *before* retrying repeatedly.

**Schema changes.** There is no migration step in the deploy. Apply DDL in the
Supabase SQL editor, and keep `backend/supabase/*.sql` updated to match — it is
the record of what the API expects, not something the deploy runs.

**API 500s with "Database request failed".** The detail is in the backend log
(`sudo journalctl -u itadis-backend -n 50`) rather than the HTTP response, so
table and constraint names never reach a client. Usually a column renamed in
Supabase without the matching change in `backend/src/supabase/types.ts` —
PostgREST matches column names exactly, and these are camelCase.

**Site loads but the API 500s.** `sudo journalctl -u itadis-backend -n 50`.
Most often `JWT_SECRET` missing or too short — the API refuses to boot on
either, by design.

---

## 9. Before you call it done

- [ ] `JWT_SECRET` is freshly generated, not the dev value
- [ ] `.env.production` is `chmod 600` and outside the git tree
- [ ] Security group SSH rule is your IP, not `0.0.0.0/0`
- [ ] `https://your-domain/api/docs` returns **404** (Swagger is off in prod)
- [ ] A 6th rapid login attempt returns **429**
- [ ] `curl http://127.0.0.1:3001/health` works **on the box**, and
      `curl http://<ELASTIC_IP>:3001/health` **times out** from your laptop
- [ ] Delete the stale `ADMIN_SECRET=itadis_admin_2026` line from any `.env`
- [ ] `sudo systemctl is-enabled itadis-backend itadis-frontend caddy` → all
      `enabled`, so the site returns after a reboot
- [ ] Reboot once and confirm the site comes back by itself

---

## What I have not verified

These files are syntax-checked and the runtime commands were tested locally
(`next start` serves, `node dist/main` serves, `/health` answers), but **the
full sequence has never run on an actual Ubuntu host** — no EC2 instance was
available from here. Expect to iterate on the first run; the failure modes above
are the ones to check first.
