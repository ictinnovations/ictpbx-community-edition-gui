# ICTPBX Community Edition

ICTPBX is an open-source unified communications management platform combining full-featured IP-PBX and Fax server capabilities in a single web UI. It is built on top of [ICTFax](https://www.ictfax.com) Angular Framework, [ICTCore](https://github.com/ictinnovations/ictcore) (PHP REST framework), [FusionPBX](https://www.fusionpbx.com/) (PBX configuration engine), and [FreeSWITCH](https://freeswitch.com/) (media server).

### PBX Features
- SIP extension and device management
- IVR auto-attendant with nested menus
- ACD call queues with agent assignment
- Voicemail boxes with email delivery
- Conference rooms
- Ring groups and follow-me forwarding
- Time-based call routing and call flows
- Call blocking (inbound and outbound)
- SIP trunk / gateway management
- Inbound DID routing
- Real-time active call monitoring
- Call Detail Records (CDR) with search and export

### Fax Features
- Send fax from web UI (upload document → route via SIP trunk)
- Receive inbound fax via DID (T.38 / audio fallback)
- Fax-to-email delivery — auto-forward received faxes to one or more email addresses
- Multi-recipient fax (department fax — all extensions linked to a DID receive the email)
- Fax campaign management (bulk send)
- Fax CDR and transmission history

### Community Edition vs Service Provider Edition (SP Edition)
The **Community Edition** (this repo) is free, single-tenant, and licensed under [MPL 2.0](https://mozilla.org/MPL/2.0/).  
The **Service Provider Edition (SP Edition)** adds multi-tenant management, white-label branding, and usage billing — visit [www.ictpbx.com](https://www.ictpbx.com) for details.

---

**Project site:** [www.ictpbx.com](https://www.ictpbx.com)

---

> **Installing on a server?** One command installs the full stack (backend + frontend):
> ```bash
> bash <(curl -fsSL https://raw.githubusercontent.com/ictinnovations/ictpbx-community-edition-gui/main/install-ce.sh)
> ```
> This README is for **frontend developers** running the UI locally.

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | 18.x LTS (recommended) — 14–18 supported, ≥19 needs `--openssl-legacy-provider` |
| npm | 6+ |
| Angular CLI | 13 |

---

## Quick Start (dev)

```bash
npm install --legacy-peer-deps
bash ng-serve
```

App runs at **http://localhost:4201**

> `--legacy-peer-deps` is required — several UI libraries have peer dependency conflicts under npm 7+.

---

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@ictcore.org` | *whatever you set during install* | Super Admin |
| `user@ictcore.org` | `helloUser` (seeded default — change immediately) | End User |

The backend installer prompts for the admin password and writes the hash. `user@ictcore.org` keeps its seed default through every install — reset it from the admin UI (User → Edit) or:

```sql
UPDATE usr SET passwd=MD5('<new-password>') WHERE email='user@ictcore.org';
```

---

## Production Build

```bash
npm run build:ce
```

Output goes to `/dist`. Deploy behind Apache/Nginx with `API_URL` proxy to the ICTCore backend.

The `build:ce` configuration sets `COMMUNITY_EDITION=true` in the environment, which:
- Hides Tenant management, branding, and billing menus
- Skips branding API calls on login
- Restricts end-user menu to permission-gated items only (no multi-tenant tier)

---

## Environment Configuration

`src/environments/environment.community.ts`:

```ts
export const environment = {
  production: true,
  API_URL: '/api',
  WS_URL: '',
  COMMUNITY_EDITION: true,
};
```

---

## PBX Modules

| Module | Route | Description |
|--------|-------|-------------|
| Extensions | `/pages/fpbx_extension/extensions` | SIP extension management |
| Devices | `/pages/devices/devices` | Phone device registration |
| Ring Groups | `/pages/ring_groups/ring_groups` | Hunt groups |
| Call Queues | `/pages/call_queues/call_queues` | ACD queues + agents |
| IVR Menus | `/pages/ivr_menus/ivr_menus` | Auto-attendant builder |
| Voicemails | `/pages/voicemails/voicemails` | Voicemail box management |
| Conferences | `/pages/conferences/conferences` | Conference rooms |
| Time Conditions | `/pages/time_conditions/time_conditions` | Time-based routing |
| Call Flows | `/pages/call_flows/call_flows` | Call flow builder |
| Call Block | `/pages/call_block/call_block` | Inbound/outbound call blocking |
| Follow Me | `/pages/follow_me/follow_me` | Call forwarding rules |
| Music on Hold | `/pages/music_on_hold/music_on_hold` | MoH file management |
| Gateways | `/pages/gateways/gateways` | SIP trunk configuration |
| Inbound Routes | `/pages/inbound_routes/inbound_routes` | DID routing rules |
| Realtime | `/pages/realtime` | Live call status dashboard |

---

## i18n

Translations in `src/assets/i18n/`:
- `english.json`
- `italian.json`
- `japanies.json`

---

## Key Libraries

| Library | Purpose |
|---------|---------|
| Nebular 9 / ngx-admin | UI framework + theme |
| Angular Material 13 | Component library |
| ng2-smart-table | Data grids |
| sip.js 0.21 | WebRTC SIP (agent dashboard) |
| @azure/msal-angular | Azure AD / SAML auth |
| @ngx-translate | i18n |
| ngx-echarts | Charts |

---

## FusionPBX Integration

ICTPBX uses FusionPBX as a **backend configuration store only**:

- **PostgreSQL database** (`fusionpbx` DB, `v_*` tables) — PBX objects (extensions, devices, ring groups, IVR menus, call queues, voicemails, gateways, dialplans, etc.) are read and written directly via PDO.
- **FusionPBX XML hooks** — when database records change, FusionPBX's internal hooks automatically regenerate and reload FreeSWITCH XML configuration.
- **No FusionPBX UI** — the FusionPBX web interface is not used, not bundled, and not exposed. All management is done through the ICTPBX Angular UI via ICTCore REST API.
- **No FusionPBX PHP code** — no FusionPBX classes or libraries are imported or executed by ICTCore.

FusionPBX is licensed under the [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/).

---

## Database

| Database | Engine | Purpose |
|----------|--------|---------|
| `ictfax` | MariaDB 10.11 | ICTCore core data (users, voice, fax) |
| `fusionpbx` | PostgreSQL 16 | PBX objects (extensions, queues, gateways, etc.) |

See backend repo ([ictinnovations/ictpbx-community-edition](https://github.com/ictinnovations/ictpbx-community-edition)) for schema dumps and PHP classes.

---

## Role / Permission Model

CE has two roles — no Tenant Admin tier (multi-tenant is an SP Edition feature).

| Role | role_id | Flag | Access |
|------|---------|------|--------|
| Super Admin | 2 | `is_admin=1` | Full access to all management pages |
| End User | 4 | — | Limited, permission-gated (My Account, Voicemail, Follow Me) |

End users see only the items their admin has granted them. Tenant management, branding, and billing menus are hidden in all CE builds.

---

**Project site:** [www.ictpbx.com](https://www.ictpbx.com)  
Developed by [ICT Innovations](https://www.ictinnovations.com)
