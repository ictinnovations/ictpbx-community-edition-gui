# 7 — Reference

## Permission Reference

The table below lists every permission key, the menu/feature it unlocks, and which edition supports it.

### Fax Permissions

| Permission Key | Display Name | Menu / Feature | EE | CE |
|---------------|-------------|----------------|----|----|
| `send_fax` | Send Fax | Fax → Send Fax | ✅ | ✅ |
| `receive_fax` | Receive Fax | Fax → Inbox | ✅ | ✅ |
| `fax_to_email` | Fax to Email | Automatic email on receive | ✅ | ✅ |
| `email_to_fax` | Email to Fax | Inbound email → fax pipeline | ✅ | ✅ |
| `personalize_fax` | Personalize Fax | Custom sender ID | ✅ | ✅ |
| `campaigns` | Bulk Fax | Fax → Campaigns | ✅ | ✅ |
| `cover_page` | Cover Page | Fax → Cover Page | ✅ | ✅ |
| `resources.fax_documents` | Fax Documents | Fax → Fax Documents | ✅ | ✅ |
| `fax_accounts` | Fax Accounts | Fax → Fax Accounts | ✅ | ✅ |
| `fax_setting` | Fax Settings | Fax → Fax Settings | ✅ | ✅ |

### Contacts Permissions

| Permission Key | Display Name | Menu / Feature | EE | CE |
|---------------|-------------|----------------|----|----|
| `contacts` | Contacts | Contacts → Contacts | ✅ | ✅ |
| `groups` | Contact Groups | Contacts → Groups | ✅ | ✅ |
| `contact_dnc` | Contact DNC | Contacts → Do Not Call | ✅ | ✅ |

### PBX Permissions

| Permission Key | Display Name | Menu / Feature | EE | CE |
|---------------|-------------|----------------|----|----|
| `fpbx_extension` | Extensions | PBX → Extensions | ✅ | ✅ |
| `devices` | Devices | PBX → Devices | ✅ | ✅ |
| `ring_groups` | Ring Groups | PBX → Ring Groups | ✅ | ✅ |
| `call_queues` | Call Queues | PBX → Call Queues | ✅ | ✅ |
| `ivr_menus` | IVR Menus | PBX → IVR Menus | ✅ | ✅ |
| `voicemails` | Voicemail | PBX → Voicemail | ✅ | ✅ |
| `conferences` | Conferences | PBX → Conferences | ✅ | ✅ |
| `time_conditions` | Time Conditions | PBX → Time Conditions | ✅ | ✅ |
| `call_flows` | Call Flows | PBX → Call Flows | ✅ | ✅ |
| `call_block` | Call Block | PBX → Call Block | ✅ | ✅ |
| `follow_me` | Follow Me | PBX → Follow Me | ✅ | ✅ |
| `music_on_hold` | Music on Hold | PBX → Music on Hold | ✅ | ✅ |
| `inbound_routes` | Inbound Routes | PBX → Inbound Routes | ✅ | ✅ |
| `realtime` | Realtime | PBX → Realtime | ✅ | ✅ |

### Administration Permissions (system-level, admin only)

| Permission Key | Feature |
|---------------|---------|
| `user_admin` | Manage users (Administration → Users) |
| `gateways` | Manage SIP gateways/trunks |
| `super_admin` | Full system administration |

---

## PBX Resource Types

| Resource ID | Resource | Permission Key | User form field |
|-------------|----------|---------------|-----------------|
| 15 | Extensions | `fpbx_extension` | `quota_extensions` |
| 16 | Devices | `devices` | `quota_devices` |
| 7 | Ring Groups | `ring_groups` | `quota_ring_groups` |
| 8 | Call Queues | `call_queues` | `quota_call_queues` |
| 17 | IVR Menus | `ivr_menus` | `quota_ivr_menus` |
| 9 | Voicemail Boxes | `voicemails` | `quota_voicemail` |
| 10 | Conferences | `conferences` | `quota_conference` |
| 11 | Music on Hold | `music_on_hold` | `quota_music_on_hold` |

---

## User Roles

| Role Name | Role ID (EE prod) | Capabilities |
|-----------|-------------------|-------------|
| User | 1 | End-user; access only to explicitly granted features |
| Admin | 2 | Full system access; no permission filtering |
| Tenant | 3 | Manages users within their tenant; permission-filtered |

> **Note**: Role IDs differ per installation. Never hardcode them — ICTPBX always maps by name internally.

---

## API Overview

All ICTPBX functionality is exposed via a JSON REST API at `/api`.

**Authentication**: `Authorization: Bearer <JWT>` (RS256, 1-year expiry)

**Base URL**: `https://<your-server>/api`

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth` | Login — returns JWT |
| `GET` | `/users` | List users |
| `POST` | `/users` | Create user |
| `GET` | `/users/{id}` | Get user |
| `PUT` | `/users/{id}` | Update user |
| `DELETE` | `/users/{id}` | Delete user |
| `GET` | `/tenants` | List tenants (admin only) |
| `POST` | `/tenants` | Create tenant (admin only) |
| `GET` | `/billing/quota` | PBX resource quota summary |
| `GET` | `/fpbx_extension/extensions` | List extensions |
| `POST` | `/fpbx_extension/extensions` | Create extension |
| `GET` | `/devices/devices` | List devices |
| `GET` | `/ring_groups/ring_groups` | List ring groups |
| `GET` | `/call_queues/call_queues` | List call queues |
| `GET` | `/ivr_menus/ivr_menus` | List IVR menus |
| `GET` | `/voicemails/voicemails` | List voicemail boxes |
| `GET` | `/transmission` | List fax transmissions |
| `POST` | `/transmission` | Send a fax |
| `GET` | `/accounts` | List fax accounts |
| `GET` | `/cdr` | Call detail records |

All list endpoints support `?page=N&per_page=N&search=<term>` for pagination and filtering.

---

## localStorage Keys (Frontend)

These keys are written at login and read throughout the UI:

| Key | Value | Used for |
|-----|-------|---------|
| `aid` | User ID | API calls |
| `tid` | Tenant ID | Scoping requests |
| `is_admin` | `1` or `0` | Admin vs non-admin UI branching |
| `is_tenant` | `1` or `0` | Tenant admin detection |
| `permission` | Comma-delimited string | User's own permissions |
| `tenant_permissions` | Comma-delimited string | Tenant's permissions (used for what can be granted to sub-users) |
| `tenant_daily_limit` | Number | Tenant fax daily cap |
| `tenant_monthly_limit` | Number | Tenant fax monthly cap |
| `tenant_assigned_daily` | Number | Already-assigned daily quota |
| `tenant_assigned_monthly` | Number | Already-assigned monthly quota |
| `theme_pref` | Theme name | UI theme preference |

---

## Supported SIP Codecs

| Codec | Voice | Fax |
|-------|-------|-----|
| G.722 | ✅ HD | ❌ |
| G.711 PCMU | ✅ | ✅ (pass-through) |
| G.711 PCMA | ✅ | ✅ (pass-through) |
| T.38 | ❌ | ✅ (preferred, requires re-INVITE) |

Fax calls negotiate T.38 first; fall back to G.711 PCMA pass-through if the far end rejects T.38.
