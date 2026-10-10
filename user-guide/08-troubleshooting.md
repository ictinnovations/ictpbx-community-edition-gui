# 8 — Troubleshooting

Server-side commands below assume shell access to the ICTPBX server as root. FreeSWITCH's event socket is password-protected with a random password generated at install. Load it once per shell session before using `fs_cli`:

```bash
ESL_PASS=$(awk -F'=' '/^\[freeswitch\]/{f=1;next} /^\[/{f=0} f && $1 ~ /^[ \t]*password[ \t]*$/ {gsub(/[ \t]/,"",$2); print $2; exit}' /usr/ictcore/etc/ictcore.conf)
fs_cli -p "$ESL_PASS" -x 'status'
```

ICTPBX runs a single SIP profile named **`webrtc`** that serves desk phones, softphones, the browser softphone and trunks.

---

## Login Issues

### "Invalid username or password"
- Use the username your administrator created for you.
- Passwords are case-sensitive.
- After too many failed attempts the account is temporarily locked — wait, or ask your administrator.

### "Password expired" (426 error)
- Your password has reached the expiry period set in the Password Policy.
- Use **Forgot Password** on the login page, or ask an admin to reset it.

### Blank screen after login
- Clear the browser cache and hard-refresh (`Ctrl+Shift+R`).
- Use a current Chrome, Firefox, or Edge with JavaScript enabled.

---

## Fax — Sending

### Fax stays in "Pending" status
- The background scheduler runs every minute. Wait 1–2 minutes.
- If still pending after 5 minutes, check that the scheduler (cron) is running on the server.
- Make sure a fax route and a registered trunk exist (**Routing → Routes**, **Routing → Trunks**).

### "No route found" error on send
- No outbound route matches the destination number for the Fax service.
- Go to **Routing → Trunks** and confirm at least one trunk is registered.
- Go to **Routing → Routes** and confirm a Fax route covers the dialled prefix.

### Fax fails with "TIFF file cannot be opened"
- The uploaded document could not be converted.
- Upload PDF, TIFF, or a supported Office format. Corrupt or password-protected files fail — re-export the document.

### Fax sent but recipient reports not receiving
- A transmission can show "Completed" while the far-end machine rejected it.
- Check the duration in **Reports → CDR Reports** — a very short call (under 5 s) usually means immediate rejection.
- Send to a different number to isolate the problem.

---

## Fax — Receiving

### Inbound fax not arriving
- The DID must be delivered to fax: on **Fax → My DIDs**, click **Forward** and send the number to a **Fax**-type extension (**Receive Fax** / **Forward to Extension**) or to **Fax to Email**.
- A voice **Inbound Route** on the same DID takes priority. A DID is either voice or fax, not both — delete the voice inbound route if the number should receive faxes.
- Confirm the call reaches the server at all: check **Reports → PBX CDR** for the inbound call.

### Fax received but not saved (server administrators)
If the call arrives but no file appears, check that PHP can read FreeSWITCH's temporary files:

```bash
# PHP-FPM must share /tmp with FreeSWITCH
mkdir -p /etc/systemd/system/php-fpm.service.d/
printf '[Service]\nPrivateTmp=false\n' > /etc/systemd/system/php-fpm.service.d/override.conf
# The ictcore user must be in the daemon group
usermod -a -G daemon ictcore
systemctl daemon-reload && systemctl restart php-fpm
```

### Fax-to-Email not delivering
- Confirm an SMTP trunk is configured in **Routing → Trunks** (type SMTP).
- Confirm the receiving fax extension has a delivery email address set.
- Check the server mail log for SMTP connection errors.

---

## PBX — Extensions & Devices

### Phone won't register
- Use **Port 5080** (UDP or TCP). There is no SIP service on 5060.
- Set **Domain / Realm** to your tenant's SIP domain (shown on **My Extension → SIP Domain**) and **Server / Proxy** to the portal host.
- Check the extension number and password exactly (the password is case-sensitive).
- For auto-provisioned phones, the device must have a **Line** bound to an extension (**PBX → Devices → Add Line**). A device with no line provisions an empty account.
- Make sure no firewall blocks 5080 and UDP 16384–32768 between the phone and the server.
- List current registrations:
  ```bash
  fs_cli -p "$ESL_PASS" -x 'sofia status profile webrtc reg'
  ```

### Browser softphone won't connect
- The browser softphone requires **HTTPS**. On a plain-HTTP or bare-IP install, browsers block the microphone and the secure WebSocket.
- Point a DNS name at the server first, then re-run the installer in upgrade mode with `DOMAIN=<your-domain>` and `TLS_EMAIL=<your-email>` to issue a certificate and enable secure WebSocket on port 443.

### Extension not ringing on inbound calls
- Check the inbound route for the DID in **PBX → Inbound Routes**.
- Confirm the destination (extension, ring group, IVR, etc.) exists and is enabled.
- Confirm the extension is registered (see the command above).

### Changes to ring groups / IVR / queues not taking effect
- ICTPBX regenerates the configuration and reloads FreeSWITCH automatically on every save. Re-save the item once if a change does not seem to apply.

### Click-to-Call returns 409
- The **from** extension is not registered. Register the phone or softphone for that extension and try again.

### Inbound Route save returns 409
- Another inbound route already uses that DID. Each DID can have only one inbound route — edit the existing route instead.

### Voicemail and star codes
- Check voicemail by dialling `*99<mailbox>` (for example `*991001`).
- `*99` on its own reaches the AI Voice Agent (Service Provider Edition).
- No other star codes are active.

### Dialling `*99` gives busy or silence
- The AI Voice Agent (Service Provider Edition, optional add-on) is not installed or not running on the server. Ask your administrator.

---

## Routing — Trunks

### Trunk not registering
- Open **Routing → Trunks**, verify the username, password, and host with your carrier, and **Save** again. Changes apply immediately.
- Check that the server can reach the carrier's SIP host.
- Check gateway status:
  ```bash
  fs_cli -p "$ESL_PASS" -x 'sofia status gateway'
  ```

---

## Security

### Many failed SIP registrations in the log
Internet-facing SIP servers are routinely scanned by brute-force bots. The installer does not configure fail2ban — set it up yourself with a FreeSWITCH jail that bans repeated authentication failures, and whitelist your own office IPs. Use strong extension passwords.

---

## Permissions & Access

### Menu item is missing after login
- Your account may not have the required permission. Ask your admin to add it in the user edit form.
- After permission changes, **log out and back in**.

### "403 Forbidden" from the API
- Your account lacks the permission required for that action. End Users cannot create or change PBX objects.
- Confirm the permission is assigned and that you logged out and back in after the change.

### API returns 429
- Your API key has hit its rate limit. Slow down requests and retry.

### "Quota limit reached" when creating an extension, device, ring group, etc. (Service Provider Edition)
- The tenant or user has used its full allocation for that resource.
- Go to **Administration → User Management**, edit the user, and raise the quota in the **PBX Resource Allocation** card. The card only shows rows for permissions that are enabled.
- If the tenant's package limit itself is exhausted, a Super Admin must assign a larger package in **Billing → Subscriptions** or raise the limit in **Billing → Packages**.

---

## Performance

### Pages load slowly or show an old version
- The portal caches its files in the browser. After an upgrade, accept the update prompt or hard-refresh (`Ctrl+Shift+R`).
- Check free memory on the server: `free -h`.

---

## Getting Help

If you encounter an issue not covered here:

1. Check the ICTCore log in `/usr/ictcore/log/`.
2. Check the FreeSWITCH log: `tail -f /var/log/freeswitch/freeswitch.log`
3. Check the PHP-FPM log: `journalctl -u php-fpm -n 100`
4. Open an issue in the project's GitHub repository.
