import { test, expect } from "@playwright/test";
import { adminUser, basicUser, login, register, createRandomUser } from "./auth";

test("TF-001 — Inscription avec des données valides", async ({ page }) => {
  const user = createRandomUser();
  await register(
    page,
    user.email,
    user.firstName,
    user.lastName,
    user.password,
  );
});

test("TF-002 — Connexion avec des identifiants valides", async ({ page }) => {
  const user = createRandomUser();
  await register(
    page,
    user.email,
    user.firstName,
    user.lastName,
    user.password,
  );
  await login(page, user.email, user.password);
});

  test("TF-003 — Déconnexion réussie", async ({ page }) => {
    const user = createRandomUser();
    await register(
      page,
      user.email,
      user.firstName,
      user.lastName,
      user.password,
    );
    await login(page, user.email, user.password);
    await page.getByTestId('navbar-logout-button').click();
    await expect(page.getByTestId('navbar-login-link')).toBeVisible();
  });

  test("TF-004 — Accès refusé à une page protégée sans session", async ({
    page,
  }) => {
    await page.goto("/account");
    await expect(page).toHaveURL("/auth/login");
  });

  test("TF-005 — Changement de mot de passe réussi", async ({ page }) => {
    const user = createRandomUser();
    await register(
      page,
      user.email,
      user.firstName,
      user.lastName,
      user.password,
    );
    await login(page, user.email, user.password);

    await page.getByTestId("navbar-account-link").click();
    await page.waitForTimeout(1000);

    await page.getByTestId("current-password-input").fill(user.password);
    await page.getByTestId("new-password-input").fill(user.newPassword);
    await page
      .getByTestId("confirm-new-password-input")
      .fill(user.newPassword);

    await page.getByTestId("modify-password-button").click();
    await expect(page.locator(".fr-alert--success")).toBeVisible();
  });

  test("TF-006 — Page admin innaccessible sans droits", async ({ page }) => {
    const user = createRandomUser();
    await register(
      page,
      user.email,
      user.firstName,
      user.lastName,
      user.password,
    );
    await login(page, user.email, user.password);
    await page.goto("/admin");
    await expect(page).toHaveURL("/home");
  });

  test("TF-007 — Page admin", async ({ page }) => {
    await login(page, adminUser.email, adminUser.password);
    await page.goto("/admin");
    await expect(page).toHaveURL("/admin");
  });

  test("TF-008 — Information", async ({ page }) => {
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
    await page.getByRole('button', { name: 'Découvrir' }).click();
    await page.getByRole('button', { name: 'Lire la suite' }).first().click();
    await expect(page.getByRole('heading', { name: 'A propos' })).toBeVisible();
  });
  test("TF-009 — Respiration", async ({ page }) => {
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
    await expect(page.getByRole('heading', { name: 'Introduction -' }).first()).toBeVisible();
  });