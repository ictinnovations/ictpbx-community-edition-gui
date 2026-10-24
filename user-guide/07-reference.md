# 7 — Reference

## Permission Reference

The table below lists the permission keys that unlock menus and features. Super Admins see every menu; Tenant Admins and End Users see only the items their permissions allow.

### Fax Permissions

| Permission Key | Display Name | Menu / Feature |
|---------------|-------------|----------------|
| `send_fax` | Send Fax | Fax → Send Fax |
| `receive_fax` | Receive Fax | Fax → Receive Fax |
| `fax_to_email` | Fax to Email | Automatic email delivery of received faxes |
| `email_to_fax` | Email to Fax | Send a fax by email |
| `personalize_fax` | Personalize Fax | Custom sender details on outbound faxes |
| `campaigns` | Bulk Fax | Fax → Bulk Fax |
| `cover_page` | Cover Page | Fax → Cover Page |
| `resources.fax_documents` | Fax Documents | Fax → Media Library → Fax Documents |
| `fax_setting` | Fax Settings | Fax → Fax Settings |

> Fax accounts no longer have their own menu. A fax line is an extension whose type is **Fax** (PBX → Extensions).

### Contacts Permissions

| Permission Key | Display Name | Menu / Feature |
|---------------|-------------|----------------|
| `contacts` | Contacts | Fax → Contacts → Contacts |
| `groups` | Contact Groups | Fax → Contacts → Contact Groups |
| `contact_dnc` | Contact DNC | Fax → Contacts → Contact DNC |

### PBX Permissions

| Permission Key | Display Name | Menu / Feature |
|---------------|-------------|----------------|
| `fpbx_extension` | Extensions | PBX → Extensions |
| `devices` | Devices | PBX → Devices (End Users: My Devices) |
| `ring_groups` | Ring Groups | PBX → Ring Groups |
| `call_queues` | Call Queues | PBX → Call Queues |
| `ivr_menus` | IVR Menus | PBX → IVR Menus |
| `voicemails` | Voicemail | PBX → Voicemail |
| `conferences` | Conferences | PBX → Conferences |
| `time_conditions` | Time Conditions | PBX → Time Conditions |
| `call_flows` | Call Flows | PBX → Call Flows |
| `call_block` | Call Block | PBX → Call Block |
| `follow_me` | Follow Me | PBX → Follow Me |
| `music_on_hold` | Music on Hold | PBX → Music on Hold |
| `inbound_routes` | Inbound Routes | PBX → Inbound Routes |
| `realtime` | Realtime | PBX → Realtime |
| `feature_codes` | Feature Codes | PBX → Feature Codes |

End Users can view the PBX items they are granted, but cannot create PBX objects.

### Messaging Permissions (Service Provider Edition)

| Permission Key | Display Name | Menu / Feature |
|---------------|-------------|----------------|
| `messaging` | Messaging | Messaging → Inbox (End Users: Messaging) |
| `campaigns` | Send SMS | Messaging → Send SMS |

### Routing & Administration Permissions

| Permission Key | Feature |
|---------------|---------|
| `providers` | Routing → Trunks |
| `routes` | Routing → Routes |
| `my_dids` | Routing → DID Numbers |
| `cid_number` | Routing → CID Numbers |
| `user_admin` | Manage users (Administration → User Management) |
| `api_keys` | Administration → API Keys |
| `super_admin` | Full system administration |

---

## Billing Resource Types (Service Provider Edition)

Each package sets a limit per resource. **Slot limits** are hard caps on how many objects a tenant can create. **Monthly usage** resources are free units included each month; usage above the free amount is charged from the tenant's credit (billed hourly) and the counters reset at the start of each month.

| Resource ID | Resource | Type | Related Permission |
|-------------|----------|------|--------------------|
| 7 | Ring Groups | Slot limit | `ring_groups` |
| 8 | Call Queues | Slot limit | `call_queues` |
| 9 | Voicemail Boxes | Slot limit | `voicemails` |
| 10 | Conferences | Slot limit | `conferences` |
| 11 | Music on Hold | Slot limit | `music_on_hold` |
| 12 | Voice Minutes / month | Monthly usage | — |
| 13 | Fax Pages / month | Monthly usage | — |
| 14 | Conference Minutes / month | Monthly usage | — |
| 15 | Extensions | Slot limit | `fpbx_extension` |
| 16 | Devices | Slot limit | `devices` |
| 17 | IVR Menus | Slot limit | `ivr_menus` |
| 18 | SMS Messages / month | Monthly usage | `messaging` |

---

## User Roles

| Role | Role ID | Capabilities |
|------|---------|-------------|
| Super Admin | 2 | Full system access; no permission filtering |
| Tenant Admin | 3 | Manages users and PBX objects within their own tenant; permission-filtered |
| End User | 4 | Uses only the features explicitly granted; cannot create PBX objects |

There is no assignable Agent role.

---

## API Overview

All ICTPBX functionality is exposed via a JSON REST API.

**Base URL**: `https://<your-server>/api`

### Authentication

Use either method:

- **JWT** — `POST /api/authenticate` with your username and password. Send the returned token on every request as `Authorization: Bearer <jwt>`.
- **API key** — create one in **Administration → API Keys** and send it as `X-API-Key: <key>`. A key acts with the permissions of the user it belongs to, is rate-limited (HTTP `429` when exceeded), and cannot be used to create other API keys.

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/authenticate` | Log in — returns a JWT |
| `GET` / `POST` | `/users` | List / create users |
| `GET` / `PUT` / `DELETE` | `/users/{id}` | Read / update / delete a user |
| `GET` / `POST` | `/tenants` | List / create tenants (Super Admin, Service Provider Edition) |
| `GET` / `POST` | `/fpbx_extensions` | List / create extensions |
| `GET` | `/devices` | List devices |
| `GET` | `/ring_groups` | List ring groups |
| `GET` | `/call_queues` | List call queues |
| `GET` | `/ivr_menus` | List IVR menus |
| `GET` | `/voicemails` | List voicemail boxes |
| `GET` | `/inbound_routes` | List inbound routes |
| `GET` | `/providers` | List trunks |
| `GET` | `/dids` | List DID numbers |
| `POST` | `/call/originate` | Click-to-call (see below) |
| `GET` | `/transmissions` | List fax transmissions |
| `GET` | `/cdr` | Call detail records |
| `GET` | `/fpbx_cdr` | PBX call detail records |
| `GET` | `/billing/quota` | Resource quota summary (Service Provider Edition) |
| `GET` | `/billing/usage` | Usage summary (Service Provider Edition) |
| `GET` / `POST` | `/sms`, `/sms/threads`, `/sms/messages` | SMS messaging (Service Provider Edition) |

### Click-to-call

```http
POST /api/call/originate
Content-Type: application/json

{"from_ext": "1001", "to_number": "+12015550123"}
```

ICTPBX first rings extension `1001`; when it answers, the call is placed to `to_number`. The response is `{"status": "queued", "job_uuid": "..."}`. If `from_ext` is not currently registered, the API returns **409**.

---

## Network Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 80 / 443 | TCP | Web portal and API (443 also carries the browser softphone) |
| 5080 | UDP / TCP | SIP for desk phones, softphones and trunks — **there is no SIP on 5060** |
| 16384–32768 | UDP | RTP voice/fax media |
| 8021 | TCP | FreeSWITCH event socket — localhost only, never open it publicly |

The browser softphone connects to `wss://<your-host>/ws/` over port 443 and requires HTTPS. Ports 5066/5067 are internal only and do not need to be opened.

When registering a phone, use **Server/Proxy** = your portal host, **Port** = `5080`, and **Domain/Realm** = your tenant's SIP domain (shown on **My Extension → SIP Domain**).

---

## Supported Codecs

| Codec | Used for |
|-------|----------|
| Opus | Browser softphone (preferred) |
| G.711 PCMU / PCMA | Desk phones, softphones, trunks; fax pass-through fallback |
| G.729 | Low-bandwidth phones and trunks |
| T.38 | Fax (preferred) |

Fax calls negotiate T.38 first and fall back to G.711 pass-through if the far end rejects T.38.
