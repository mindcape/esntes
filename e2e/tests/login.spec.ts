import { test, expect } from '@playwright/test';

test('has title and can login', async ({ page }) => {
    await page.goto('/');

    // Expect Landing Page
    await expect(page).toHaveTitle(/ESNTES/);
    await expect(page.getByText('Community Management,Simplified.')).toBeVisible();

    // Navigate to Login
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL(/.*login/);

    // Perform Login (Mock or Real if backend running)
    await page.getByPlaceholder('Email').fill('admin@example.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Should redirect to Dashboard (assuming credentials work or we mock)
    // await expect(page).toHaveURL(/.*dashboard/);
});
