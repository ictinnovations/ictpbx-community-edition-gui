# ICTPBX Installer — Main Components

How `ictcore-install.sh` / `ictcore-ce-install.sh` (backend) and `ictpbx-install.sh` / `ictpbx-ce-install.sh` (frontend) turn a fresh Rocky/EL9 box into a working ICTPBX node. The diagram below should match the live scripts in this repo; update it whenever an installer step is added, removed, or reordered.

---

## Diagram

```
                  ┌──────────────────────────────────────────────────┐
                  │                   INPUTS                         │
                  │  • GitHub PAT (private repo clone)               │
                  │  • SignalWire PAT (FreeSWITCH 1.10.x RPMs)       │
                  │  • MariaDB root pass + ictfax pass               │
                  │  • PostgreSQL fusionpbx pass                     │
                  │  • ICTCore admin password                        │
                  │  • PUBLIC_HOST (IP or FQDN)                      │
                  │  • DOMAIN (EE only — triggers certbot)           │
                  └─────────────────────┬────────────────────────────┘
                                        │
                ┌───────────────────────┴─────────────────────────┐
                ▼                                                 ▼
   ╔═════════════════════════════╗               ╔══════════════════════════════╗
   ║  BACKEND INSTALLER          ║               ║  FRONTEND INSTALLER          ║
   ║  ictcore-install.sh   (EE)  ║               ║  ictpbx-install.sh    (EE)   ║
   ║  ictcore-ce-install.sh(CE)  ║               ║  ictpbx-ce-install.sh (CE)   ║
   ╠═════════════════════════════╣               ╠══════════════════════════════╣
   ║ 1. Prereqs                  ║               ║ 1. Sanity                    ║
   ║   • EPEL + CRB              ║               ║   • check /usr/ictpbxx       ║
   ║   • base utils, git, curl   ║               ║   • require git checkout     ║
   ║                             ║               ║                              ║
   ║ 2. Apache + PHP 8.3 (Remi)  ║               ║ 2. Node 18 + npm             ║
   ║   • mod_rewrite (httpd-tools║               ║   • Angular CLI 13 global    ║
   ║     fallback on EL9 min)    ║               ║                              ║
   ║   • PHP-FPM pool: ictcore   ║               ║ 3. Build                     ║
   ║     – User/Group=ictcore    ║               ║   • npm install              ║
   ║     – listen.acl_users      ║               ║     --legacy-peer-deps       ║
   ║     – open_basedir incl     ║               ║   • TS downgrade if ≥4.7     ║
   ║       /etc/ictcore.conf     ║               ║   • NODE_OPTIONS=            ║
   ║                             ║               ║     --max_old_space_size=    ║
   ║ 3. MariaDB 10.11            ║               ║     3072                     ║
   ║   • ictfax DB + user        ║               ║   • ng build                 ║
   ║   • mysql_secure equiv      ║               ║     EE: --configuration=     ║
   ║                             ║               ║         production           ║
   ║ 4. PostgreSQL 16 (PGDG)     ║               ║     CE: --configuration=     ║
   ║   • fusionpbx DB + user     ║               ║         community            ║
   ║   • pg_hba md5 on TCP       ║               ║                              ║
   ║                             ║               ║ 4. Apache vhost              ║
   ║ 5. FreeSWITCH 1.10.x        ║               ║   • DocRoot dist/            ║
   ║   • SignalWire repo + PAT   ║               ║   • SPA .htaccess            ║
   ║   • g729 split (|| warn)    ║               ║     RewriteCond !^/api       ║
   ║                             ║               ║     RewriteCond !^/fpbx      ║
   ║ 6. FusionPBX                ║               ║   • EE: certbot --nginx      ║
   ║   EE: 6.6.0 (git tag)       ║               ║         when DOMAIN set      ║
   ║   CE: 5.5.7 (git tag)       ║               ║     CE: TLS manual           ║
   ║   • PG schema load          ║               ║                              ║
   ║   • local patch (warn vs    ║               ╚══════════════════════════════╝
   ║     fail)                   ║
   ║                             ║
   ║ 7. ICTCore                  ║
   ║   • git clone (PAT URL)     ║
   ║   • composer install        ║
   ║   • mariadb-schema.sql      ║
   ║   • db/pbx_quota_           ║
   ║     extensions.sql          ║
   ║   • EE only: db/billing_    ║
   ║     seed.sql                ║
   ║   • v_domains seed          ║
   ║     (SEED_DOMAIN from       ║
   ║      hostname -I)           ║
   ║                             ║
   ║ 8. Config + auth            ║
   ║   • /usr/ictcore/etc/       ║
   ║     ictcore.conf            ║
   ║     [db] [security]         ║
   ║     [freeswitch][fusionpbx] ║
   ║     CE: [edition] mode=     ║
   ║         community           ║
   ║   • symlink /etc/           ║
   ║     ictcore.conf →          ║
   ║     /usr/ictcore/etc/...    ║
   ║   • JWT keypair RS256       ║
   ║     (ib_node + .pub)        ║
   ║                             ║
   ║ 9. Apache vhost (/api)      ║
   ║   • DocRoot                 ║
   ║     /usr/ictcore/wwwroot    ║
   ║   • PHP-FPM proxy           ║
   ║   • clear /usr/ictcore/     ║
   ║     cache/* (route cache)   ║
   ║                             ║
   ║ 10. Firewall (firewalld)    ║
   ║    • 80/443/5060/7443/8021  ║
   ║                             ║
   ║ 11. Bootstrap admin         ║
   ║    • set admin@ictcore.org  ║
   ║      MD5 password           ║
   ║                             ║
   ║ 12. Smoke tests             ║
   ║    • POST /api/authenticate ║
   ║    • GET  /api/             ║
   ║      fpbx_extensions        ║
   ╚══════════════╤══════════════╝
                  │
                  ▼
   ┌──────────────────────────────────────────────────┐
   │                  OUTPUT                          │
   │  • Apache:  /         → frontend SPA             │
   │             /api      → ICTCore (PHP-FPM)        │
   │             /fpbx     → FusionPBX                │
   │  • Services: httpd, php-fpm, mariadb,            │
   │              postgresql-16, memcached,           │
   │              freeswitch                          │
   │  • Login: admin@ictcore.org / <provided pass>    │
   │  • Logs: /tmp/ictcore-{ce-,}install.log          │
   │          /tmp/ictpbx-{ce-,}install.log           │
   └──────────────────────────────────────────────────┘
```

---

## EE vs CE — what differs

| Concern | EE installer | CE installer |
|---|---|---|
| FusionPBX version | 6.6.0 | 5.5.7 |
| `ictcore.conf` `[edition]` | absent / `enterprise` | `mode = community` |
| `db/billing_seed.sql` | seeded (17 resources + Package1 + tenant_id=1 quota) | **not run** (table doesn't exist after Phase 1 strip) |
| Branding tables | `db/branding.sql` loaded | not loaded |
| `tenant.fpbx_domain_uuid` ALTER | yes (via `pbx_quota_extensions.sql`) | yes (same migration is CE-safe — ALTER comes before EE-only INSERTs) |
| TLS | `certbot --nginx` if `DOMAIN=` env set | manual / out of band |
| Frontend `ng build` flag | `--configuration=production` | `--configuration=community` (sets `COMMUNITY_EDITION=true`) |
| Admin login | full menu | `EditionGuard` hides Tenant / Branding / Billing |
| Source repos cloned | `ictvision/ictpbx` + `ictpbx-frontend` | `ictvision/ictpbx-ce` + `ictpbx-ce-front-end` (downstream mirrors) |

---

## Hardening bake-ins (backported from EE → CE)

These were discovered during a CE test-node install on a fresh EL9 box and are now baked into both installer pairs so a fresh EL9 minimal image installs without manual fix-ups:

1. **`mod_rewrite` fallback** — EL9 minimal images don't ship `httpd-tools`; without it `mod_rewrite` is missing and the SPA `.htaccess` 404s every route. Installer detects + installs `httpd-tools`.
2. **PHP-FPM `listen.acl_users = ictcore`** — without this the Apache→FPM socket is `apache:apache 0660` and FPM (running as `ictcore`) can't accept the connection.
3. **`open_basedir` includes `/etc/ictcore.conf`** — symlink target must be in the allow-list or `Conf::get()` silently returns defaults (FusionPBX creds wrong → `/api/fpbx_extensions` 500).
4. **`freeswitch-codec-passthru-g729` split** — package occasionally lags the EL9 build target; pinning it to its own `dnf install … || warn` line lets the rest of FreeSWITCH install cleanly.
5. **`v_domains` seed** — `FpbxDomain::get_domain_uuid()` falls back to "first active domain"; on a fresh FusionPBX there is none, so PBX module saves fail. Installer inserts one row keyed off `hostname -I | awk '{print $1}'`.
6. **SPA `.htaccess` `/fpbx` exclusion** — without `RewriteCond %{REQUEST_URI} !^/fpbx`, the Angular catch-all rewrites `/fpbx/*` to `index.html` and FusionPBX is unreachable.
7. **`quiet()` helper instead of `&>/dev/null`** — silent-failure pattern hid `dnf` / `git` / `composer` / `systemctl` errors; `quiet()` discards stdout on success but dumps full stdout+stderr on non-zero exit.

---

## Critical files

| File | Purpose |
|---|---|
| `ictcore-install.sh` | EE backend installer — Rocky 8/9, FusionPBX 6.6.0 |
| `ictcore-ce-install.sh` | CE backend installer — Rocky 8/9, FusionPBX 5.5.7, `[edition] mode=community` |
| `ictpbx-install.sh` | EE frontend installer — Angular `--configuration=production` |
| `ictpbx-ce-install.sh` | CE frontend installer — Angular `--configuration=community` |
| `db/mariadb-schema.sql` | Core ictfax schema (loaded by both editions) |
| `db/pbx_quota_extensions.sql` | Tenant `fpbx_domain_uuid` + per-user PBX quota cols (CE-safe — ALTERs first, EE INSERTs last) |
| `db/billing_seed.sql` | EE-only — resources, packages, tenant_id=1 quota rows |
| `etc/ictcore.conf` | DB + JWT + FreeSWITCH + FusionPBX + edition config (written at install time) |
| `etc/ssh/ib_node{,.pub}` | JWT RS256 keypair (generated at install time) |

---

## Verification (post-install)

```
systemctl is-active httpd php-fpm mariadb postgresql-16 memcached freeswitch
curl -s -X POST http://<host>/api/authenticate \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin@ictcore.org","password":"<pass>"}'   # → JSON with token
curl -s -H "Authorization: Bearer <token>" http://<host>/api/fpbx_extensions  # → []
```

Browser checks: `http://<host>/` (frontend login), `http://<host>/fpbx` (FusionPBX UI).
