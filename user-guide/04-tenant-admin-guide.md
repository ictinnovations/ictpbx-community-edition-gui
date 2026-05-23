# 4 — Tenant Admin Guide

> **EE only** — Tenant admin accounts exist in Enterprise Edition only. In Community Edition the single admin account manages everything.

A **Tenant Admin** (role = Tenant) manages users within their own organisation. They cannot manage other tenants or access system-level settings.

---

## What a Tenant Admin Can Do

- Create, edit, and delete users within their tenant
- Assign permissions to sub-users — but **only permissions they themselves hold**
- Allocate PBX resource quota to sub-users — within their tenant's quota pool
- Use all fax and PBX features they have been granted by the system admin

## What a Tenant Admin Cannot Do

- Create or edit tenants
- Access billing or branding settings
- Grant a permission they do not hold
- Assign quota beyond what remains in the tenant's pool

---

## Creating Sub-Users

1. Log in as the tenant admin account.
2. Go to **Administration → Users**.
3. Click **Add User**.

The user form appears with the tenant pre-selected (your own tenant — you cannot change it).

### Permissions

The **Fax Permissions** and **PBX Permissions** cards show **only the permissions your account holds**. You cannot grant what you don't have.

For example, if your tenant admin account has:
- Send Fax, Receive Fax, Fax to Email
- Extensions, Devices, Call Queues, Voicemail

Then the form shows exactly those checkboxes — nothing more.

### PBX Resource Allocation

The **PBX Resource Allocation** card appears directly below the PBX Permissions card. It shows one quota input for each PBX permission that is **checked** in the form above — if you have not checked a permission, its quota row does not appear.

Each input shows:

- **Available** — how many slots remain in the tenant's pool for that resource type

The input's maximum is capped at the available remaining. You cannot over-allocate. Unchecking a PBX permission automatically zeros its quota field. The quota is enforced at object-creation time: if a sub-user has used their full allocation for a resource, attempting to create another returns an error.

### Fax Quota

The daily and monthly fax limit inputs show the remaining capacity in the tenant's pool. The form prevents saving if the entered value exceeds what remains.

---

## Managing Existing Users

Go to **Administration → Users** to see all users in your tenant.

Click **Edit** to update a user's details, permissions, or quota.

Click **Delete** to remove a user.

---

## Viewing Your Own Quota

Go to **Billing → Usage** to see your tenant's current fax and resource usage.

---

## Important Notes

- **Role assignment**: When creating a sub-user, select **User** (not Tenant) for regular end-users. Granting the Tenant role gives them tenant-admin level access.
- **Permission changes take effect at next login**: If you remove a permission from a sub-user, they must log out and back in before the menu reflects the change.
- **You cannot edit your own tenant record**: The Tenants menu is not available to tenant admin accounts.
