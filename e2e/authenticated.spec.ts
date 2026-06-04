import { test, expect } from "@playwright/test";

/**
 * Scénario complet — nécessite un compte test (Google ou email).
 * Variables : E2E_TEST_EMAIL, E2E_TEST_PASSWORD (optionnel si session storage pré-rempli).
 *
 * Exemple :
 *   E2E_TEST_EMAIL=test@example.com E2E_TEST_PASSWORD=secret npx playwright test e2e/authenticated.spec.ts
 */
const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test.describe("Parcours authentifié", () => {
  test.skip(!email || !password, "Définir E2E_TEST_EMAIL et E2E_TEST_PASSWORD pour ce test");

  test("login email → dashboard → mon espace stable", async ({ page }) => {
    await page.goto("/auth");
    const loginTab = page.getByRole("button", { name: /^login$|^connexion$/i });
    if (await loginTab.isVisible()) await loginTab.click();

    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password|mot de passe/i).fill(password!);
    await page.getByRole("button", { name: /^login$|^connexion$/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    await expect(page.getByText(/mon espace|my space/i)).toBeVisible({ timeout: 20_000 });

    // Pas de boucle skeleton : après 5s, soit empty state soit tracks
    await page.waitForTimeout(5000);
    const loadingCards = page.getByText(/chargement de tes créations|loading your creations/i);
    await expect(loadingCards).toHaveCount(0);
  });

  test("settings — sauvegarde username", async ({ page }) => {
    test.skip(!email || !password, "Credentials requis");

    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password|mot de passe/i).fill(password!);
    await page.getByRole("button", { name: /^login$|^connexion$/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    await page.goto("/settings");
    await expect(page.getByText(/username|nom d'utilisateur/i).first()).toBeVisible({ timeout: 15_000 });

    const usernameInput = page.locator('input').filter({ has: page.locator("xpath=..") }).first();
    const field = page.getByRole("textbox").nth(1);
    const testName = `test${Date.now().toString().slice(-6)}`;
    if (await field.isVisible()) {
      await field.fill(testName);
      await page.getByRole("button", { name: /sauvegarder|save profile/i }).click();
      await expect(page.getByText(/profil sauvegardé|profile saved/i)).toBeVisible({ timeout: 15_000 });
    }
  });
});
