import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects an unauthenticated visitor to /login', async ({ page }) => {
    await page.goto('/groups');
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows validation errors on empty login submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('lets a new user register and reach the groups dashboard', async ({ page }) => {
    const unique = Date.now();
    await page.goto('/register');
    await page.getByLabel('Display name').fill('E2E Test User');
    await page.getByLabel('Username').fill(`e2euser${unique}`);
    await page.getByLabel('Email').fill(`e2e${unique}@example.com`);
    await page.getByLabel('Password').fill('Passw0rd123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/groups/);
  });
});
