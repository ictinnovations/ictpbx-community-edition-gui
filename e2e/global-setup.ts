import { request } from '@playwright/test';

const API_BASE = process.env.E2E_API_BASE || 'http://localhost/api';
const ADMIN_EMAIL  = 'admin@ictcore.org';
const ADMIN_PASS   = 'helloAdmin';
const TENANT_EMAIL = 'e2etenant@ictpbx.test';
const USER_EMAIL   = 'e2euser@ictpbx.test';

export default async function globalSetup() {
  const ctx = await request.newContext({ baseURL: API_BASE });
  try {
    const authResp = await ctx.post(`${API_BASE}/authenticate`, {
      data: { username: ADMIN_EMAIL, password: ADMIN_PASS },
    });
    if (!authResp.ok()) return;
    const authData = await authResp.json();
    const token = authData.token || authData.data?.token || authData.access_token;
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const tenantsResp = await ctx.get(`${API_BASE}/tenants`, { headers });
    if (tenantsResp.ok()) {
      const tenants: any[] = await tenantsResp.json();
      for (const t of tenants) {
        if (t.email === TENANT_EMAIL) {
          await ctx.delete(`${API_BASE}/tenants/${t.tenant_id}`, { headers });
          break;
        }
      }
    }

    const usersResp = await ctx.get(`${API_BASE}/users`, { headers });
    if (usersResp.ok()) {
      const users: any[] = await usersResp.json();
      for (const u of users) {
        if (u.email === USER_EMAIL || u.username === 'e2euser' ||
            u.email === TENANT_EMAIL || u.username === TENANT_EMAIL) {
          await ctx.delete(`${API_BASE}/users/${u.user_id}`, { headers });
        }
      }
    }
  } finally {
    await ctx.dispose();
  }
}
