import { expect, test } from "@playwright/test";
import { URLS } from "@/tests/config/urls";
import { generateEmail } from "@/tests/helpers/generate-email";
import { ChatPage } from "@/tests/pages/chat-page";
import { SigninPage } from "@/tests/pages/signin-page";

test.describe("UI elements before email submission", () => {
  test.use({ storageState: undefined }); // This test is not supposed to use a storage state

  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/signin`);
    signinPage = new SigninPage(page);
  });

  test("Verifies the sign-in page elements", async ({ page }) => {
    await expect(page.getByRole("img")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Sign in to AITP" }),
    ).toBeVisible();

    await expect(page.getByText("Enter your email and we'll")).toBeVisible();

    await expect(page.getByText("Email Address")).toBeVisible();

    await expect(signinPage.emailInput).toBeVisible();

    await expect(signinPage.sendCodeButton).toBeVisible();

    await expect(page.getByText("By continuing, you agree to")).toBeVisible();
  });

  test("The 'Terms of Service' link leads to the correct page", async ({
    page,
  }) => {
    await test.step("Terms of Service link redirects to proper link", async () => {
      const termsOfServicePagePromise = page.waitForEvent("popup");
      await signinPage.termsOfServiceLink.click();
      const termsOfServicePage = await termsOfServicePagePromise;

      const currentUrl = new URL(termsOfServicePage.url());
      const expectedUrl = new URL(
        `${process.env.AI_LEADERSHIP_URL}/legal/aitp-terms-of-service`,
      );

      expect(`${currentUrl.origin}${currentUrl.pathname}`).toBe(
        `${expectedUrl.origin}${expectedUrl.pathname}`,
      );

      await termsOfServicePage.close();
    });
  });

  test("The 'Send verification code' button should be inactive until the email is valid.", async () => {
    await expect(signinPage.sendCodeButton).toBeDisabled();

    await signinPage.emailInput.fill("invalid-email-format");
    await expect(signinPage.sendCodeButton).toBeDisabled();

    await signinPage.emailInput.fill(generateEmail());

    await expect(signinPage.sendCodeButton).toBeEnabled();
  });

  test("The 'Continue as guest' button should be visible and active", async ({
    page,
  }) => {
    await expect(signinPage.continueAsGuestButton).toBeVisible();
    await expect(signinPage.continueAsGuestButton).toBeEnabled();
    await expect(page.getByText("Try our AI BTS™ features")).toBeVisible();
  });
});

test.describe("UI elements after email submission", () => {
  test.use({ storageState: undefined }); // This test is not supposed to use a storage state

  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/signin`);
    signinPage = new SigninPage(page);
  });

  test("Shows toast after email submission", async ({ page }) => {
    await signinPage.emailInput.fill(generateEmail());
    await signinPage.sendCodeButton.click();

    await expect(page.getByTestId("toast")).toBeVisible();
  });

  test("Displays verification form after sending code", async ({ page }) => {
    await signinPage.emailInput.fill(generateEmail());
    await signinPage.sendCodeButton.click();

    await expect(page.getByRole("img", { name: "Logo" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Enter verification code" }),
    ).toBeVisible();
    await expect(page.getByText("We've sent a 6-digit code to")).toBeVisible();
    await expect(
      page.getByText("Verification Code", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Didn't receive the code?")).toBeVisible();
    await expect(signinPage.resendCodeButton).toBeVisible();
    await expect(signinPage.useDifferentEmailButton).toBeVisible();
  });

  test('Returns to email input when clicking "Use a different email"', async () => {
    await signinPage.emailInput.fill(generateEmail());
    await signinPage.sendCodeButton.click();
    await signinPage.useDifferentEmailButton.click();
    await expect(signinPage.emailInput).toBeVisible();
  });
});

test.describe("Email verification code API requests", () => {
  test.use({ storageState: undefined }); // This test is not supposed to use a storage state

  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      throw new Error("BASE_URL environment variable is not set");
    }
    await page.goto(`${baseUrl}/signin`);
    signinPage = new SigninPage(page);
  });

  test("Sends a request to /signin when submitting a valid email", async ({
    page,
  }) => {
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      throw new Error("BASE_URL environment variable is not set");
    }

    // Register response listener BEFORE any actions to avoid race condition
    // Use a more specific filter to catch the exact POST request to /signin
    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        const method = response.request().method();
        // Match exact /signin endpoint with POST method
        return (
          (url === `${baseUrl}/signin` || url.endsWith("/signin")) &&
          method === "POST"
        );
      },
      { timeout: 10000 },
    );

    await signinPage.emailInput.fill(generateEmail());
    await signinPage.sendCodeButton.click();

    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Verification Code$/ })
        .nth(1),
    ).toBeVisible();
  });

  test("Resend code button sends request", async ({ page }) => {
    await signinPage.emailInput.fill(generateEmail());
    await signinPage.sendCodeButton.click();

    await expect(signinPage.resendCodeButton).toBeVisible();

    await expect(signinPage.resendCodeButton).toBeEnabled({ timeout: 25000 });

    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      throw new Error("BASE_URL environment variable is not set");
    }

    // Register response listener BEFORE clicking to avoid race condition
    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        const method = response.request().method();
        // Match exact /signin endpoint with POST method
        return (
          (url === `${baseUrl}/signin` || url.endsWith("/signin")) &&
          method === "POST"
        );
      },
      { timeout: 10000 },
    );

    await signinPage.resendCodeButton.click();

    const response = await responsePromise;
    expect(response.ok()).toBe(true);
  });
});

test.describe("Smoke check log out", () => {
  test.use({ storageState: undefined }); // This test is not supposed to use a storage state

  let sidebar: ChatPage;

  test.beforeEach(async ({ page }) => {
    sidebar = new ChatPage(page);
  });

  test("Check if user is logged in after closing the app", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: URLS.STORAGE_STATE_MAIN_USER,
    });
    try {
      const page = await context.newPage();

      await test.step("Close the app", async () => {
        await page.close();
      });

      await test.step("Open the app again and check if user is logged in", async () => {
        const newPage = await context.newPage();
        await newPage.goto(`${process.env.BASE_URL}/`);
        await expect(newPage).toHaveURL(`${process.env.BASE_URL}/`);
      });
    } finally {
      await context.close();
    }
  });

  test("Check if user is logged out after closing the app after logout", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: URLS.STORAGE_STATE_MAIN_USER,
    });
    try {
      let page = await context.newPage();

      await test.step("Close the app", async () => {
        await page.close();
      });

      await test.step("Open the app again and check if user is logged in", async () => {
        page = await context.newPage();
        sidebar = new ChatPage(page);
        await page.goto(`${process.env.BASE_URL}/`);
        await expect(page).toHaveURL(`${process.env.BASE_URL}/`);
      });

      await test.step("Logout", async () => {
        await sidebar.clickMenuLinkAndAssertRedirect(
          "Sign out",
          `${process.env.BASE_URL}/signin`,
        );
        await expect(page).toHaveURL(`${process.env.BASE_URL}/signin`);
      });

      await test.step("Close the app", async () => {
        await page.close();
      });

      await test.step("Open the app again and check if user is logged out", async () => {
        page = await context.newPage();
        sidebar = new ChatPage(page);
        await page.goto(`${process.env.BASE_URL}/`);
        await expect(page).toHaveURL(`${process.env.BASE_URL}/signin`);
      });
    } finally {
      await context.close();
    }
  });
});

test.describe("Continue as guest", () => {
  test.use({ storageState: undefined }); // This test is not supposed to use a storage state

  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/signin`);
    signinPage = new SigninPage(page);
  });

  test("Should redirect to the main page after clicking the 'Continue as guest' button", async ({
    page,
  }) => {
    await signinPage.continueAsGuest(page);
    await expect(page).toHaveURL(`${process.env.BASE_URL}/`);
  });
});
