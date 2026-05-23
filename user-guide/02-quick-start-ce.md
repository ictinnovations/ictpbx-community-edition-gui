# 2 — Quick Start: Community Edition

The Community Edition is single-tenant. There is no tenant management — the Admin creates users directly and all users share a single PBX domain.

---

## Step 1 — Log in as Admin

Go to your ICTPBX URL and log in with the credentials set during installation.

![Login](assets/screenshots/login.png)

---

## Step 2 — Create a User

1. Go to **Administration → Users**.
2. Click **Add User**.

Fill in user details:

| Field | Description |
|-------|-------------|
| First Name / Last Name | Display name |
| Username | Login email address |
| Password | Must meet the password policy |
| Role | **User** (tenant role not available in CE) |

### Assign Permissions

Check the fax and PBX features the user should be able to access.

3. Click **Save**.

---

## Step 3 — Add PBX Extensions

1. Go to **PBX → Extensions**.
2. Click **Add Extension**.
3. Fill in extension number, display name, and SIP password.
4. Provision a SIP device pointing at the server.

---

## Step 4 — Send a Test Fax

1. Log in as the new user.
2. Go to **Fax → Send Fax**.
3. Upload a document and enter a destination number.
4. Click **Send**.

---

## Key Differences from Enterprise Edition

| Feature | CE | EE |
|---------|----|----|
| Multiple tenants | ❌ | ✅ |
| Per-tenant quota | ❌ | ✅ |
| Branding | ❌ | ✅ |
| Billing | ❌ | ✅ |
| PBX features | ✅ Full | ✅ Full |
| Fax features | ✅ Full | ✅ Full |
