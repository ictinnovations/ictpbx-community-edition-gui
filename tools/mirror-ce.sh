#!/usr/bin/env bash
# tools/mirror-ce.sh — sync EE repos to CE mirrors
#
# Strategy: hard-strip + force-push fresh. CE mirrors are downstream artifacts;
# git history is rewritten on every run. EE-only files (branding, multi-tenant,
# billing) are physically removed so they never appear in the public CE source.
#
# Run from anywhere. Reads PAT from ../git-token relative to this script.
# Mirrors:
#   ictvision/ictpbx          → ictinnovations/ictpbx-community-edition     (backend)
#   ictvision/ictpbx-frontend → ictinnovations/ictpbx-community-edition-gui (frontend)

set -euo pipefail

# Must run on a case-sensitive filesystem. The EE backend tree contains both
# core/Core.php and core/core.php; on Windows / macOS default APFS those collide
# at checkout time and one file silently disappears, breaking the CE mirror.
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    echo "ERROR: this script must run on Linux (case-sensitive FS)." >&2
    echo "On Windows, Git checkout drops case-collided files like core/Core.php vs core/core.php." >&2
    exit 1
    ;;
esac

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
PAT_FILE="$FRONTEND_REPO/git-token"

if [ ! -s "$PAT_FILE" ]; then
  echo "ERROR: PAT not found at $PAT_FILE" >&2
  exit 1
fi
PAT="$(tr -d '[:space:]' < "$PAT_FILE")"

EE_BACKEND="https://${PAT}@github.com/ictvision/ictpbx.git"
EE_FRONTEND="https://${PAT}@github.com/ictvision/ictpbx-frontend.git"
PUBLIC_BACKEND="https://${PAT}@github.com/ictinnovations/ictpbx-community-edition.git"
PUBLIC_FRONTEND="https://${PAT}@github.com/ictinnovations/ictpbx-community-edition-gui.git"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

GIT_AUTHOR_NAME="ICT Vision"
GIT_AUTHOR_EMAIL="tahiralmas@gmail.com"
DATE_TAG="$(date -u +%Y-%m-%d)"

# ── Backend ────────────────────────────────────────────────────────────────
mirror_backend() {
  local dst="$WORK/backend"
  echo "[backend] cloning EE → $dst"
  git clone --depth 1 -q "$EE_BACKEND" "$dst"
  cd "$dst"

  echo "[backend] hard-strip EE-only files"
  # Branding + multi-tenant API + EE billing-quota engine.
  rm -f db/branding.sql
  rm -f core/Branding.php
  rm -f core/Api/BrandingApi.php
  rm -f core/Api/TenantApi.php
  rm -f core/Api/BillingUsageApi.php
  rm -f core/Api/BillingCreditApi.php
  rm -f core/PbxQuota.php

  # Phase 1 strip — billing model + region/rate cluster (no CE references).
  # Verified: Plan/Rate/Region only consumed by Spool* (also EE-bound) and
  # billing reports; Payment/UsageQuota are EE-only by definition.
  rm -f core/Plan.php           core/Api/PlanApi.php
  rm -f core/Rate.php           core/Api/RateApi.php
  rm -f core/Payment.php        core/Api/PaymentApi.php
  rm -f core/Region.php         core/Api/RegionApi.php
  rm -f core/UsageQuota.php

  # Phase 1 strip — EE-only SQL: billing seed, per-user CDR aggregation,
  # statistics-report deltas, route/rate routing seed data, EE upgrade scripts.
  rm -f db/billing.sql
  rm -f db/billing_seed.sql
  rm -f db/billing_cdr_sync.sql
  rm -f db/users_cdr.sql
  rm -f db/statistics_report_changes.sql
  rm -rf db/routes_management
  rm -f db/data/role_tenant.sql
  rm -f db/data/role_user.sql
  rm -f db/update/update_tenant_permission.sql
  rm -f db/update/branding.sql
  rm -f db/update/MFA.sql

  echo "[backend] strip maintainer tooling (never ship to CE)"
  rm -f git-tahir.sh

  echo "[backend] inject CE-only demo_users.sql (admin + end_user — no tenant/user/billing)"
  cat > db/data/demo_users.sql << 'CE_DEMO_EOF'
-- CE demo seed: two accounts, two roles (admin + end_user). No billing, no multi-tenant.
-- CE roles: admin (role_id=2) and end_user (role_id=4) only.
-- role_id=1 (user/base) and role_id=3 (tenant) are stripped from CE.
-- INSERT IGNORE makes re-runs idempotent.
INSERT IGNORE INTO tenant(tenant_id, first_name, last_name, company, phone, email, active, daily_limit, monthly_limit, daily_sent, monthly_sent)
  VALUES (1, 'Super', 'Admin', 'Super Admin', '111111', 'admin@ictcore.org', 1, 100000, 2000000, 0, 0);

-- Admin account (role_id=2 only — no base role_id=1 in CE)
INSERT IGNORE INTO usr(usr_id, tenant_id, username, passwd, first_name, last_name, email, phone, active, created_by, pass_exp_in, daily_limit, monthly_limit, allowed_days, allowed_timeslot)
  VALUES (1, 1, 'admin@ictcore.org', MD5('helloAdmin'), 'System', 'Administrator', 'admin@ictcore.org', '111111', 1, 1, 0, 10000, 2000000, '1,2,3,4,5,6,7', '00:00,23:59');
INSERT IGNORE INTO user_role (role_id, usr_id) SELECT role_id, 1 FROM role WHERE name='admin';

-- End-user demo account (role_id=4 only)
INSERT IGNORE INTO usr(usr_id, tenant_id, username, passwd, first_name, last_name, email, phone, active, created_by, pass_exp_in, daily_limit, monthly_limit, allowed_days, allowed_timeslot)
  VALUES (2, 1, 'user@ictcore.org', MD5('helloUser'), 'End', 'User', 'user@ictcore.org', '111111', 1, 1, 0, 100, 1000, '1,2,3,4,5,6,7', '00:00,23:59');
INSERT IGNORE INTO user_role (role_id, usr_id) SELECT role_id, 2 FROM role WHERE name='end_user';
UPDATE usr SET user_permission='voicemails,follow_me' WHERE usr_id=2 AND user_permission='';
CE_DEMO_EOF

  echo "[backend] swap README-ce.md → README.md"
  if [ -f README-ce.md ]; then
    mv -f README-ce.md README.md
  else
    echo "[backend] WARN: README-ce.md missing in EE backend; keeping EE README.md"
  fi

  echo "[backend] inject CE installer from frontend repo"
  cp "$FRONTEND_REPO/ictcore-ce-install.sh" .
  chmod +x ictcore-ce-install.sh

  echo "[backend] validate — no EE-only content leaking into CE"
  _ce_ok=1

  # 1. Every SQL file referenced in the installer must exist in the stripped tree.
  #    A missing file = EE-only SQL was listed but not removed → install-time error.
  while IFS= read -r _sql; do
    if [ ! -f "db/$_sql" ]; then
      echo "[FAIL] installer loads db/$_sql but file is absent after strip (EE-only?)" >&2
      _ce_ok=0
    fi
  done < <(grep -oP '^\s+\K\w+\.sql' ictcore-ce-install.sh || true)

  # 2. Known EE-only PHP classes must not exist after stripping.
  #    If any appear, a new EE file was added without a matching strip entry.
  for _ee_file in \
      core/Branding.php core/Api/BrandingApi.php core/Api/TenantApi.php \
      core/Api/BillingUsageApi.php core/Api/BillingCreditApi.php \
      core/PbxQuota.php core/UsageQuota.php \
      core/Plan.php core/Api/PlanApi.php \
      core/Rate.php core/Api/RateApi.php \
      core/Payment.php core/Api/PaymentApi.php \
      core/Region.php core/Api/RegionApi.php; do
    if [ -f "$_ee_file" ]; then
      echo "[FAIL] EE-only file still present after strip: $_ee_file" >&2
      _ce_ok=0
    fi
  done

  # 3. EE-only SQL files must not exist after stripping.
  for _ee_sql in \
      db/branding.sql db/billing.sql db/billing_seed.sql db/billing_cdr_sync.sql \
      db/users_cdr.sql db/statistics_report_changes.sql \
      db/data/role_tenant.sql db/data/role_user.sql; do
    if [ -f "$_ee_sql" ]; then
      echo "[FAIL] EE-only SQL still present after strip: $_ee_sql" >&2
      _ce_ok=0
    fi
  done

  if [ "$_ce_ok" -eq 0 ]; then
    echo "[FAIL] CE validation failed — fix strip list or installer before pushing." >&2
    exit 1
  fi
  echo "[backend] CE validation passed"

  echo "[backend] fresh init + force push main + append to master"
  rm -rf .git
  git init -q -b main
  git config user.name "$GIT_AUTHOR_NAME"
  git config user.email "$GIT_AUTHOR_EMAIL"
  git add -A
  git commit -q -m "ICTPBX CE backend — synced ${DATE_TAG} from EE"
  git remote add origin "$PUBLIC_BACKEND"
  git push -f -q origin main

  # Append to master (non-force) so history accumulates across syncs.
  if git fetch -q origin master 2>/dev/null && git rev-parse --verify FETCH_HEAD >/dev/null 2>&1; then
    git checkout -q -b master FETCH_HEAD
    git rm -rf -q . >/dev/null 2>&1 || true
    git checkout -q main -- .
    git commit -q -m "ICTPBX CE backend — synced ${DATE_TAG} from EE" || true
    git push -q origin master
  else
    git push -q origin main:master
  fi
  echo "[backend] done"
}

# ── Frontend ───────────────────────────────────────────────────────────────
# NOTE: frontend EE pages (branding, tenant, billing, plan, rate, payment) are
# NOT physically stripped. They are gated at runtime by EditionGuard +
# environment.community.ts (COMMUNITY_EDITION=true). Without the backend EE
# endpoints (which ARE physically stripped from ictpbx-ce), those pages would
# just hit 404s — so leaving them in CE source is non-functional and harmless.
# Hard-stripping them broke the build (dangling imports in @core/core.module.ts,
# @theme/footer, app.module, dashboard, pages.module, infax-component).
mirror_frontend() {
  local dst="$WORK/frontend"
  echo "[frontend] cloning EE → $dst"
  git clone --depth 1 -q "$EE_FRONTEND" "$dst"
  cd "$dst"

  echo "[frontend] remove EE installers + EE README"
  rm -f ictpbx-install.sh ictcore-install.sh install.sh README.md

  echo "[frontend] strip internal dev guide + internal-docs/ + EE test configs"
  rm -f CLAUDE.md
  rm -rf internal-docs
  rm -rf playwright*
  rm -rf e2e

  # user-guide: whitelist approach — strip entire folder, restore CE-safe files only.
  # Any new EE guide added to user-guide/ is automatically excluded this way.
  # To expose a new guide to CE: add its filename to the list below.
  if [ -d user-guide ]; then
    mkdir -p /tmp/_ce_guide_safe
    for _f in index.md 01-overview.md 02-quick-start-ce.md 03-admin-guide.md \
               05-pbx-features.md 06-fax-features.md 07-reference.md 08-troubleshooting.md; do
      [ -f "user-guide/$_f" ] && cp "user-guide/$_f" "/tmp/_ce_guide_safe/$_f" || true
    done
    rm -rf user-guide && mkdir user-guide
    cp /tmp/_ce_guide_safe/* user-guide/ 2>/dev/null || true
    rm -rf /tmp/_ce_guide_safe
  fi

  # Root-level .md: strip known EE-only docs.
  # Add rm -f here for any new EE root doc; CE-safe ones (README, CHANGELOG, LICENSE, etc.) need no action.
  rm -f installer-diagram.md
  rm -f proposal.md

  echo "[frontend] swap README-ce.md → README.md"
  if [ -f README-ce.md ]; then
    mv -f README-ce.md README.md
  else
    echo "[frontend] ERROR: README-ce.md missing in EE frontend" >&2
    exit 1
  fi

  echo "[frontend] fresh init + force push main + append to master"
  rm -rf .git
  git init -q -b main
  git config user.name "$GIT_AUTHOR_NAME"
  git config user.email "$GIT_AUTHOR_EMAIL"
  git add -A
  git commit -q -m "ICTPBX CE frontend — synced ${DATE_TAG} from EE"
  git remote add origin "$PUBLIC_FRONTEND"
  git push -f -q origin main

  # Append to master (non-force) so history accumulates across syncs.
  if git fetch -q origin master 2>/dev/null && git rev-parse --verify FETCH_HEAD >/dev/null 2>&1; then
    git checkout -q -b master FETCH_HEAD
    git rm -rf -q . >/dev/null 2>&1 || true
    git checkout -q main -- .
    git commit -q -m "ICTPBX CE frontend — synced ${DATE_TAG} from EE" || true
    git push -q origin master
  else
    git push -q origin main:master
  fi
  echo "[frontend] done"
}

mirror_backend
mirror_frontend
echo
echo "✓ CE mirrors populated. Verify:"
echo "  https://github.com/ictinnovations/ictpbx-community-edition"
echo "  https://github.com/ictinnovations/ictpbx-community-edition-gui"
