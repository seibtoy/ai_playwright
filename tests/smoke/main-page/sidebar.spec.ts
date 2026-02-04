import { expect, test } from "@playwright/test";
import { URLS } from "@/tests/config/urls";
import { generateEmail } from "@/tests/helpers/generate-email";
import { ChatPage } from "@/tests/pages/chat-page";
import { SigninPage } from "@/tests/pages/signin-page";

test.describe("Verifies all sidebar components and their behavior when no chats started", () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  let sidebar: ChatPage;

  test.beforeEach(async ({ page }) => {
    sidebar = new ChatPage(page);
    await page.goto(`${process.env.BASE_URL}/`);
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

    await test.step("Check if displayed user email is correct", async () => {
      const currentUserInboxName = process.env.MAIN_USER_EMAIL;
      if (!currentUserInboxName) {
        throw new Error("MAIN_USER_EMAIL environment variable is not set");
      }
      await expect(
        page.getByRole("button").filter({ hasText: currentUserInboxName })
      ).toContainText(currentUserInboxName);
    });

    await test.step("Check sidebar menu button", async () => {
      await expect(
        page.locator('button[data-sidebar="menu-button"]', {
          has: page.locator("div.truncate"),
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

    await test.step("Send message to the chat for display the menu", async () => {
      await sidebar.sendMessageViaAPI("Hello");
    });

    await test.step("Find toggle button", async () => {
      await expect(sidebar.toggleButton).toBeVisible();
    });

    await test.step("Toggle sidebar and validate state", async () => {
      await sidebar.toggleButton.click();
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (sidebarState === "open") {
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(sidebar.sidebar).toHaveAttribute("data-state", "closed");
        await sidebar.toggleButton.click();
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(sidebar.sidebar).toHaveAttribute("data-state", "open");
      } else {
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(sidebar.sidebar).toHaveAttribute("data-state", "open");
      }
    });
  });

  test("Ensures all sidebar links navigate to the correct pages", async ({
    page,
  }) => {
    await test.step("Logo image redirects to the main page", async () => {
      await sidebar.logoLink.click();
      await expect(page).toHaveURL(`${process.env.BASE_URL}/`);
    });

    await test.step("Take the Assessment button redirects to proper link", async () => {
      const TaketheAssessmentPagePromise = page.waitForEvent("popup");
      await sidebar.takeAssessmentLink.click();
      const TaketheAssessmentPage = await TaketheAssessmentPagePromise;

      const currentUrl = new URL(TaketheAssessmentPage.url());
      const expectedUrl = new URL(
        `${process.env.AI_LEADERSHIP_URL}/ai-leader-benchmark`
      );

      expect(`${currentUrl.origin}${currentUrl.pathname}`).toBe(
        `${expectedUrl.origin}${expectedUrl.pathname}`
      );

      await TaketheAssessmentPage.close();
    });

    await test.step("Run the Business button redirects to proper link", async () => {
      await sidebar.runBusinessLink.click();
      await expect(page).toHaveURL(`${process.env.BASE_URL}/run-the-business`);
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
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (dropdownState === "closed") {
        await sidebar.settingsDropdown.click();
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(sidebar.settingsDropdown).toHaveAttribute(
          "data-state",
          "open"
        );
      } else return;
    });

    await test.step("Toggle theme mode", async () => {
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (theme === "dark") {
        await page.getByRole("menuitem", { name: "Toggle light mode" }).click();

        const newTheme = await sidebar.getTheme();
        // eslint-disable-next-line playwright/no-conditional-expect
        expect(newTheme).toBe("light");
      } else {
        await page.getByRole("menuitem", { name: "Toggle dark mode" }).click();

        const newTheme = await sidebar.getTheme();
        // eslint-disable-next-line playwright/no-conditional-expect
        expect(newTheme).toBe("dark");
      }
    });

    await test.step("Terms of Service", async () => {
      await sidebar.clickMenuLinkAndAssertPopup(
        "Terms of Service",
        `${process.env.AI_LEADERSHIP_URL}/legal/aitp-terms-of-service`
      );
    });

    await test.step("Privacy Policy", async () => {
      await sidebar.clickMenuLinkAndAssertPopup(
        "Privacy Policy",
        `${process.env.AI_LEADERSHIP_URL}/privacy-policy`
      );
    });

    await test.step("My Account", async () => {
      await sidebar.clickMenuLinkAndAssertRedirect(
        "My Account",
        `${process.env.BASE_URL}/profile`
      );
    });

    await test.step("Logout", async () => {
      await sidebar.clickMenuLinkAndAssertRedirect(
        "Sign out",
        `${process.env.BASE_URL}/signin`
      );
    });
  });
});

test.describe("Verifies all sidebar components and their behavior when chats started", () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });
  let sidebar: ChatPage;

  test.beforeEach(async ({ page }) => {
    sidebar = new ChatPage(page);
    await page.goto(`${process.env.BASE_URL}/`);
  });

  test("Verifies the chats created in the sidebar", async ({ page }) => {
    await test.step("Check that the sidebar is visible", async () => {
      await expect(sidebar.sidebar).toHaveAttribute("data-state", "open");
    });

    await test.step("Check the input is visible", async () => {
      await expect(sidebar.input).toBeVisible();
    });

    await test.step("Write a prompt in the chat input", async () => {
      await sidebar.sendMessage("Hello");
    });

    await test.step("Get last chat in the sidebar", async () => {
      await expect(sidebar.chatActionsDropdown.first()).toBeVisible();
    });

    await test.step("Check the chat dropdown menu opens", async () => {
      await sidebar.chatActionsDropdown.first().click();
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

test.describe("Verifies all sidebar components and their behavior in case when user IS GUEST", () => {
  test.use({ storageState: undefined }); // This test is not supposed to use a storage state

  let sidebar: ChatPage;
  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    sidebar = new ChatPage(page);
    signinPage = new SigninPage(page);

    await signinPage.continueAsGuest(page);
  });

  test("Verifies the sidebar UI elements", async ({ page }) => {
    await expect(page.getByText("Strategy & Tools")).toBeVisible();
    await expect(sidebar.runBusinessLink).toBeVisible();
    await expect(page.getByText("You are using the guest")).toBeVisible();
    await expect(sidebar.createAccountButton).toBeVisible();
    await expect(sidebar.toggleThemeButton).toBeVisible();
  });

  test("Verifies that 'Run the Business' button redirects to the proper page", async ({
    page,
  }) => {
    await sidebar.runBusinessLink.click();
    await expect(page).toHaveURL(`${process.env.BASE_URL}/run-the-business`);
  });

  test("Verifies that theme mode can be toggled", async () => {
    const theme = await sidebar.getTheme();

    // eslint-disable-next-line playwright/no-conditional-in-test
    if (theme === "dark") {
      await sidebar.toggleThemeButton.click();

      const newTheme = await sidebar.getTheme();
      // eslint-disable-next-line playwright/no-conditional-expect
      expect(newTheme).toBe("light");

      await sidebar.toggleThemeButton.click();
      const newNewTheme = await sidebar.getTheme();
      // eslint-disable-next-line playwright/no-conditional-expect
      expect(newNewTheme).toBe("dark");
    } else {
      await sidebar.toggleThemeButton.click();

      const newTheme = await sidebar.getTheme();
      // eslint-disable-next-line playwright/no-conditional-expect
      expect(newTheme).toBe("dark");

      await sidebar.toggleThemeButton.click();
      const newNewTheme = await sidebar.getTheme();
      // eslint-disable-next-line playwright/no-conditional-expect
      expect(newNewTheme).toBe("light");
    }
  });

  test("Verifies that 'Sign in / Create account' button opens the sign in modal and all components are visible", async ({
    page,
  }) => {
    await test.step("Click the 'Sign in / Create account' button and open the sign in modal", async () => {
      await sidebar.createAccountButton.click();
      await expect(
        page.getByRole("dialog", { name: "Sign in to AITP" })
      ).toBeVisible();
    });

    await test.step("Check all components are visible", async () => {
      await expect(page.getByText("Sign in to AITPEnter your")).toBeVisible();
      await expect(page.getByText("Email Address")).toBeVisible();
      await expect(signinPage.emailInput).toBeVisible();
      await expect(signinPage.sendCodeButton).toBeVisible();
      await expect(page.getByText("New here? We'll create your")).toBeVisible();
      await expect(page.getByText("By continuing, you agree to")).toBeVisible();
    });

    await test.step("Check that 'Terms of Service' link leads to the proper page", async () => {
      const newPagePromise = page.waitForEvent("popup");

      await sidebar.termsOfServiceLink.click();
      const newPage = await newPagePromise;

      await expect(newPage).toHaveURL(
        `${process.env.AI_LEADERSHIP_URL}/legal/aitp-terms-of-service`
      );

      await newPage.close();
    });
  });

  test("Verifies that user can sign in with email in 'Sign in / Create account' modal", async () => {
    await test.step("Click the 'Sign in / Create account' button and open the sign in modal", async () => {
      await sidebar.createAccountButton.click();
    });

    // We dont authenticate fully here, to economize mailSlurp API resources
    await test.step("Fill in the email input and click the 'Send code' button", async () => {
      const email = generateEmail();
      await signinPage.emailInput.fill(email);
      await expect(signinPage.sendCodeButton).toBeEnabled();
      await signinPage.sendCodeButton.click();
      await expect(sidebar.verificationCodeInputGroup).toBeVisible();
    });
  });
});