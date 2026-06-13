#!/usr/bin/env bash
# install-ce.sh — ICTPBX Full Stack Installer (Community Edition)
#
# Installs ICTCore CE backend + ICTPBX CE Angular frontend in one go.
# Collects all passwords once and passes them to each sub-installer.
#
# Usage (one-liner, fresh server):
#   bash <(curl -fsSL https://raw.githubusercontent.com/ictinnovations/ictpbx-community-edition-gui/main/install-ce.sh)
#
# Usage from cloned CE frontend repo:
#   bash /usr/ictpbxx/install-ce.sh
#
# With domain + HTTPS:
#   DOMAIN=pbx.example.com TLS_EMAIL=admin@example.com bash <(curl ...)
#
# Unattended / CI:
#   INSTALLER_AUTO=1 \
#     MARIADB_ROOT_PASS=xxx MARIADB_ICTFAX_PASS=xxx \
#     PG_FUSIONPBX_PASS=xxx ICTCORE_ADMIN_PASS=xxx \
#     bash install-ce.sh

set -euo pipefail

# Release tag to install. Override for a pin/rollback, e.g. RELEASE_TAG=v1.0.0 bash install-ce.sh
RELEASE_TAG="${RELEASE_TAG:-v1.0.2}"
CE_FRONTEND_REPO_URL="https://github.com/ictinnovations/ictpbx-community-edition-gui.git"
FRONTEND_DIR=/usr/ictpbxx
LOG=/tmp/ictpbx-ce-full-install.log

exec > >(tee -a "$LOG") 2>&1

# ── helpers ──────────────────────────────────────────────────
ok()   { echo "[OK]  $*"; }
info() { echo "[..] $*"; }
warn() { echo "[WARN] $*"; }
fail() { echo "[FAIL] $*"; exit 1; }
hdr()  { echo ""; echo "── $* ──────────────────────────────────────────────────────"; }

prompt_secret() {
    local _var="$1"; local _label="$2"
    if [[ -n "${!_var:-}" ]]; then
        ok "${_label}: using pre-set ${_var} from environment"
        return 0
    fi
    if [[ "${INSTALLER_AUTO:-0}" == "1" ]]; then
        fail "${_var} must be set when INSTALLER_AUTO=1 (e.g. ${_var}=secret bash $0)"
    fi
    read -rsp "  ${_label}: " "$_var"; echo
}

[[ "$EUID" -eq 0 ]] || fail "This script must be run as root"

echo "============================================================"
echo " ICTPBX Full Stack Installer — Community Edition"
echo " Installs: ICTCore CE backend + Angular CE frontend"
echo " Log     : $LOG"
echo "============================================================"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 1 — Collect all passwords once
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
hdr "Step 1: Passwords (collected once for both installers)"
echo ""
echo "  Enter passwords (will not be echoed):"
echo ""
prompt_secret MARIADB_ROOT_PASS    "MariaDB root password        "
prompt_secret MARIADB_ICTFAX_PASS  "MariaDB ictfax user password "
prompt_secret PG_FUSIONPBX_PASS    "PostgreSQL fusionpbx password"
prompt_secret ICTCORE_ADMIN_PASS   "ICTCore admin password       "
echo ""

# Export for sub-installers; INSTALLER_AUTO=1 prevents them re-prompting
export MARIADB_ROOT_PASS MARIADB_ICTFAX_PASS PG_FUSIONPBX_PASS ICTCORE_ADMIN_PASS
export INSTALLER_AUTO=1

# Pass through optional vars if set by caller
[[ -n "${DOMAIN:-}"      ]] && export DOMAIN
[[ -n "${TLS_EMAIL:-}"   ]] && export TLS_EMAIL
[[ -n "${PUBLIC_HOST:-}" ]] && export PUBLIC_HOST
export RELEASE_TAG

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 2 — Ensure CE frontend repo is present
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
hdr "Step 2: CE frontend repo"
if [[ ! -f "$FRONTEND_DIR/package.json" ]]; then
    info "Cloning CE frontend repo ($RELEASE_TAG) to $FRONTEND_DIR ..."
    git clone --branch "$RELEASE_TAG" "$CE_FRONTEND_REPO_URL" "$FRONTEND_DIR"
    ok "Cloned $RELEASE_TAG to $FRONTEND_DIR"
else
    ok "CE frontend repo already present at $FRONTEND_DIR"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 3 — Backend install (bundled in CE frontend repo)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
hdr "Step 3: Backend install (ictcore-ce-install.sh)"
[[ -f "$FRONTEND_DIR/ictcore-ce-install.sh" ]] || \
    fail "ictcore-ce-install.sh not found in $FRONTEND_DIR — clone may be incomplete"
chmod +x "$FRONTEND_DIR/ictcore-ce-install.sh"
bash "$FRONTEND_DIR/ictcore-ce-install.sh"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 4 — Frontend install
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
hdr "Step 4: Frontend install (ictpbx-ce-install.sh)"
bash "$FRONTEND_DIR/ictpbx-ce-install.sh"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Done
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVER_IP=$(hostname -I | awk '{print $1}')
APP_URL="http://${SERVER_IP}/"
API_URL="http://${SERVER_IP}/api"
[[ -n "${DOMAIN:-}" ]] && APP_URL="https://${DOMAIN}/" && API_URL="https://${DOMAIN}/api"

echo ""
echo "============================================================"
ok "ICTPBX CE full stack installation complete!"
echo ""
echo "  App : ${APP_URL}"
echo "  API : ${API_URL}"
echo ""
echo "  Logins (seeded accounts):"
echo "    admin@ictcore.org / <password you entered>  [Super Admin]"
echo "    user@ictcore.org  / helloUser               [End User -- change immediately]"
echo ""
echo "  Logs:"
echo "    Backend  : /tmp/ictcore-ce-install.log"
echo "    Frontend : /tmp/ictpbx-ce-install.log"
echo "    This run : $LOG"
echo "============================================================"
