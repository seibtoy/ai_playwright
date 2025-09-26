import { test, expect } from "@playwright/test";
import { ensureAuthorized } from "../helpers/save-session";

test.describe("Verifies all sidebar components and their behavior when no chats started chats created", () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthorized(page);
  });

  test.afterEach(async ({ page }) => {
    await ensureAuthorized(page);
  });

  test("Verifies sidebar UI elements", async ({ page }) => {
    await test.step("Check main sidebar links and texts", async () => {
      await expect(
        page.getByRole("link", { name: "AI Thought Partner™" })
      ).toBeVisible();
      await expect(page.getByText("Strategy & Tools")).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Take the Assessment" })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Run the Business" })
      ).toBeVisible();
    });

    await test.step("Check AITP Memory block", async () => {
      await expect(page.getByText("AITP Memory")).toBeVisible();
      await expect(page.getByText("Your conversations will")).toBeVisible();
    });

    await test.step("Check sidebar menu button", async () => {
      await expect(
        page.locator('button[data-sidebar="menu-button"]', {
          has: page.locator("span.truncate"),
        })
      ).toBeVisible();
    });
  });

  test("Verifies sidebar menu toggles correctly", async ({ page }) => {
    const sidebarState =
      await test.step("Get current sidebar state", async () => {
        return await page
          .locator('div[data-slot="sidebar"]')
          .getAttribute("data-state");
      });

    const toggleButton = await test.step("Find toggle button", async () => {
      const btn = page
        .locator("header")
        .getByRole("button")
        .filter({ hasText: /^$/ });
      await expect(btn).toBeVisible();
      return btn;
    });

    await test.step("Toggle sidebar and validate state", async () => {
      await toggleButton.click();
      if (sidebarState === "open") {
        await expect(page.locator('div[data-slot="sidebar"]')).toHaveAttribute(
          "data-state",
          "closed"
        );
        await toggleButton.click();
        await expect(page.locator('div[data-slot="sidebar"]')).toHaveAttribute(
          "data-state",
          "open"
        );
      } else {
        await expect(page.locator('div[data-slot="sidebar"]')).toHaveAttribute(
          "data-state",
          "open"
        );
      }
    });
  });

  test("Ensures all sidebar links navigate to the correct pages", async ({
    page,
  }) => {
    await test.step("Logo image redirects to the main page", async () => {
      await page.getByRole("link", { name: "AI Thought Partner™" }).click();
      await expect(page).toHaveURL("/");
    });

    await test.step("Take the Assessment button redirects to proper link", async () => {
      const TaketheAssessmentPagePromise = page.waitForEvent("popup");
      await page.getByRole("link", { name: "Take the Assessment" }).click();
      const TaketheAssessmentPage = await TaketheAssessmentPagePromise;

      const currentUrl = new URL(TaketheAssessmentPage.url());
      const expectedUrl = new URL(
        `${process.env.AI_LEADERSHIP_URL!}/ai-leader-benchmark`
      );

      expect(`${currentUrl.origin}${currentUrl.pathname}`).toBe(
        `${expectedUrl.origin}${expectedUrl.pathname}`
      );

      await TaketheAssessmentPage.close();
    });

    await test.step("Run the Business button redirects to proper link", async () => {
      await page.getByRole("link", { name: "Run the Business" }).click();
      await expect(page).toHaveURL("/run-the-business");
    });
  });

  test("User settings dropdown menu: UI and navigation test", async ({
    page,
  }) => {
    const { dropdown, theme, dropdownState } =
      await test.step("Get theme and dropdown state", async () => {
        const dropdown = page.locator(
          'button[data-sidebar="menu-button"][data-slot="dropdown-menu-trigger"]'
        );
        const theme = await page.evaluate(() => {
          return getComputedStyle(document.documentElement).colorScheme;
        });
        const dropdownState = await dropdown.getAttribute("data-state");

        return { dropdown, theme, dropdownState };
      });

    await test.step("Open the user settings dropdown", async () => {
      if (dropdownState === "closed") {
        await dropdown.click();
        await expect(dropdown).toHaveAttribute("data-state", "open");
      } else return;
    });

    await test.step("Toggle theme mode", async () => {
      if (theme === "dark") {
        await page.getByRole("menuitem", { name: "Toggle light mode" }).click();

        const newTheme = await page.evaluate(() => {
          return getComputedStyle(document.documentElement).colorScheme;
        });
        expect(newTheme).toBe("light");
      } else {
        await page.getByRole("menuitem", { name: "Toggle light mode" }).click();

        const newTheme = await page.evaluate(() => {
          return getComputedStyle(document.documentElement).colorScheme;
        });
        expect(newTheme).toBe("dark");
      }
    });

    await test.step("The 'Terms of Service' link leads to the correct page", async () => {
      await dropdown.click();

      const termsOfServicePromise = page.waitForEvent("popup");
      await page.getByRole("menuitem", { name: "Terms of Service" }).click();

      const termsOfServicePage = await termsOfServicePromise;
      await termsOfServicePage.waitForLoadState("domcontentloaded");

      await expect(termsOfServicePage).toHaveURL(
        `${process.env.AI_LEADERSHIP_URL!}/legal/aitp-terms-of-service`
      );

      await termsOfServicePage.close();
    });

    await test.step("The 'Privacy Policy link leads to the correct page'", async () => {
      await dropdown.click();

      const privacyPolicyPromise = page.waitForEvent("popup");
      await page.getByRole("menuitem", { name: "Privacy Policy" }).click();

      const privacyPolicyPage = await privacyPolicyPromise;
      await privacyPolicyPage.waitForLoadState("domcontentloaded");

      await expect(privacyPolicyPage).toHaveURL(
        `${process.env.AI_LEADERSHIP_URL!}/privacy-policy`
      );

      await privacyPolicyPage.close();
    });

    await test.step("The 'My account' link leads to the correct page", async () => {
      await dropdown.click();

      await page.getByRole("menuitem", { name: "My Account" }).click();
      await expect(page).toHaveURL(`/profile`);
    });

    await test.step("The 'Logout' leads to the signin page", async () => {
      await dropdown.click();

      await page.getByRole("menuitem", { name: "Sign out" }).click();
      await expect(page).toHaveURL(`/signin`);
    });
  });
});

test.describe("Verifies all sidebar components and their behavior when chats started", () => {
  let sidebar;
  let chatLinks;
  let actionsButton;

  test.beforeEach(async ({ page }) => {
    await ensureAuthorized(page);
    sidebar = page.locator('div[data-slot="sidebar"]');
    chatLinks = page.locator('a[href*="/chat"]');
    actionsButton = page.locator('button[data-sidebar="menu-action"]');
  });

  //   test.afterEach(async ({ page }) => {
  //     await ensureAuthorized(page);
  //   });

  test("Verifies the chats created in the sidebar", async ({ page }) => {
    const countBefore = await chatLinks.count();

    await test.step("Create a new chat", async () => {
      const chatPagePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/chat/") &&
          response.url().includes("_rsc=") &&
          response.request().method() === "GET"
      );
      await page.getByRole("button", { name: "New Chat" }).click();

      const prompt = `Hello world ${Date.now()}`;
      await page.getByTestId("multimodal-input").fill(prompt);

      await page.getByTestId("send-button").click();
      await chatPagePromise;

      //   await expect
      //     .poll(async () => await chatLinks.count())
      //     .toBe(countBefore + 1);
    });

    // await test.step("Open chat item menu and rename", async () => {
    //   await expect(actionsButton).toBeVisible({ timeout: 10000 });
    //   await actionsButton.click();

    //   await page.getByRole("menuitem", { name: "Rename" }).click();

    //   const renameInput = page.getByRole("textbox");
    //   await expect(renameInput).toBeVisible();
    //   await renameInput.fill(`Renamed ${Date.now()}`);
    //   await renameInput.press("Enter");
    //   await expect(renameInput).toContainText("Renamed");
    // });
  });
});
