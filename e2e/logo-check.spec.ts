import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('capture header logo and diagnose src', async ({ page }) => {
  // Login
  await page.goto('http://localhost:4201/auth/login');
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  await page.fill('input[name="email"]', 'admin@ictcore.org');
  await page.fill('input[name="password"]', 'helloAdmin');

  // The login button is nbButton with no type="submit" — click by text
  await page.click('button:has-text("Sign In")');

  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForTimeout(3000);

  // Screenshot full page (header area is at top)
  await page.screenshot({ path: 'e2e/screenshots/header-full.png', fullPage: false });

  // Find the header logo img
  const logoImg = page.locator('.logo-container img, .header-container img').first();
  const src = await logoImg.getAttribute('src');
  console.log('LOGO SRC:', src);

  // Screenshot just the top-left
  await page.screenshot({
    path: 'e2e/screenshots/logo-element.png',
    clip: { x: 0, y: 0, width: 300, height: 80 },
  });

  // Fetch the actual image being served
  const imgSrc = src || '';
  if (imgSrc) {
    const url = imgSrc.startsWith('http') ? imgSrc : `http://localhost:4201/${imgSrc.replace(/^\//, '')}`;
    console.log('FETCHING:', url);
    const resp = await page.request.get(url);
    console.log('IMAGE RESPONSE STATUS:', resp.status());
    console.log('IMAGE CONTENT-TYPE:', resp.headers()['content-type']);
    const body = await resp.body();
    console.log('IMAGE BYTES:', body.length);
    fs.writeFileSync('e2e/screenshots/logo-served.png', body);
  }

  expect(src).toBeTruthy();
});
