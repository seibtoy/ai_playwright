import { test, expect } from "@playwright/test";
import { generateEmail } from "@/tests/helpers/generate-email";
import { AuthHelper } from "@/tests/helpers/save-session";
import { SigninPage } from "@/tests/pages/signin-page";
import { ChatPage } from "@/tests/pages/chat-page";
import { URLS } from "@/tests/config/urls";

test.describe("UI elements before email submission", () => {
  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    await page.goto(`${URLS.BASE_URL}/signin`);
    signinPage = new SigninPage(page);
  });

  test("Verifies the sign-in page elements", async ({ page }) => {
    await expect(page.getByRole("img")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Sign in to AITP" })
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
    const newPagePromise = page.waitForEvent("popup");

    await signinPage.termsOfServiceLink.click();

    const newPage = await newPagePromise;

    await expect(newPage).toHaveURL(
      `${URLS.AI_LEADERSHIP_URL}/legal/aitp-terms-of-service`
    );

    await newPage.close();
  });

  test("The 'Send verification code' button should be inactive until the email is valid.", async ({
    page,
  }) => {
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
  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    await page.goto(`${URLS.BASE_URL}/signin`);
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

    await expect(page.getByRole("img").nth(1)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Enter verification code" })
    ).toBeVisible();
    await expect(page.getByText("We've sent a 6-digit code to")).toBeVisible();
    await expect(
      page.getByText("Verification Code", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("Didn't receive the code?")).toBeVisible();
    await expect(signinPage.resendCodeButton).toBeVisible();
    await expect(signinPage.useDifferentEmailButton).toBeVisible();
  });

  test('Returns to email input when clicking "Use a different email"', async ({
    page,
  }) => {
    await signinPage.emailInput.fill(generateEmail());
    await signinPage.sendCodeButton.click();
    await signinPage.useDifferentEmailButton.click();
    await expect(signinPage.emailInput).toBeVisible();
  });
});

test.describe("Email verification code API requests", () => {
  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    await page.goto(`${URLS.BASE_URL}/signin`);
    signinPage = new SigninPage(page);
  });

  test("Sends a request to /signin when submitting a valid email", async ({
    page,
  }) => {
    await signinPage.emailInput.fill(generateEmail());
    const responsePromise = page.waitForResponse("**/signin");

    await signinPage.sendCodeButton.click();

    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Verification Code$/ })
        .nth(1)
    ).toBeVisible();
  });
  test("Resend code button sends request", async ({ page }) => {
    await signinPage.emailInput.fill(generateEmail());
    await signinPage.sendCodeButton.click();

    await expect(signinPage.resendCodeButton).toBeVisible();

    const responsePromise = page.waitForResponse(`${URLS.BASE_URL}/signin`);

    await signinPage.resendCodeButton.click();

    const response = await responsePromise;
    expect(response.ok()).toBe(true);
  });
});

test.describe("Smoke check log out", () => {
  let signinPage: SigninPage;
  let sidebar: ChatPage;

  test.beforeEach(async ({ page }) => {
    signinPage = new SigninPage(page);
    sidebar = new ChatPage(page);
  });

  test("Check if user is logged in after closing the app", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const authHelper = new AuthHelper(page);

      await test.step("Login", async () => {
        await authHelper.loginAsMainUser(page);
      });

      await test.step("Close the app", async () => {
        await page.close();
      });

      await test.step("Open the app again and check if user is logged in", async () => {
        const newPage = await context.newPage();
        await newPage.goto(`${URLS.BASE_URL}/`);
        await expect(newPage).toHaveURL(`${URLS.BASE_URL}/`);
      });
    } finally {
      await context.close();
    }
  });

  test("Check if user is logged out after closing the app after logout", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    try {
      let page = await context.newPage();
      const authHelper = new AuthHelper(page);

      await test.step("Login", async () => {
        await authHelper.loginAsMainUser(page);
      });

      await test.step("Close the app", async () => {
        await page.close();
      });

      await test.step("Open the app again and check if user is logged in", async () => {
        page = await context.newPage();
        sidebar = new ChatPage(page);
        await page.goto(`${URLS.BASE_URL}/`);
        await expect(page).toHaveURL(`${URLS.BASE_URL}/`);
      });

      await test.step("Logout", async () => {
        await sidebar.clickMenuLinkAndAssertRedirect(
          "Sign out",
          `${URLS.BASE_URL}/signin`
        );
        await expect(page).toHaveURL(`${URLS.BASE_URL}/signin`);
      });

      await test.step("Close the app", async () => {
        await page.close();
      });

      await test.step("Open the app again and check if user is logged out", async () => {
        page = await context.newPage();
        sidebar = new ChatPage(page);
        await page.goto(`${URLS.BASE_URL}/`);
        await expect(page).toHaveURL(`${URLS.BASE_URL}/signin`);
      });
    } finally {
      await context.close();
    }
  });
});

test.describe("Continue as guest", () => {
  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    await page.goto(`${URLS.BASE_URL}/signin`);
    signinPage = new SigninPage(page);
  });

  test("Should redirect to the main page after clicking the 'Continue as guest' button", async ({
    page,
  }) => {
    await signinPage.continueAsGuest(page);
    await expect(page).toHaveURL(`${URLS.BASE_URL}/`);
  });
});
