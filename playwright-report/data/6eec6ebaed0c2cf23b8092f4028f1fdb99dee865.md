# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authenticated.spec.ts >> Parcours authentifié >> login email → dashboard → mon espace stable
- Location: e2e\authenticated.spec.ts:22:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/mon espace|my workspace/i)
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByText(/mon espace|my workspace/i)

```

```yaml
- status "Loading…":
  - paragraph: Loading…
  - paragraph: Setting up your studio
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | /**
  4  |  * Scénario authentifié — compte test Supabase (email/password).
  5  |  * Variables : E2E_TEST_EMAIL, E2E_TEST_PASSWORD (voir .env)
  6  |  */
  7  | const email = process.env.E2E_TEST_EMAIL;
  8  | const password = process.env.E2E_TEST_PASSWORD;
  9  | 
  10 | async function loginWithEmail(page: import("@playwright/test").Page) {
  11 |   await page.goto("/auth?mode=login");
  12 |   await page.locator("#auth-email").fill(email!);
  13 |   await page.locator("#auth-password").fill(password!);
  14 |   await expect(page.locator("form button[type='submit']")).toHaveText(/^login$|^connexion$/i);
  15 |   await page.locator("form button[type='submit']").click();
  16 |   await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  17 | }
  18 | 
  19 | test.describe("Parcours authentifié", () => {
  20 |   test.skip(!email || !password, "Définir E2E_TEST_EMAIL et E2E_TEST_PASSWORD pour ce test");
  21 | 
  22 |   test("login email → dashboard → mon espace stable", async ({ page }) => {
  23 |     await loginWithEmail(page);
> 24 |     await expect(page.getByText(/mon espace|my workspace/i)).toBeVisible({ timeout: 20_000 });
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  25 |     await page.waitForTimeout(5000);
  26 |     await expect(page.getByText(/chargement de tes créations|loading your creations/i)).toHaveCount(0);
  27 |   });
  28 | 
  29 |   test("settings — sauvegarde username", async ({ page }) => {
  30 |     await loginWithEmail(page);
  31 | 
  32 |     await page.goto("/settings#pk-settings-profile");
  33 |     await expect(page.getByText(/loading profile|chargement du profil/i)).toHaveCount(0, { timeout: 20_000 });
  34 | 
  35 |     const usernameField = page.locator("#settings-username");
  36 |     await expect(usernameField).toBeEnabled({ timeout: 20_000 });
  37 | 
  38 |     const testName = `e2e${Date.now().toString().slice(-8)}`;
  39 |     await usernameField.click();
  40 |     await usernameField.fill("");
  41 |     await usernameField.pressSequentially(testName, { delay: 20 });
  42 |     await expect(usernameField).toHaveValue(testName);
  43 | 
  44 |     const saveBtn = page.getByRole("button", { name: /sauvegarder le profil|save profile/i });
  45 |     await expect(saveBtn).toBeEnabled();
  46 |     await saveBtn.scrollIntoViewIfNeeded();
  47 |     await saveBtn.click();
  48 |     await expect(async () => {
  49 |       await page.reload();
  50 |       await page.goto("/settings#pk-settings-profile");
  51 |       await expect(page.locator("#settings-username")).toHaveValue(testName);
  52 |     }).toPass({ timeout: 45_000 });
  53 |   });
  54 | });
  55 | 
```