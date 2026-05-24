import { request } from '@playwright/test';

const _BASE = process.env.PW_BASE_URL || process.env.E2E_API_BASE?.replace(/\/api$/, '') || 'http://localhost';
const API_BASE = process.env.E2E_API_BASE || `${_BASE}/api`;
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
    // Clean e2e_ prefixed users and extra ictpbx.test users
    const usersResp2 = await ctx.get(`${API_BASE}/users`, { headers });
    if (usersResp2.ok()) {
      const users2: any[] = await usersResp2.json();
      for (const u of users2) {
        const email: string = u.email || '';
        if (email.startsWith('e2e_') ||
            (email.endsWith('@ictpbx.test') && email !== 'test-admin@ictpbx.test')) {
          await ctx.delete(`${API_BASE}/users/${u.user_id ?? u.usr_id}`, { headers }).catch(() => {});
        }
      }
    }

    // Clean e2e_ prefixed tenants
    const tenantsResp2 = await ctx.get(`${API_BASE}/tenants`, { headers });
    if (tenantsResp2.ok()) {
      const tenants2: any[] = await tenantsResp2.json();
      for (const t of tenants2) {
        if ((t.company || '').toLowerCase().startsWith('e2e_')) {
          await ctx.delete(`${API_BASE}/tenants/${t.tenant_id}`, { headers }).catch(() => {});
        }
      }
    }

    // Clean e2e_ test DIDs (phone starting with 1999555)
    const didsResp = await ctx.get(`${API_BASE}/dids`, { headers });
    if (didsResp.ok()) {
      const dids: any[] = await didsResp.json();
      for (const d of dids) {
        const phone: string = d.phone || '';
        if (phone.startsWith('19995551')) {
          await ctx.delete(`${API_BASE}/dids/${d.id ?? d.account_id}`, { headers }).catch(() => {});
        }
      }
    }
  } finally {
    await ctx.dispose();
  }
}
