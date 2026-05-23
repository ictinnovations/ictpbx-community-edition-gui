#!/usr/bin/env bash
# Deploy Angular dist to EE prod server
# Usage: bash deploy.sh
# Builds if dist/ is missing, then tars + uploads + extracts atomically.

set -e

SERVER_IP="66.42.114.181"
SERVER_PASS="9%nG=u#7dcZo(rgz"
SERVER_USER="root"
REMOTE_DIR="/usr/ictpbxx/dist"
PSCP="C:/Program Files/PuTTY/pscp.exe"
PLINK="plink"
TAR_FILE="dist-deploy.tar.gz"

# Build if dist is absent or user passes --build
if [[ ! -d dist ]] || [[ "$1" == "--build" ]]; then
  echo "[deploy] Building..."
  rm -rf .angular/cache
  NODE_OPTIONS='--max_old_space_size=3072' npx ng build --configuration production
fi

echo "[deploy] Packaging dist/..."
tar -czf "$TAR_FILE" -C dist .

echo "[deploy] Uploading $TAR_FILE to server..."
echo y | "$PSCP" -pw "$SERVER_PASS" -batch "$TAR_FILE" "${SERVER_USER}@${SERVER_IP}:/tmp/${TAR_FILE}"

echo "[deploy] Extracting on server..."
echo y | "$PLINK" -pw "$SERVER_PASS" -batch "${SERVER_USER}@${SERVER_IP}" \
  "rm -rf ${REMOTE_DIR}.bak && mv ${REMOTE_DIR} ${REMOTE_DIR}.bak && mkdir -p ${REMOTE_DIR} && tar -xzf /tmp/${TAR_FILE} -C ${REMOTE_DIR} && rm /tmp/${TAR_FILE} && echo 'Deploy OK'"

rm -f "$TAR_FILE"
echo "[deploy] Done. Hard-refresh browser with Ctrl+Shift+R."
