import { expect, test } from "@playwright/test";
import { URLS } from "@/tests/config/urls";
import { generateEmail } from "@/tests/helpers/generate-email";
import { ChatPage } from "@/tests/pages/chat-page";
import { SigninPage } from "@/tests/pages/signin-page";

test.describe("Sign-in: elements before email submission", () => {
  test.use({ storageState: undefined }); // This test is not supposed to use a storage state

  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/signin`);
    signinPage = new SigninPage(page);
  });

  test("Should display sign-in page elements", async ({ page }) => {
    await test.step("Verify logo is visible", async () => {
      await expect(page.getByRole("img")).toBeVisible();
    });

    await test.step("Verify heading is visible", async () => {
      await expect(
        page.getByRole("heading", { name: "Sign in to AITP" }),
      ).toBeVisible();
    });

    await test.step("Verify description text is visible", async () => {
      await expect(page.getByText("Enter your email and we'll")).toBeVisible();
    });

    await test.step("Verify email label is visible", async () => {
      await expect(page.getByText("Email Address")).toBeVisible();
    });

    await test.step("Verify email input is visible", async () => {
      await expect(signinPage.emailInput).toBeVisible();
    });

    await test.step("Verify send code button is visible", async () => {
      await expect(signinPage.sendCodeButton).toBeVisible();
    });

    await test.step("Verify terms text is visible", async () => {
      await expect(page.getByText("By continuing, you agree to")).toBeVisible();
    });
  });

  test("Should navigate to Terms of Service page", async ({
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

  test("Should activate 'Send verification code' button only for valid email", async () => {
    await test.step("Verify button is disabled with empty input", async () => {
      await expect(signinPage.sendCodeButton).toBeDisabled();
    });

    await test.step("Verify button is disabled with invalid email", async () => {
      await signinPage.emailInput.fill("invalid-email-format");
      await expect(signinPage.sendCodeButton).toBeDisabled();
    });

    await test.step("Verify button is enabled with valid email", async () => {
      await signinPage.emailInput.fill(generateEmail());
      await expect(signinPage.sendCodeButton).toBeEnabled();
    });
  });

  test("Should display 'Continue as guest' button", async ({
    page,
  }) => {
    await test.step("Verify 'Continue as guest' button is visible and active", async () => {
      await expect(signinPage.continueAsGuestButton).toBeVisible();
      await expect(signinPage.continueAsGuestButton).toBeEnabled();
      await expect(page.getByText("Try our AI BTS™ features")).toBeVisible();
    });
  });
});

test.describe("Sign-in: elements after email submission", () => {
  test.use({ storageState: undefined }); // This test is not supposed to use a storage state

  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/signin`);
    signinPage = new SigninPage(page);
  });

  test("Should show toast after email submission", async ({ page }) => {
    await test.step("Submit email and verify toast appears", async () => {
      await signinPage.emailInput.fill(generateEmail());
      await signinPage.sendCodeButton.click();

      await expect(page.getByTestId("toast")).toBeVisible();
    });
  });

  test("Should display verification form after sending code", async ({ page }) => {
    await test.step("Submit email", async () => {
      await signinPage.emailInput.fill(generateEmail());
      await signinPage.sendCodeButton.click();
    });

    await test.step("Verify all verification form elements are visible", async () => {
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
  });

  test("Should return to email input when clicking 'Use a different email'", async () => {
    await test.step("Submit email and navigate to verification form", async () => {
      await signinPage.emailInput.fill(generateEmail());
      await signinPage.sendCodeButton.click();
    });

    await test.step("Click 'Use a different email' and verify email input is visible", async () => {
      await signinPage.useDifferentEmailButton.click();
      await expect(signinPage.emailInput).toBeVisible();
    });
  });
});

test.describe("Sign-in: verification code flow", () => {
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

  test("Should show verification code after submitting email", async ({ page }) => {
    await test.step("Submit email and verify code input appears", async () => {
      await signinPage.emailInput.fill(generateEmail());
      await signinPage.sendCodeButton.click();

      await expect(page.getByText("Verification Code")).toBeVisible();
    });
  });

  test("Should handle resend code button correctly", async () => {
    await test.step("Submit email", async () => {
      await signinPage.emailInput.fill(generateEmail());
      await signinPage.sendCodeButton.click();
    });

    await test.step("Verify resend code button works", async () => {
      await expect(signinPage.resendCodeButton).toBeVisible();
      await expect(signinPage.resendCodeButton).toBeEnabled({ timeout: 25000 });

      await signinPage.resendCodeButton.click();

      await expect(signinPage.resendCodeButton).toBeDisabled();
    });
  });
});

test.describe("Sign-in: logout", () => {
  test.use({ storageState: undefined }); // This test is not supposed to use a storage state

  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
  });

  test("Should keep user logged in after closing the app", async ({
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

  test("Should log out user after signing out and closing the app", async ({
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
        chatPage = new ChatPage(page);
        await page.goto(`${process.env.BASE_URL}/`);
        await expect(page).toHaveURL(`${process.env.BASE_URL}/`);
      });

      await test.step("Logout", async () => {
        await chatPage.clickMenuLinkAndAssertRedirect(
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
        chatPage = new ChatPage(page);
        await page.goto(`${process.env.BASE_URL}/`);
        await expect(page).toHaveURL(`${process.env.BASE_URL}/signin`);
      });
    } finally {
      await context.close();
    }
  });
});

test.describe("Sign-in: continue as guest", () => {
  test.use({ storageState: undefined }); // This test is not supposed to use a storage state

  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/signin`);
    signinPage = new SigninPage(page);
  });

  test("Should redirect to the main page after clicking 'Continue as guest'", async ({
    page,
  }) => {
    await test.step("Click 'Continue as guest' and verify redirect", async () => {
      await signinPage.continueAsGuest(page);
      await expect(page).toHaveURL(`${process.env.BASE_URL}/`);
    });
  });
});
