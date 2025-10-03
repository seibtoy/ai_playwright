import { test, expect } from "@playwright/test";
import { ensureAuthorized } from "../../helpers/save-session";
import { Sidebar } from "../../pages/sidebar-component";

test.describe("Verifies all sidebar components and their behavior when no chats started", () => {
  let sidebar: Sidebar;

  test.beforeEach(async ({ page }) => {
    await ensureAuthorized(page);
    sidebar = new Sidebar(page);
  });

  test.afterEach(async ({ page }) => {
    await ensureAuthorized(page);
  });

  test("Verifies sidebar UI elements", async ({ page }) => {
    await test.step("Check main sidebar links and texts", async () => {
      await expect(sidebar.logoLink).toBeVisible();
      await expect(page.getByText("Strategy & Tools")).toBeVisible();
      await expect(sidebar.takeAssessmentLink).toBeVisible();
      await expect(sidebar.runBusinessLink).toBeVisible();
    });

    await test.step("Check AITP Memory block", async () => {
      await expect(page.getByText("AITP Memory")).toBeVisible();
      await expect(sidebar.importExternalMemoryButton).toBeVisible();
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

    await test.step("Find toggle button", async () => {
      await expect(sidebar.toggleButton).toBeVisible();
    });

    await test.step("Toggle sidebar and validate state", async () => {
      await sidebar.toggleButton.click();
      if (sidebarState === "open") {
        await expect(sidebar.sidebar).toHaveAttribute("data-state", "closed");
        await sidebar.toggleButton.click();
        await expect(sidebar.sidebar).toHaveAttribute("data-state", "open");
      } else {
        await expect(sidebar.sidebar).toHaveAttribute("data-state", "open");
      }
    });
  });

  test("Ensures all sidebar links navigate to the correct pages", async ({
    page,
  }) => {
    await test.step("Logo image redirects to the main page", async () => {
      await sidebar.logoLink.click();
      await expect(page).toHaveURL("/");
    });

    await test.step("Take the Assessment button redirects to proper link", async () => {
      const TaketheAssessmentPagePromise = page.waitForEvent("popup");
      await sidebar.takeAssessmentLink.click();
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
      await sidebar.runBusinessLink.click();
      await expect(page).toHaveURL("/run-the-business");
    });
  });

  test("User settings dropdown menu: UI and navigation test", async ({
    page,
  }) => {
    const theme = await sidebar.getTheme();
    const dropdownState = await sidebar.settingsDropdown.getAttribute(
      "data-state"
    );

    await test.step("Open the user settings dropdown", async () => {
      if (dropdownState === "closed") {
        await sidebar.settingsDropdown.click();
        await expect(sidebar.settingsDropdown).toHaveAttribute(
          "data-state",
          "open"
        );
      } else return;
    });

    await test.step("Toggle theme mode", async () => {
      if (theme === "dark") {
        await page.getByRole("menuitem", { name: "Toggle light mode" }).click();

        const newTheme = await sidebar.getTheme();
        expect(newTheme).toBe("light");
      } else {
        await page.getByRole("menuitem", { name: "Toggle dark mode" }).click();

        const newTheme = await sidebar.getTheme();
        expect(newTheme).toBe("dark");
      }
    });

    await test.step("Terms of Service", async () => {
      await sidebar.clickMenuLinkAndAssertPopup(
        "Terms of Service",
        `${process.env.AI_LEADERSHIP_URL!}/legal/aitp-terms-of-service`
      );
    });

    await test.step("Privacy Policy", async () => {
      await sidebar.clickMenuLinkAndAssertPopup(
        "Privacy Policy",
        `${process.env.AI_LEADERSHIP_URL!}/privacy-policy`
      );
    });

    await test.step("My Account", async () => {
      await sidebar.clickMenuLinkAndAssertRedirect("My Account", "/profile");
    });

    await test.step("Logout", async () => {
      await sidebar.clickMenuLinkAndAssertRedirect("Sign out", "/signin");
    });
  });
});

test.describe("Verifies all sidebar components and their behavior when chats started", () => {
  let sidebar: Sidebar;

  test.beforeEach(async ({ page }) => {
    await ensureAuthorized(page);
    sidebar = new Sidebar(page);
  });

  test("Verifies the chats created in the sidebar", async ({
    page,
  }, testInfo) => {
    const chatMenuButton = page.locator(
      'svg path[d="M4 8C4 8.82843 3.32843 9.5 2.5 9.5C1.67157 9.5 1 8.82843 1 8C1 7.17157 1.67157 6.5 2.5 6.5C3.32843 6.5 4 7.17157 4 8ZM9.5 8C9.5 8.82843 8.82843 9.5 8 9.5C7.17157 9.5 6.5 8.82843 6.5 8C6.5 7.17157 7.17157 6.5 8 6.5C8.82843 6.5 9.5 7.17157 9.5 8ZM13.5 9.5C14.3284 9.5 15 8.82843 15 8C15 7.17157 14.3284 6.5 13.5 6.5C12.6716 6.5 12 7.17157 12 8C12 8.82843 12.6716 9.5 13.5 9.5Z"]'
    );

    await test.step("Check that the sidebar is visible", async () => {
      await expect(sidebar.sidebar).toHaveAttribute("data-state", "open");
    });

    await test.step("Check the input is visible", async () => {
      await expect(sidebar.input).toBeVisible();
    });

    await test.step("Write a prompt in the chat input", async () => {
      await sidebar.sendMessage("Hello", true, testInfo);
    });

    await test.step("Get last chat in the sidebar", async () => {
      await expect(chatMenuButton.first()).toBeVisible();
    });

    await test.step("Check the chat dropdown menu opens", async () => {
      await chatMenuButton.first().click();
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
