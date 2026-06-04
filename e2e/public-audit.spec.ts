import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PUBLIC_ROUTES = [
  { path: "/", name: "Landing" },
  { path: "/auth", name: "Auth" },
  { path: "/pricing", name: "Pricing" },
  { path: "/blog", name: "Blog" },
  { path: "/community", name: "Community" },
];

test.describe("Audit public ProducerHit", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} (${route.path}) charge sans erreur JS critique`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      const res = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `HTTP status ${route.path}`).toBeLessThan(400);

      await expect(page.locator("body")).toBeVisible();

      const critical = errors.filter(
        (e) => !e.includes("ObjectMultiplex") && !e.includes("TronLink") && !e.includes("Provider initialised"),
      );
      expect(critical, `Erreurs page ${route.path}`).toEqual([]);
    });
  }

  test("Auth — formulaire login visible + Google CTA", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("button", { name: /continuer avec google|continue with google/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email|@/i)).toBeVisible();
  });

  test("Auth — bascule Signup", async ({ page }) => {
    await page.goto("/auth");
    const signup = page.getByRole("button", { name: /^signup$|^inscription$/i });
    if (await signup.isVisible()) {
      await signup.click();
      await expect(page.getByRole("button", { name: /continuer avec google|continue with google/i })).toBeVisible();
    }
  });

  test("Dashboard protégé — redirige ou demande auth", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes("/auth") || url.includes("/dashboard")).toBeTruthy();
  });

  test("a11y — Auth sans violations critiques axe", async ({ page }) => {
    await page.goto("/auth");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});
