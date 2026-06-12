import { test, expect } from "@playwright/test";

/**
 * Scénario authentifié — compte test Supabase (email/password).
 * Variables : E2E_TEST_EMAIL, E2E_TEST_PASSWORD (voir .env)
 */
const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

async function loginWithEmail(page: import("@playwright/test").Page) {
  await page.goto("/auth?mode=login");
  await page.locator("#auth-email").fill(email!);
  await page.locator("#auth-password").fill(password!);
  await expect(page.locator("form button[type='submit']")).toHaveText(/^login$|^connexion$/i);
  await page.locator("form button[type='submit']").click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

test.describe("Parcours authentifié", () => {
  test.skip(!email || !password, "Définir E2E_TEST_EMAIL et E2E_TEST_PASSWORD pour ce test");

  test("login email → dashboard → mon espace stable", async ({ page }) => {
    await loginWithEmail(page);
    await expect(page.getByText(/setting up your studio|configuration de ton studio|loading…|chargement/i)).toHaveCount(0, {
      timeout: 60_000,
    });
    await expect(page.getByText(/mon espace|my workspace/i)).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(5000);
    await expect(page.getByText(/chargement de tes créations|loading your creations/i)).toHaveCount(0);
  });

  test("settings — sauvegarde username", async ({ page }) => {
    await loginWithEmail(page);

    await page.goto("/settings#pk-settings-profile");
    await expect(page.getByText(/loading profile|chargement du profil/i)).toHaveCount(0, { timeout: 20_000 });

    const usernameField = page.locator("#settings-username");
    await expect(usernameField).toBeEnabled({ timeout: 20_000 });

    const testName = `e2e${Date.now().toString().slice(-8)}`;
    await usernameField.click();
    await usernameField.fill("");
    await usernameField.pressSequentially(testName, { delay: 20 });
    await expect(usernameField).toHaveValue(testName);

    const saveBtn = page.getByRole("button", { name: /sauvegarder le profil|save profile/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();
    await expect(async () => {
      await page.reload();
      await page.goto("/settings#pk-settings-profile");
      await expect(page.locator("#settings-username")).toHaveValue(testName);
    }).toPass({ timeout: 45_000 });
  });
});
