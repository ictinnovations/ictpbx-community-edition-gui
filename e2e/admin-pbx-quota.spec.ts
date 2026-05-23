/**
 * Verify admin can set PBX quota > tenant pool without error.
 * ffff@ictcore.org user_id=77, tenant_id=69
 */
import { test, expect, Page } from '@playwright/test';

const BASE  = 'http://66.42.114.181';
const ADMIN = { email: 'admin@ictcore.org', pass: 'helloAdmin' };

async function login(page: Page, email: string, pass: string) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 20000 });
  await page.fill('#input-email', email);
  await page.fill('#input-password', pass);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
}

test('Admin can save PBX quota = 1000 on ffff user', async ({ page }) => {
  // Intercept PUT /api/users/77 to capture request/response
  const responses: { status: number; body: string }[] = [];
  page.on('response', async resp => {
    if (resp.url().includes('/api/users/77') && resp.request().method() === 'PUT') {
      const body = await resp.text().catch(() => '');
      responses.push({ status: resp.status(), body });
    }
  });

  await login(page, ADMIN.email, ADMIN.pass);

  // Navigate to ffff's edit page (user_id=77)
  await page.goto(`${BASE}/#/pages/user/user/77`);
  await page.waitForLoadState('load', { timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.waitForSelector('#username', { timeout: 15000 });

  // Wait for PBX Resource Allocation card to appear
  await page.waitForSelector('nb-card-header:has-text("PBX Resource Allocation")', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Set all visible quota inputs to 2 (safe value, easy to verify)
  const quotaInputs = page.locator('nb-card:has(nb-card-header:has-text("PBX Resource Allocation")) input[type="number"]');
  const count = await quotaInputs.count();
  console.log(`Found ${count} PBX quota inputs`);

  for (let i = 0; i < count; i++) {
    await quotaInputs.nth(i).fill('1000');
  }

  // Capture any error text before save
  await page.click('button:has-text("Update")');
  await page.waitForTimeout(3000);

  // Check for error messages in the DOM
  const errorText = await page.locator('.alert-danger, .alert-warning, [class*="error"], nb-alert').allTextContents();
  console.log('Error elements:', JSON.stringify(errorText));
  console.log('API responses:', JSON.stringify(responses));

  // Assert no error shown
  expect(responses.length, 'PUT request was made').toBeGreaterThan(0);
  if (responses.length > 0) {
    expect(responses[0].status, `PUT status should be 200, got: ${responses[0].body.substring(0, 300)}`).toBe(200);
  }
});
