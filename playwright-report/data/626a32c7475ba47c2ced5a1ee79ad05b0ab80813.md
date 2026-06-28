# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authenticated.spec.ts >> Parcours authentifié >> settings — sauvegarde username
- Location: e2e\authenticated.spec.ts:29:3

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  locator('#settings-username')
Expected: "e2e48139381"
Received: "e2e47728427"
Timeout:  15000ms

Call log:
  - Expect "toHaveValue" with timeout 15000ms
  - waiting for locator('#settings-username')
    26 × locator resolved to <input value="e2e47728427" id="settings-username" placeholder="your_handle" aria-label="Public username" trae-inspector-end-line="231" trae-inspector-end-column="18" trae-inspector-start-line="223" trae-inspector-start-column="16" trae-inspector-file-path="src\\pages\\Settings.tsx" class="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent" trae-inspector-static-props="%7B%22cwd%22%3A%22C%3A%5C%5CUsers%5C%5Cdylar%5C%5CDocuments%5C%5CProdu…/>
       - unexpected value "e2e47728427"


Call Log:
- Timeout 45000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e6]:
  - generic [ref=e10]:
    - generic [ref=e11]:
      - link "Generator" [ref=e12] [cursor=pointer]:
        - /url: /dashboard
        - img [ref=e14]
      - link "Library" [ref=e16] [cursor=pointer]:
        - /url: /library
        - img [ref=e18]
      - link "Discover" [ref=e20] [cursor=pointer]:
        - /url: /community
        - img [ref=e22]
      - link "Settings" [ref=e27] [cursor=pointer]:
        - /url: /settings
        - img [ref=e29]
      - link "Website" [ref=e32] [cursor=pointer]:
        - /url: /?home=1
        - img [ref=e34]
    - generic [ref=e37]:
      - button "Prism theme (moon) — switch to Warm Glass" [ref=e38] [cursor=pointer]:
        - img [ref=e39]
      - button "English" [ref=e41] [cursor=pointer]: EN
      - button "Français" [ref=e42] [cursor=pointer]: FR
      - button "Logout" [ref=e43] [cursor=pointer]:
        - img [ref=e44]
  - generic [ref=e49]:
    - banner [ref=e50]:
      - generic [ref=e51]:
        - generic [ref=e52]:
          - generic [ref=e53]: E2
          - generic [ref=e54]:
            - paragraph [ref=e55]: Personal space
            - heading "e2e47728427" [level=1] [ref=e56]
            - paragraph [ref=e57]: test@producerhit.com
            - generic [ref=e58]:
              - generic [ref=e59]:
                - img [ref=e60]
                - text: free
              - link "Public profile →" [ref=e62] [cursor=pointer]:
                - /url: /u/e2e47728427
        - generic [ref=e63]:
          - generic "23 generations left of 24" [ref=e64]:
            - generic [ref=e65]:
              - generic [ref=e66]: "23"
              - generic [ref=e67]: left
          - generic [ref=e68]:
            - generic [ref=e69]:
              - img [ref=e70]
              - generic [ref=e72]: 1/24 this month
            - link "Upgrade" [ref=e73] [cursor=pointer]:
              - /url: /pricing
      - navigation "Settings sections" [ref=e74]:
        - button "Profile" [ref=e75] [cursor=pointer]
        - button "Progress" [ref=e76] [cursor=pointer]
        - button "Referral" [ref=e77] [cursor=pointer]
        - button "Plan" [ref=e78] [cursor=pointer]
        - button "Security" [ref=e79] [cursor=pointer]
    - generic [ref=e83]:
      - generic [ref=e84]:
        - generic [ref=e85]:
          - generic [ref=e86]: Progress
          - generic [ref=e87]: Level · streak · daily bonus
        - button "Collapse" [expanded] [ref=e88] [cursor=pointer]:
          - img [ref=e89]
          - text: Collapse
      - generic [ref=e91]:
        - generic [ref=e92]:
          - generic [ref=e93]:
            - generic [ref=e96]: "1"
            - generic [ref=e97]:
              - generic [ref=e98]:
                - generic [ref=e99]: Level 1Beginner
                - generic [ref=e100]: 10 / 80 XP
              - paragraph [ref=e103]: Beginner · 70 XP to lv. 2 (+2 gen)
          - generic [ref=e104]:
            - generic [ref=e105]:
              - img [ref=e107]
              - generic [ref=e109]:
                - generic [ref=e110]: At level 2
                - generic [ref=e111]: +2 gen
            - generic [ref=e112]:
              - img [ref=e114]
              - generic [ref=e116]:
                - generic [ref=e117]: Streak
                - generic [ref=e118]: 1 day
            - generic [ref=e119]:
              - img [ref=e121]
              - generic [ref=e127]:
                - generic [ref=e128]: Trophies
                - generic [ref=e130]: "0"
            - button "Daily bonus" [ref=e131] [cursor=pointer]:
              - img [ref=e132]
              - text: Daily bonus
        - generic [ref=e136]:
          - img [ref=e137]
          - paragraph [ref=e139]: Your daily bonus is ready — claim +1 free generation
    - generic [ref=e140]:
      - generic [ref=e141]:
        - generic [ref=e142]:
          - img [ref=e144]
          - generic [ref=e147]:
            - generic [ref=e148]: Profile
            - generic [ref=e149]: Your studio identity
        - generic [ref=e150]:
          - generic [ref=e151]:
            - generic [ref=e152]: Public username
            - textbox "Public username" [ref=e153]:
              - /placeholder: your_handle
              - text: e2e47728427
            - generic [ref=e154]: 3–24 chars · letters, numbers, _ · shown on your public tracks
            - link "View public profile →" [ref=e155] [cursor=pointer]:
              - /url: /u/e2e47728427
          - generic [ref=e156]:
            - generic [ref=e157]: Creator type
            - generic [ref=e158]:
              - button "Creator type" [ref=e159] [cursor=pointer]: Choose…
              - img
          - generic [ref=e160]:
            - generic [ref=e161]: Bio
            - textbox "Beatmaker, artist, TikTok…" [ref=e162]
            - generic [ref=e163]: 0/280
          - generic [ref=e164]:
            - generic [ref=e165]:
              - generic [ref=e166]: Instagram
              - textbox "@handle" [ref=e167]
            - generic [ref=e168]:
              - generic [ref=e169]: TikTok
              - textbox "@handle" [ref=e170]
            - generic [ref=e171]:
              - generic [ref=e172]: YouTube
              - textbox "@channel" [ref=e173]
            - generic [ref=e174]:
              - generic [ref=e175]: X
              - textbox "@handle" [ref=e176]
            - generic [ref=e177]:
              - generic [ref=e178]: Website
              - textbox "https://…" [ref=e179]
          - generic [ref=e180]:
            - generic [ref=e181]: Email
            - textbox [ref=e182]: test@producerhit.com
        - button "Save profile" [ref=e184] [cursor=pointer]
      - generic [ref=e185]:
        - generic [ref=e186]:
          - generic [ref=e187]:
            - img [ref=e189]
            - generic [ref=e195]:
              - generic [ref=e196]: Appearance
              - generic [ref=e197]: Studio theme
          - generic [ref=e198]:
            - paragraph [ref=e199]: Prism — cyan, violet, chrome.
            - generic [ref=e200]:
              - button "Prism" [pressed] [ref=e201] [cursor=pointer]:
                - generic [ref=e202]:
                  - img [ref=e203]
                  - text: Prism
              - button "Warm Glass" [ref=e205] [cursor=pointer]:
                - generic [ref=e206]:
                  - img [ref=e207]
                  - text: Warm Glass
        - generic [ref=e213]:
          - generic [ref=e214]:
            - img [ref=e216]
            - generic [ref=e218]:
              - generic [ref=e219]: Subscription
              - generic [ref=e220]: Plan & billing
          - generic [ref=e222]:
            - img [ref=e223]
            - text: free
          - generic [ref=e225]:
            - generic [ref=e226]: HD exports
            - generic [ref=e227]: Cloud
            - generic [ref=e228]: Community
          - link "Upgrade" [ref=e230] [cursor=pointer]:
            - /url: /pricing
            - button "Upgrade" [ref=e231]
      - generic [ref=e232]:
        - generic [ref=e233]:
          - img [ref=e235]
          - generic [ref=e237]:
            - generic [ref=e238]: Referral program
            - generic [ref=e239]: +20 for you · 20 for them
        - generic [ref=e240]:
          - paragraph [ref=e241]: How it works
          - list [ref=e242]:
            - listitem [ref=e243]: Share your link — 20 generations on signup.
            - listitem [ref=e244]: You get +20 gen per signup.
        - generic [ref=e246]: Levels +14
        - generic [ref=e247]:
          - generic [ref=e248]:
            - generic [ref=e249]: Invite link
            - textbox [ref=e250]: http://localhost:5174/auth?utm_source=referral&utm_medium=referral&utm_campaign=invite&ref=6676b1f1
          - button "Copy" [ref=e251] [cursor=pointer]
        - generic [ref=e252]: "Code: 6676b1f1"
      - generic [ref=e253]:
        - generic [ref=e254]:
          - img [ref=e256]
          - generic [ref=e261]:
            - generic [ref=e262]: Discord
            - generic [ref=e263]: Challenges · bonus credits · FR/ES/PT lounges
        - generic [ref=e264]:
          - link "Join" [ref=e265] [cursor=pointer]:
            - /url: https://discord.gg/74GX6rwsE2?utm_source=producerhit&utm_medium=discord&utm_campaign=settings
          - link "Hub" [ref=e266] [cursor=pointer]:
            - /url: /community
      - generic [ref=e267]:
        - generic [ref=e268]:
          - img [ref=e270]
          - generic [ref=e272]:
            - generic [ref=e273]: Account & security
            - generic [ref=e274]: Sign-in, password, session
        - generic [ref=e275]:
          - generic [ref=e276]:
            - generic [ref=e277]: Email ✓
            - generic [ref=e278]: Google —
          - button "Link Google" [ref=e280] [cursor=pointer]
        - generic [ref=e281]:
          - generic [ref=e282]:
            - button "Change password" [ref=e283] [cursor=pointer]
            - button "Delete account" [ref=e284] [cursor=pointer]
            - button "Sign out" [ref=e285] [cursor=pointer]:
              - img [ref=e286]
              - text: Sign out
          - paragraph [ref=e289]: Account deletion is manual (MVP).
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
  24 |     await expect(page.getByText(/mon espace|my workspace/i)).toBeVisible({ timeout: 20_000 });
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
> 52 |     }).toPass({ timeout: 45_000 });
     |        ^ Error: expect(locator).toHaveValue(expected) failed
  53 |   });
  54 | });
  55 | 
```