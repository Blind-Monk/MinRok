import { test, expect } from '@playwright/test';

test('Frontend UI loads dashboard overview page', async ({ page }) => {
  await page.goto('http://localhost:4200/overview');
  await expect(page.locator('h2')).toContainText('Merchant Dashboard Overview');
});

test('Frontend UI can navigate to Gateways page', async ({ page }) => {
  await page.goto('http://localhost:4200/gateways');
  await expect(page.locator('h2')).toContainText('Gateway Credentials Management');
});

test('Frontend UI can navigate to Documentation page', async ({ page }) => {
  await page.goto('http://localhost:4200/docs');
  await expect(page.locator('h2')).toContainText('Documentation & AI RAG Search');
});
