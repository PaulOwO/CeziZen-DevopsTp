import { test, expect } from '@playwright/test';
import { adminUser, login, register, createRandomUser } from './auth';

test('TNR-01 - register', async ({ page }) => {
    await page.goto('auth/register');
    await expect(page).toHaveScreenshot('register.png');
});
test('TNR-02 - login', async ({ page }) => {
    await page.goto('auth/login');
    await expect(page).toHaveScreenshot('login.png');
});
test('TNR-03 - dashboard', async ({ page }) => {
    const user = createRandomUser();
    await register(
        page,
        user.email,
        user.firstName,
        user.lastName,
        user.password,
    );
    await login(page, user.email, user.password);
    await expect(page).toHaveScreenshot('dashboard.png');
});
test('TNR-04 - dashboard admin', async ({ page }) => {
    await login(page, adminUser.email, adminUser.password);
    await expect(page).toHaveScreenshot('dashboard-admin.png');
});
test('TNR-05 - informations', async ({ page }) => {
        const user = createRandomUser();
        await register(
            page,
            user.email,
            user.firstName,
            user.lastName,
            user.password,
        );
        await login(page, user.email, user.password);
        await page.getByRole('button', { name: 'Découvrir' }).click();
        await page.getByRole('button', { name: 'Lire la suite' }).first().click();
        await expect(page).toHaveScreenshot('informations.png');
});
test('TNR-06 - respiration', async ({ page }) => {
        const user = createRandomUser();
        await register(
            page,
            user.email,
            user.firstName,
            user.lastName,
            user.password,
        );
        await login(page, user.email, user.password);
        await page.waitForTimeout(2000);
        await page.getByRole('button', { name: 'Commencer' }).click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'Commencer' }).first().click();
        await expect(page).toHaveScreenshot('respiration.png');
});