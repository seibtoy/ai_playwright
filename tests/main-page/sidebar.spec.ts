import { test, expect } from "@playwright/test";
import { ensureAuthorized } from "../helpers/save-session";

test.describe("Verifies all sidebar components and their behavior when no chats started", () => {
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
        await page.getByRole("menuitem", { name: "Toggle dark mode" }).click();

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
  test.beforeEach(async ({ page }) => {
    await ensureAuthorized(page);
  });

  test("Verifies the chats created in the sidebar", async ({ page }) => {
    const menuButton = page.locator(
      'svg path[d="M4 8C4 8.82843 3.32843 9.5 2.5 9.5C1.67157 9.5 1 8.82843 1 8C1 7.17157 1.67157 6.5 2.5 6.5C3.32843 6.5 4 7.17157 4 8ZM9.5 8C9.5 8.82843 8.82843 9.5 8 9.5C7.17157 9.5 6.5 8.82843 6.5 8C6.5 7.17157 7.17157 6.5 8 6.5C8.82843 6.5 9.5 7.17157 9.5 8ZM13.5 9.5C14.3284 9.5 15 8.82843 15 8C15 7.17157 14.3284 6.5 13.5 6.5C12.6716 6.5 12 7.17157 12 8C12 8.82843 12.6716 9.5 13.5 9.5Z"]'
    );
    const input = page.getByTestId("multimodal-input");
    const sendButton = page.getByTestId("send-button");
    const recordingButton = page.getByRole("button", {
      name: "Start recording",
    });

    await test.step("Check that the sidebar is visible", async () => {
      await expect(
        page.locator('div[data-slot="sidebar-container"]')
      ).toBeVisible();
    });

    await test.step("Check the input is visible", async () => {
      await expect(page.getByTestId("multimodal-input")).toBeVisible();
    });

    await test.step("Write a prompt in the chat input", async () => {
      await input.click();
      await input.fill("Hello");
      await sendButton.click();
      await recordingButton.waitFor({ state: "visible", timeout: 0 });
    });

    await test.step("Get last chat in the sidebar", async () => {
      await expect(menuButton.first()).toBeVisible();
    });

    await test.step("Check the chat dropdown menu opens", async () => {
      await menuButton.first().click();
      await expect(page.getByRole("menu", { name: "More" })).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Rename" })
      ).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Share" })).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Delete" })
      ).toBeVisible();
    });
  });
});
