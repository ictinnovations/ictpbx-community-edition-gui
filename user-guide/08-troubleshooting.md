# 8 — Troubleshooting

---

## Login Issues

### "Invalid username or password"
- Verify you are using your email address as the username (not a display name).
- Passwords are case-sensitive.
- If your account was locked due to too many failed attempts, contact your administrator to unlock it.

### "Password expired" (426 error)
- Your password has reached the expiry period set in the Password Policy.
- Go to the login page and use **Forgot Password** to reset, or ask an admin to reset it.

### Blank screen after login
- Clear browser cache and hard-refresh (`Ctrl+Shift+R`).
- Ensure JavaScript is enabled.
- Check that you are using a supported browser (Chrome, Firefox, Edge).

---

## Fax — Sending

### Fax stays in "Pending" status
- The background scheduler runs every minute. Wait 1–2 minutes.
- If still pending after 5 minutes, check that the scheduler (cron) is running on the server.
- Ensure the sending account is active and has a valid outbound gateway/route configured.

### "No route found" error on send
- No outbound SIP gateway is configured, or no route matches the destination number prefix.
- Go to **PBX → Gateways** and verify at least one gateway is in REGED status.
- Check that a route exists for the dialled prefix in the route table.

### Fax fails with "TIFF file cannot be opened"
- The uploaded document could not be converted.
- Ensure you upload PDF, TIFF, or a supported Word format.
- Corrupt or password-protected files will fail — try re-exporting the document.

### Fax sent but recipient reports not receiving
- The transmission may show "Completed" but the far-end fax machine rejected silently.
- Check the billsec in CDR — a very short call (< 5 s) usually indicates immediate rejection.
- Try sending to a different number to isolate whether it is the destination or your setup.

---

## Fax — Receiving

### Inbound fax call arrives but no file is saved
The most common causes:

1. **`PrivateTmp=true` in php-fpm** — PHP-FPM runs in a private `/tmp/` namespace isolated from FreeSWITCH's `/tmp/`. Fix:
   ```bash
   mkdir -p /etc/systemd/system/php-fpm.service.d/
   printf '[Service]\nPrivateTmp=false\n' > /etc/systemd/system/php-fpm.service.d/override.conf
   systemctl daemon-reload && systemctl restart php-fpm
   ```

2. **`ictcore` not in `daemon` group** — FreeSWITCH creates TIFF files as `freeswitch:daemon 660`. PHP needs daemon group membership:
   ```bash
   usermod -a -G daemon ictcore && systemctl restart php-fpm
   ```

3. **No dialplan row for the DID** — Verify a dialplan entry exists in ICTCore for this inbound number.

### "No recipient found" on inbound fax
- The DID account must have `type = did`. If it is `type = account`, the fax authorization check will fail.
- Check in **Fax → Fax Accounts** that the account for the inbound number shows type `did`.

### Fax-to-Email not delivering
- Verify an SMTP provider is configured (a row in the provider table with `type = smtp`).
- Confirm the extension account has an email address set and `Link DID` points to the correct DID.
- Check server logs for SMTP connection errors.

---

## PBX — Extensions & Devices

### SIP phone cannot register
- Verify the extension number and password match exactly (case-sensitive password).
- Confirm the SIP server address in the phone points to the ICTPBX server IP.
- Ensure port 5060 (SIP) is not blocked by a firewall between the phone and the server.
- Check FreeSWITCH is running: `systemctl status freeswitch`

### Extension not ringing on inbound calls
- Verify the inbound route is configured for the DID in **PBX → Inbound Routes**.
- Confirm the destination (extension / ring group / IVR) exists and is enabled.
- Check that the extension is registered: in FreeSWITCH run `sofia status profile internal` and look for the extension in the registration list.

### Changes to ring groups / IVR / queues not taking effect
- FusionPBX automatically reloads XML when records are saved — allow 2–3 seconds.
- If changes still do not apply, reload manually: `fs_cli -x 'reloadxml'`

---

## PBX — Gateways

### Gateway shows "NOREG" or "FAILED"
- Verify the SIP credentials (username, password, proxy) with your carrier.
- Check that FreeSWITCH can reach the carrier's SIP server: `ping <carrier-proxy>`
- Ensure the gateway XML file exists on disk:
  ```bash
  ls /etc/freeswitch/sip_profiles/external/<gateway-name>.xml
  ```
  If missing, re-save the gateway in ICTPBX to regenerate it.
- Reload the profile: `fs_cli -x 'sofia profile external rescan'`

---

## Permissions & Access

### Menu item is missing after login
- Your account may not have the required permission. Ask your admin to add it in the user edit form.
- After permission changes, **log out and back in** — the JWT must be refreshed.

### "403 Forbidden" from the API
- Your account lacks the permission required for that action.
- Confirm the permission is assigned and that you logged out/in after the change.

### Admin cannot save PBX quota above the pool size
- Ensure the backend `UserApi.php` is at version `143800a` or later (the `!$callerIsAdmin` guard).
- Clear the ICTCore route cache after any backend update: `rm -f /usr/ictcore/cache/*`

### "PBX quota limit reached" error when creating an extension / device / ring group etc.
- The user has consumed their full allocation for that resource type.
- Go to **Administration → Users**, edit the user, and increase the quota for that resource in the **PBX Resource Allocation** card.
- If the tenant pool itself is exhausted, the admin must increase the tenant's PBX quota in **Administration → Tenants → Edit**.
- Note: the PBX Resource Allocation card only shows rows for permissions that are checked — enable the relevant PBX permission first if the row is not visible.

---

## Performance

### Pages load slowly
- The Angular service worker caches assets. After a deployment, force-refresh: `Ctrl+Shift+R`.
- If the server is slow, check available memory: `free -h`. ICTCore needs at least 256 MB free.

### Build / deploy issues
- Angular build requires `NODE_OPTIONS='--max_old_space_size=3072'` on servers with limited RAM.
- Always use `pscp.exe` (not plink heredoc) for file uploads > 2 KB — plink silently truncates large files.

---

## Getting Help

If you encounter an issue not covered here:

1. Check the ICTCore log at `/usr/ictcore/log/` on the server.
2. Check the FreeSWITCH log: `tail -f /var/log/freeswitch/freeswitch.log`
3. Check php-fpm error log: `journalctl -u php-fpm -n 100`
4. Open an issue at the project GitHub repository.
