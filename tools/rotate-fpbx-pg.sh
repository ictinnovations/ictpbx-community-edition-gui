#!/usr/bin/env bash
# Rotate the FusionPBX PostgreSQL password atomically.
# Handles EE (FusionPBX 6.x dotted config) AND CE (5.x [database] section).
# Updates: PG role, /etc/fusionpbx/config.conf, /usr/ictcore/etc/ictcore.conf [fusionpbx]
# Reloads httpd + (if installed) restarts freeswitch, then smoke-tests PG and /api.
# Backups are written next to the originals as *.bak.<unixts>.
set -euo pipefail

NEW_PASS="$(openssl rand -hex 16)"
TS="$(date +%s)"

ICTCORE_CONF=/usr/ictcore/etc/ictcore.conf
FPBX_CONF=/etc/fusionpbx/config.conf

# Detect PG service unit + psql binary path (CE uses postgresql-16 + /usr/pgsql-16/bin/psql)
PG_UNIT=""
for u in postgresql postgresql-16 postgresql-15; do
  if systemctl is-active "$u" >/dev/null 2>&1; then PG_UNIT="$u"; break; fi
done
[ -n "$PG_UNIT" ] || { echo "no active postgresql unit found"; exit 1; }

PSQL="$(command -v psql || true)"
[ -x "$PSQL" ] || PSQL=/usr/pgsql-16/bin/psql
[ -x "$PSQL" ] || { echo "psql not found"; exit 1; }

# FreeSWITCH unit may not exist on CE installs without SignalWire token
FS_PRESENT=0
if systemctl list-unit-files freeswitch.service >/dev/null 2>&1 \
   && systemctl cat freeswitch.service >/dev/null 2>&1; then
  FS_PRESENT=1
fi

cp -p "$FPBX_CONF" "$FPBX_CONF.bak.$TS"
cp -p "$ICTCORE_CONF" "$ICTCORE_CONF.bak.$TS"

# Capture old password (works for both formats) for rollback
OLD_PASS="$(python3 - "$FPBX_CONF" <<'PY'
import re, sys
s = open(sys.argv[1]).read()
m = re.search(r'(?m)^database\.0\.password\s*=\s*(.*)$', s)
if m:
    print(m.group(1).strip()); sys.exit()
m = re.search(r'\[database\][^\[]*?(?m:^password\s*=\s*(.*)$)', s)
print(m.group(1).strip() if m else '')
PY
)"
echo "[1/6] backup ok: .bak.$TS  (PG=$PG_UNIT  FS=$FS_PRESENT)"

# ALTER PG role
sudo -u postgres "$PSQL" -v ON_ERROR_STOP=1 -c "ALTER USER fusionpbx WITH PASSWORD '$NEW_PASS'" >/dev/null
echo "[2/6] ALTER USER fusionpbx ok"

# /etc/fusionpbx/config.conf — handles BOTH 6.x dotted and 5.x [database] section
python3 - "$FPBX_CONF" "$NEW_PASS" <<'PY'
import re, sys
p, np = sys.argv[1], sys.argv[2]
s = open(p).read()
s2, n = re.subn(r'(?m)^(database\.0\.password\s*=\s*).*$',
                lambda m: m.group(1) + np, s, count=1)
if n == 0:
    def repl(m):
        return re.sub(r'(?m)^(password\s*=\s*).*$',
                      lambda x: x.group(1) + np, m.group(0), count=1)
    s2, n = re.subn(r'\[database\][^\[]*', repl, s, count=1)
assert n == 1 and s != s2, 'config.conf: no change'
open(p, 'w').write(s2)
PY
echo "[3/6] /etc/fusionpbx/config.conf updated"

# /usr/ictcore/etc/ictcore.conf — only the [fusionpbx] section's pass = "..."
python3 - "$ICTCORE_CONF" "$NEW_PASS" <<'PY'
import re, sys
p, np = sys.argv[1], sys.argv[2]
s = open(p).read()
def repl_section(m):
    sec = m.group(0)
    return re.sub(r'(\npass\s*=\s*")[^"]*(")',
                  lambda x: x.group(1) + np + x.group(2), sec, count=1)
s2 = re.sub(r'\[fusionpbx\][^\[]*', repl_section, s, count=1)
assert s != s2, 'ictcore.conf [fusionpbx] pass: no change'
open(p, 'w').write(s2)
PY
echo "[4/6] /usr/ictcore/etc/ictcore.conf [fusionpbx] updated"

# Reload services
systemctl reload httpd
if [ "$FS_PRESENT" = "1" ]; then
  systemctl restart freeswitch
  echo "[5/6] httpd reloaded, freeswitch restarted"
else
  echo "[5/6] httpd reloaded (freeswitch unit absent, skipped)"
fi

# Smoke tests
PGPASSWORD="$NEW_PASS" "$PSQL" -h 127.0.0.1 -U fusionpbx -d fusionpbx -tAc 'select 1' >/dev/null
echo "  - psql with new pass: ok"

# clear ICTCore route cache so any stale config bindings drop
rm -f /usr/ictcore/cache/* 2>/dev/null || true

TOKEN="$(curl -fsS -X POST http://127.0.0.1/api/authenticate \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin@ictcore.org","password":"helloAdmin"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')"
echo "  - JWT obtained: ${TOKEN:0:24}..."

HTTP=$(curl -s -o /tmp/.fpbx-ext.json -w '%{http_code}' \
  -H "Authorization: Bearer $TOKEN" http://127.0.0.1/api/fpbx_extensions)
echo "  - GET /api/fpbx_extensions: HTTP $HTTP"
if [ "$HTTP" != "200" ]; then
  echo "FPBX endpoint failed - rolling back"
  sudo -u postgres "$PSQL" -v ON_ERROR_STOP=1 -c "ALTER USER fusionpbx WITH PASSWORD '$OLD_PASS'" >/dev/null
  cp -p "$FPBX_CONF.bak.$TS" "$FPBX_CONF"
  cp -p "$ICTCORE_CONF.bak.$TS" "$ICTCORE_CONF"
  systemctl reload httpd
  [ "$FS_PRESENT" = "1" ] && systemctl restart freeswitch
  echo "ROLLED BACK to old password"
  exit 1
fi

echo "[6/6] all smoke tests passed"
echo
echo "NEW FPBX PG PASSWORD: $NEW_PASS"
