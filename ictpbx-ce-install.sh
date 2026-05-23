#!/usr/bin/env bash
# ictpbx-ce-install.sh — Fresh install of ictpbx-frontend (Community Edition)
# Supported distros: Rocky Linux 8.x / 9.x  ·  CentOS Stream 8 / 9
# Run as root from /usr/ictpbxx after git clone/pull
# Usage: bash /usr/ictpbxx/ictpbx-ce-install.sh
set -euo pipefail

FRONTEND_DIR=/usr/ictpbxx
# Same vhost file used by the backend installer — frontend converges on root vhost.
# We REPLACE (not parallel to) the backend's vhost so port 80 serves the Angular
# CE UI and /api proxies to ICTCore. FusionPBX UI is intentionally NOT exposed —
# CE users only see the Angular frontend.
APACHE_CONF=/etc/httpd/conf.d/ictpbx.conf
LOG=/tmp/ictpbx-ce-install.log

echo "============================================================"
echo " ICTPBX Frontend Install (Community Edition)"
echo " Distros : Rocky Linux 8.x / 9.x  ·  CentOS Stream 8 / 9"
echo " Log     : $LOG"
echo "============================================================"
exec > >(tee -a "$LOG") 2>&1

# ── helpers ──────────────────────────────────────────────────
ok()   { echo "[OK]  $*"; }
info() { echo "[..] $*"; }
warn() { echo "[WARN] $*"; }
fail() { echo "[FAIL] $*"; exit 1; }

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 1 — Verify directory
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "── Step 1: Directory check ──────────────────────────────────"
[[ -f "$FRONTEND_DIR/package.json" ]] || fail "package.json not found at $FRONTEND_DIR — run git clone first"
cd "$FRONTEND_DIR"
ok "Working directory: $FRONTEND_DIR"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 2 — Check Node.js and npm
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "── Step 2: Node.js / npm ────────────────────────────────────"
# Angular 13 needs Node 14-18. Rocky 9 default ships Node 20 — offer nodesource Node 18 LTS.
# Honor INSTALL_NODE18=1 (force) / INSTALL_NODE18=0 (skip, accept distro).
install_node18() {
    info "Installing Node.js 18 LTS from nodesource..."
    if ! command -v curl >/dev/null 2>&1; then dnf install -y curl; fi
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - || fail "nodesource setup script failed"
    dnf install -y nodejs || fail "dnf install nodejs (nodesource) failed"
    ok "Node 18 LTS installed via nodesource"
}
if ! command -v node >/dev/null 2>&1; then
    if [[ "${INSTALLER_AUTO:-0}" == "1" && "${INSTALL_NODE18:-1}" != "0" ]]; then
        install_node18
    elif [[ "${INSTALL_NODE18:-}" == "1" ]]; then
        install_node18
    else
        info "Node.js not found — installing distro nodejs + npm via dnf..."
        dnf install -y nodejs npm
        ok "Node.js installed via dnf"
    fi
fi
NODE_VER=$(node -e 'process.stdout.write(process.versions.node)')
NODE_MAJOR=${NODE_VER%%.*}
if [[ "$NODE_MAJOR" -lt 14 ]]; then
    fail "Node.js $NODE_VER is too old — Angular 13 needs >=14.x"
elif [[ "$NODE_MAJOR" -ge 19 ]]; then
    if [[ "${INSTALL_NODE18:-}" == "1" || ("${INSTALLER_AUTO:-0}" == "1" && "${INSTALL_NODE18:-1}" != "0") ]]; then
        warn "Node.js $NODE_VER detected — replacing with Node 18 LTS via nodesource"
        dnf remove -y nodejs npm 2>/dev/null || true
        install_node18
        NODE_VER=$(node -e 'process.stdout.write(process.versions.node)')
        NODE_MAJOR=${NODE_VER%%.*}
        ok "Node.js $NODE_VER (nodesource)"
    elif [[ "${INSTALLER_AUTO:-0}" != "1" ]]; then
        echo ""
        warn "Node.js $NODE_VER is newer than Angular 13's tested range (14-18)."
        echo "  Option 1: install Node 18 LTS via nodesource (recommended)"
        echo "  Option 2: keep $NODE_VER and build with NODE_OPTIONS='--openssl-legacy-provider'"
        read -rp "  Install Node 18 LTS via nodesource? [Y/n]: " _NODE_ANS
        _NODE_ANS="${_NODE_ANS:-y}"
        if [[ "$_NODE_ANS" =~ ^[Yy]$ ]]; then
            dnf remove -y nodejs npm 2>/dev/null || true
            install_node18
            NODE_VER=$(node -e 'process.stdout.write(process.versions.node)')
            NODE_MAJOR=${NODE_VER%%.*}
            ok "Node.js $NODE_VER (nodesource)"
        else
            warn "Continuing with Node $NODE_VER — using --openssl-legacy-provider workaround"
        fi
    else
        warn "Node.js $NODE_VER is newer than tested (16/18) — build may need NODE_OPTIONS=--openssl-legacy-provider"
    fi
else
    ok "Node.js $NODE_VER"
fi
ok "npm $(npm --version)"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 3 — Angular CLI 13
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "── Step 3: Angular CLI ──────────────────────────────────────"
if command -v ng &>/dev/null; then
    NG_VER=$(ng version 2>/dev/null | grep 'Angular CLI' | awk '{print $3}')
    ok "Angular CLI $NG_VER already installed"
else
    info "Angular CLI not found — installing @angular/cli@13 globally..."
    npm install -g @angular/cli@13 --quiet
    ok "Angular CLI 13 installed"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 4 — npm install
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "── Step 4: npm install ──────────────────────────────────────"
info "Running npm install --legacy-peer-deps (required for Angular 13 peer dep conflicts)..."
npm install --legacy-peer-deps --quiet
ok "npm install complete"

# Fix TypeScript — Angular 13 requires >=4.4.3 <4.7
# npm may pull in 4.9.x which breaks NGCC (Angular compatibility compiler)
TS_VER=$("$FRONTEND_DIR/node_modules/.bin/tsc" --version 2>/dev/null | awk '{print $2}')
TS_MINOR=$(echo "$TS_VER" | cut -d. -f2)
if [[ "${TS_MINOR}" -ge 7 ]]; then
    warn "TypeScript $TS_VER is too new for Angular 13 — downgrading to 4.6.4"
    npm install typescript@4.6.4 --legacy-peer-deps --save-dev --quiet
    ok "TypeScript downgraded to 4.6.4"
else
    ok "TypeScript $TS_VER — compatible"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 5 — Production build
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "── Step 5: Production build ─────────────────────────────────"
info "Building... this takes 10-20 min on a 2 vCPU / 4 GB server."

# General command (standard — uses more memory, produces source maps):
# npm run build:ce

# Optimized for low-resource servers (3 GB Node heap cap, no source maps, no named chunks):
# CE uses the 'community' Angular configuration, which swaps environment.ts for
# environment.community.ts (sets COMMUNITY_EDITION=true to hide EE-only menus / branding).
NODE_OPTIONS='--max_old_space_size=3072' ng build \
    --configuration=community \
    --aot \
    --source-map=false \
    --named-chunks=false

[[ -f "$FRONTEND_DIR/dist/index.html" ]] || fail "Build failed — dist/index.html not found. Check /tmp/ictpbx-ce-install.log"
ok "Build complete — dist/ ready (Community Edition)"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 6 — Port 80 check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "── Step 6: Port 80 availability ─────────────────────────────"
# Hardened ss parser: -H drops header (avoids NR>1 column drift on EL9),
# scan the whole row for users=(...) tokens rather than relying on $NF position.
# head -1 keeps the first match when multi-process listeners (httpd workers)
# split process info across multiple ("name",pid=N,...) tuples.
PORT80_LINE=$(ss -Htlnp 'sport = :80' 2>/dev/null | head -1 || true)
PORT80_PID=$(echo "$PORT80_LINE" | grep -oP 'pid=\K[0-9]+' | head -1 || true)
PORT80_PROC=$(echo "$PORT80_LINE" | grep -oP 'users:\(\("\K[^"]+' | head -1 || true)
# Fallback for older ss output formatting:
[[ -z "$PORT80_PROC" ]] && PORT80_PROC=$(echo "$PORT80_LINE" | grep -oP '"\K[^"]+' | head -1 || true)

if [[ -z "$PORT80_PID" ]]; then
    ok "Port 80 is free"
elif [[ "$PORT80_PROC" == "httpd" ]]; then
    ok "Port 80 in use by Apache (httpd) — will reconfigure"
else
    warn "Port 80 is in use by '$PORT80_PROC' (PID $PORT80_PID) — NOT Apache"
    echo ""
    echo "  Options:"
    echo "    1) Stop the conflicting process: kill $PORT80_PID"
    echo "    2) Configure this app on a different port (edit $APACHE_CONF after install)"
    echo ""
    read -rp "Stop '$PORT80_PROC' (PID $PORT80_PID) and continue? [y/N] " CONT
    if [[ "${CONT,,}" == "y" ]]; then
        kill "$PORT80_PID" 2>/dev/null && ok "Stopped PID $PORT80_PID" || warn "Could not stop PID $PORT80_PID — continuing anyway"
    else
        fail "Aborted — free port 80 and re-run"
    fi
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 7 — Apache setup
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "── Step 7: Apache configuration ─────────────────────────────"
command -v httpd &>/dev/null || fail "Apache (httpd) not found — install: dnf install -y httpd mod_rewrite"

# Disable Rocky Linux default welcome page if present
[[ -f /etc/httpd/conf.d/welcome.conf ]] && \
    mv /etc/httpd/conf.d/welcome.conf /etc/httpd/conf.d/welcome.conf.disabled && \
    info "Disabled Rocky Linux welcome page"

# Write VirtualHost config — replaces any existing ictpbx.conf from backend installer.
# Layout (CE users see ONLY the Angular frontend; FusionPBX UI is not exposed):
#   /          → Angular CE app (DocumentRoot)
#   /api       → ICTCore REST API
# FusionPBX runs as a backend (PG database, dialplan hooks, FreeSWITCH XML
# generation) but its web UI is intentionally not aliased.
cat > "$APACHE_CONF" <<'VHOST'
<VirtualHost *:80>
    DocumentRoot /usr/ictpbxx/dist
    ServerName _default_

    <Directory /usr/ictpbxx/dist>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # ICTCore REST API
    Alias /api /usr/ictcore/wwwroot
    <Directory /usr/ictcore/wwwroot>
        # #6 — /etc/ictcore.conf in open_basedir so Conf\File reads the symlink.
        SetEnv PHP_ADMIN_VALUE "open_basedir = /usr/ictcore/:/etc/ictcore.conf:/usr/bin:/bin:/tmp/"
        Options Indexes FollowSymLinks Includes
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog /var/log/httpd/ictpbx_error.log
    CustomLog /var/log/httpd/ictpbx_access.log combined
</VirtualHost>
VHOST

# SPA routing — all non-file, non-api requests fall through to index.html.
# /fpbx requests fall through to Angular (no FusionPBX UI exposure).
cat > "$FRONTEND_DIR/dist/.htaccess" <<'HTA'
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_URI} !^/api
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
HTA

ok "Apache vhost written: $APACHE_CONF"

# #29 — On EL9 minimal images mod_rewrite.so may be missing from base httpd RPM.
if [[ ! -f /etc/httpd/modules/mod_rewrite.so ]]; then
    info "mod_rewrite.so missing — pulling httpd sub-packages..."
    dnf install -y httpd-tools mod_http2 2>>"$LOG" || true
fi
grep -q 'mod_rewrite' /etc/httpd/conf.modules.d/*.conf 2>/dev/null || \
    echo "LoadModule rewrite_module modules/mod_rewrite.so" >> /etc/httpd/conf.modules.d/00-base.conf

systemctl enable httpd &>/dev/null
systemctl start  httpd 2>/dev/null || true
systemctl reload httpd
ok "Apache started and reloaded"

# ICTCore caches REST routes per Api class. Stale entries from a previous
# backend version can shadow new endpoints — clear on every frontend deploy.
if [[ -d /usr/ictcore/cache ]]; then
    rm -f /usr/ictcore/cache/* 2>/dev/null || true
    ok "ICTCore route cache cleared (/usr/ictcore/cache/*)"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 7b — TLS / Let's Encrypt (optional, parity with EE frontend)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Set DOMAIN=example.com and TLS_EMAIL=admin@example.com in the environment
# to issue a Let's Encrypt cert and switch the vhost to HTTPS. Without DOMAIN
# this whole step is skipped — the install stays HTTP-only on bare-IP nodes.
echo ""
echo "── Step 7b: TLS / certbot ───────────────────────────────────"
DOMAIN="${DOMAIN:-}"
TLS_EMAIL="${TLS_EMAIL:-admin@${DOMAIN}}"
if [[ -z "$DOMAIN" ]]; then
    info "DOMAIN env not set — skipping TLS step (HTTP-only install)"
    info "(re-run with: DOMAIN=example.com TLS_EMAIL=admin@example.com bash $0)"
else
    info "Issuing Let's Encrypt cert for ${DOMAIN}..."

    # Disable stock ssl.conf so its <VirtualHost _default_:443> doesn't
    # collide with the cert-bot-injected vhost in our ictpbx.conf.
    if [[ -f /etc/httpd/conf.d/ssl.conf ]]; then
        mv /etc/httpd/conf.d/ssl.conf /etc/httpd/conf.d/ssl.conf.disabled
        ok "Disabled /etc/httpd/conf.d/ssl.conf (collision with custom 443 vhost)"
    fi

    if ! command -v certbot &>/dev/null; then
        info "Installing certbot + python3-certbot-apache..."
        dnf install -y certbot python3-certbot-apache 2>>"$LOG" \
            || fail "certbot install failed — see $LOG"
        ok "certbot installed"
    fi

    # Ensure Apache is up before certbot runs (it talks to the live vhost).
    systemctl restart httpd

    # Non-interactive issue with deploy-hook so renewals reload Apache.
    if certbot --apache --non-interactive --agree-tos \
        --domain "$DOMAIN" --email "$TLS_EMAIL" \
        --deploy-hook "systemctl reload httpd" >>"$LOG" 2>&1; then
        ok "Let's Encrypt cert issued for ${DOMAIN} (renewal reloads httpd)"
    else
        warn "certbot run failed — see $LOG. Run manually: certbot --apache -d ${DOMAIN}"
    fi

    # Repoint [website] url to https://<domain>/api so JWT iss matches.
    if [[ -f /usr/ictcore/etc/ictcore.conf ]]; then
        sed -i -E "s|^url\s*=\s*http://[^/]+/api|url   = https://${DOMAIN}/api|" \
            /usr/ictcore/etc/ictcore.conf
        sed -i -E "/^\[website\]/,/^\[/{ s|^host\s*=.*|host  = ${DOMAIN}|; s|^port\s*=.*|port  = 443|; }" \
            /usr/ictcore/etc/ictcore.conf
        rm -f /usr/ictcore/cache/* 2>/dev/null || true
        systemctl reload php-fpm 2>/dev/null || true
        ok "ictcore.conf [website] repointed to https://${DOMAIN}/api (cache cleared)"
    fi
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 8 — Firewall
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "── Step 8: Firewall ─────────────────────────────────────────"
if systemctl is-active --quiet firewalld; then
    for SVC in http https; do
        if firewall-cmd --list-services --zone=public 2>/dev/null | grep -q "$SVC"; then
            ok "firewalld: $SVC already allowed"
        else
            firewall-cmd --permanent --zone=public --add-service="$SVC"
            ok "firewalld: $SVC added"
        fi
    done
    firewall-cmd --reload
    ok "firewalld reloaded"
else
    warn "firewalld is not running"
    # Check iptables as fallback
    if command -v iptables &>/dev/null; then
        if iptables -L INPUT -n 2>/dev/null | grep -q 'dpt:80'; then
            ok "iptables: port 80 already open"
        else
            warn "iptables: port 80 may be blocked — run: iptables -I INPUT -p tcp --dport 80 -j ACCEPT"
        fi
    else
        warn "No firewall tool detected — ensure port 80 is open in your cloud/VPS firewall panel"
    fi
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 9 — Smoke tests
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo "── Step 9: Smoke tests ──────────────────────────────────────"
ROOT_RESP=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1/" || echo "000")
if [[ "$ROOT_RESP" == "200" ]]; then
    ok "GET / → 200 (Angular CE app reachable)"
else
    warn "GET / → $ROOT_RESP — Apache may not have reloaded; check /var/log/httpd/ictpbx_error.log"
fi

API_RESP=$(curl -s -o /dev/null -w '%{http_code}' -X POST "http://127.0.0.1/api/authenticate" \
    -H 'Content-Type: application/json' -d '{}' || echo "000")
# 400/401 means /api routing reached ICTCore (auth rejected the empty body, as expected).
# 404 means the /api Alias isn't wired — backend not installed or vhost broken.
if [[ "$API_RESP" =~ ^(400|401|403)$ ]]; then
    ok "POST /api/authenticate → $API_RESP (backend reachable through /api alias)"
elif [[ "$API_RESP" == "404" ]]; then
    warn "POST /api/authenticate → 404 — backend installer hasn't run or vhost /api alias broken"
else
    warn "POST /api/authenticate → $API_RESP (unexpected) — check $LOG"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DONE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVER_IP=$(hostname -I | awk '{print $1}')
if [[ -n "${DOMAIN:-}" ]]; then
    APP_URL="https://${DOMAIN}/"
    API_URL="https://${DOMAIN}/api"
else
    APP_URL="http://${SERVER_IP}/"
    API_URL="http://${SERVER_IP}/api"
fi
echo ""
echo "============================================================"
ok "Installation complete!"
echo ""
echo "  Edition : Community (single-tenant, no billing, no branding)"
echo "  App URL : ${APP_URL}"
echo "  API     : ${API_URL}"
echo "  Log     : $LOG"
echo ""
echo "  Default web logins (seeded by backend installer):"
echo "    admin@ictcore.org / <password you entered during backend install>"
echo "    user@ictcore.org  / helloUser   <-- still default, change immediately"
echo ""
echo "  ──────────────────────────────────────────────────────────"
echo "  [!] SECURITY — before opening this node to the public:"
echo "  ──────────────────────────────────────────────────────────"
echo "    - Reset user@ictcore.org's default password from the admin UI."
echo "    - The backend installer auto-rotated FreeSWITCH ESL; the password"
echo "      was printed at the end of its run — save it if you haven't."
if [[ -z "${DOMAIN:-}" ]]; then
    echo "    - Add HTTPS:  re-run this installer with  DOMAIN=<host> TLS_EMAIL=<you>@..."
fi
echo "============================================================"
