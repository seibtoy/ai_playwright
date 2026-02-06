import { expect, test } from "@playwright/test";
import { URLS } from "@/tests/config/urls";
import { generateEmail } from "@/tests/helpers/generate-email";
import { ChatPage } from "@/tests/pages/chat-page";
import { SigninPage } from "@/tests/pages/signin-page";

test.describe("Sidebar: elements without active chat", () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await page.goto(`${process.env.BASE_URL}/`);
  });

  test("Should display sidebar UI elements", async ({ page }) => {
    await test.step("Check main sidebar links and texts", async () => {
      await expect(chatPage.logoLink).toBeVisible();
      await expect(chatPage.meetingOptimizerLink).toBeVisible();
      await expect(chatPage.stratSyncLink).toBeVisible();
      await expect(chatPage.runBusinessLink).toBeVisible();
    });

    await test.step("Check AITP Memory block", async () => {
      await expect(page.getByText("AITP Memory")).toBeVisible();
      await expect(chatPage.importExternalMemoryButton).toBeVisible();
    });

    await test.step("Check if displayed user email is correct", async () => {
      const currentUserInboxName = process.env.MAIN_USER_EMAIL;
      if (!currentUserInboxName) {
        throw new Error("MAIN_USER_EMAIL environment variable is not set");
      }
      await expect(
        page.getByRole("button").filter({ hasText: currentUserInboxName }),
      ).toContainText(currentUserInboxName);
    });

    await test.step("Check sidebar menu button", async () => {
      await expect(
        page.locator('button[data-sidebar="menu-button"]', {
          has: page.locator("div.truncate"),
        }),
      ).toBeVisible();
    });
  });

  test("Should toggle sidebar menu correctly", async ({ page }) => {
    const sidebarState =
      await test.step("Get current sidebar state", async () => {
        return await page
          .locator('div[data-slot="sidebar"]')
          .getAttribute("data-state");
      });

    await test.step("Send message to display the menu", async () => {
      await chatPage.sendMessageViaAPI("Hello");
    });

    await test.step("Find toggle button", async () => {
      await expect(chatPage.toggleButton).toBeVisible();
    });

    await test.step("Toggle sidebar and validate state", async () => {
      await chatPage.toggleButton.click();
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (sidebarState === "open") {
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(chatPage.sidebar).toHaveAttribute("data-state", "closed");
        await chatPage.toggleButton.click();
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(chatPage.sidebar).toHaveAttribute("data-state", "open");
      } else {
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(chatPage.sidebar).toHaveAttribute("data-state", "open");
      }
    });
  });

  test("Should navigate to correct pages via sidebar links", async ({
    page,
  }) => {
    await test.step("Logo image redirects to the main page", async () => {
      await chatPage.logoLink.click();
      await expect(page).toHaveURL(`${process.env.BASE_URL}/`);
    });

    await test.step("Meeting Optimizer button redirects to proper link", async () => {
      await chatPage.meetingOptimizerLink.click();
      await expect(page).toHaveURL(`${process.env.BASE_URL}/meeting-optimizer`);
    });
    await test.step("StratSync button redirects to proper link", async () => {
      await chatPage.stratSyncLink.click();
      await expect(page).toHaveURL(
        `${process.env.BASE_URL}/dashboard/stratsync`,
      );
    });
    await test.step("Run the Business button redirects to proper link", async () => {
      await chatPage.runBusinessLink.click();
      await expect(page).toHaveURL(`${process.env.BASE_URL}/run-the-business`);
    });
  });

  test("Should display and navigate user settings dropdown menu", async ({
    page,
  }) => {
    const theme = await chatPage.getTheme();
    const dropdownState =
      await chatPage.settingsDropdown.getAttribute("data-state");

    await test.step("Open the user settings dropdown", async () => {
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (dropdownState === "closed") {
        await chatPage.settingsDropdown.click();
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(chatPage.settingsDropdown).toHaveAttribute(
          "data-state",
          "open",
        );
      } else return;
    });

    await test.step("Toggle theme mode", async () => {
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (theme === "dark") {
        await page.getByRole("menuitem", { name: "Toggle light mode" }).click();

        const newTheme = await chatPage.getTheme();
        // eslint-disable-next-line playwright/no-conditional-expect
        expect(newTheme).toBe("light");
      } else {
        await page.getByRole("menuitem", { name: "Toggle dark mode" }).click();

        const newTheme = await chatPage.getTheme();
        // eslint-disable-next-line playwright/no-conditional-expect
        expect(newTheme).toBe("dark");
      }
    });

    await test.step("Terms of Service", async () => {
      await chatPage.clickMenuLinkAndAssertPopup(
        "Terms of Service",
        `${process.env.AI_LEADERSHIP_URL}/legal/aitp-terms-of-service`,
      );
    });

    await test.step("Privacy Policy", async () => {
      await chatPage.clickMenuLinkAndAssertPopup(
        "Privacy Policy",
        `${process.env.AI_LEADERSHIP_URL}/privacy-policy`,
      );
    });

    await test.step("My Account", async () => {
      await chatPage.clickMenuLinkAndAssertRedirect(
        "My Account",
        `${process.env.BASE_URL}/profile`,
      );
    });

    await test.step("Logout", async () => {
      await chatPage.clickMenuLinkAndAssertRedirect(
        "Sign out",
        `${process.env.BASE_URL}/signin`,
      );
    });
  });
});

test.describe("Sidebar: elements with active chat", () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await page.goto(`${process.env.BASE_URL}/`);
  });

  test("Should display created chats in the sidebar", async ({ page }) => {
    await test.step("Check that the sidebar is visible", async () => {
      await expect(chatPage.sidebar).toHaveAttribute("data-state", "open");
    });

    await test.step("Check the input is visible", async () => {
      await expect(chatPage.input).toBeVisible();
    });

    await test.step("Write a prompt in the chat input", async () => {
      await chatPage.sendMessage("Hello");
    });

    await test.step("Get last chat in the sidebar", async () => {
      await expect(chatPage.chatActionsDropdown.first()).toBeVisible();
    });

    await test.step("Check the chat dropdown menu opens", async () => {
      await chatPage.chatActionsDropdown.first().click();
      await expect(page.getByRole("menu", { name: "More" })).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Rename" }),
      ).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Share" })).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Delete" }),
      ).toBeVisible();
    });
  });
});

test.describe("Sidebar: guest user elements", () => {
  test.use({ storageState: undefined }); // This test is not supposed to use a storage state

  let chatPage: ChatPage;
  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    signinPage = new SigninPage(page);

    await signinPage.continueAsGuest(page);
  });

  test("Should display guest sidebar UI elements", async ({ page }) => {
    await test.step("Verify guest-specific sidebar elements are visible", async () => {
      await expect(chatPage.runBusinessLink).toBeVisible();
      await expect(page.getByText("You are using the guest")).toBeVisible();
      await expect(chatPage.createAccountButton).toBeVisible();
      await expect(chatPage.toggleThemeButton).toBeVisible();
    });
  });

  test("Should redirect to proper page via 'Run the Business' link", async ({
    page,
  }) => {
    await test.step("Click 'Run the Business' and verify URL", async () => {
      await chatPage.runBusinessLink.click();
      await expect(page).toHaveURL(`${process.env.BASE_URL}/run-the-business`);
    });
  });

  test("Should toggle theme mode", async () => {
    await test.step("Toggle theme and verify it changes", async () => {
      const theme = await chatPage.getTheme();

      // eslint-disable-next-line playwright/no-conditional-in-test
      if (theme === "dark") {
        await chatPage.toggleThemeButton.click();

        const newTheme = await chatPage.getTheme();
        // eslint-disable-next-line playwright/no-conditional-expect
        expect(newTheme).toBe("light");

        await chatPage.toggleThemeButton.click();
        const newNewTheme = await chatPage.getTheme();
        // eslint-disable-next-line playwright/no-conditional-expect
        expect(newNewTheme).toBe("dark");
      } else {
        await chatPage.toggleThemeButton.click();

        const newTheme = await chatPage.getTheme();
        // eslint-disable-next-line playwright/no-conditional-expect
        expect(newTheme).toBe("dark");

        await chatPage.toggleThemeButton.click();
        const newNewTheme = await chatPage.getTheme();
        // eslint-disable-next-line playwright/no-conditional-expect
        expect(newNewTheme).toBe("light");
      }
    });
  });

  test("Should open sign-in modal via 'Sign in / Create account' button", async ({
    page,
  }) => {
    await test.step("Click the 'Sign in / Create account' button and open the sign in modal", async () => {
      await chatPage.createAccountButton.click();
      await expect(
        page.getByRole("dialog", { name: "Sign in to AITP" }),
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

      await chatPage.termsOfServiceLink.click();
      const newPage = await newPagePromise;

      await expect(newPage).toHaveURL(
        `${process.env.AI_LEADERSHIP_URL}/legal/aitp-terms-of-service`,
      );

      await newPage.close();
    });
  });

  test("Should allow sign-in with email via 'Sign in / Create account' modal", async () => {
    await test.step("Click the 'Sign in / Create account' button and open the sign in modal", async () => {
      await chatPage.createAccountButton.click();
    });

    await test.step("Fill in the email input and click the 'Send code' button", async () => {
      const email = generateEmail();
      await signinPage.emailInput.fill(email);
      await expect(signinPage.sendCodeButton).toBeEnabled();
      await signinPage.sendCodeButton.click();
      await expect(chatPage.verificationCodeInputGroup).toBeVisible();
    });
  });
});
