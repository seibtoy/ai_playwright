import type { Locator, Page } from "@playwright/test";

export class SigninPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly sendCodeButton: Locator;
  readonly termsOfServiceLink: Locator;
  readonly resendCodeButton: Locator;
  readonly useDifferentEmailButton: Locator;
  readonly verificationCodeInputGroup: Locator;
  readonly continueAsGuestButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole("textbox", { name: "Email Address" });
    this.sendCodeButton = page.getByRole("button", {
      name: "Send verification code",
    });
    this.termsOfServiceLink = page.getByText("Terms of Service");
    this.resendCodeButton = page.getByRole("button", { name: "Resend code" });
    this.useDifferentEmailButton = page.getByRole("button", {
      name: "Use a different email",
    });
    this.verificationCodeInputGroup = page
      .getByRole("group", { name: "Verification code" })
      .locator("input");
    this.continueAsGuestButton = page.getByRole("button", {
      name: "Continue as guest",
    });
  }

  async continueAsGuest(page: Page) {
    await page.goto(`${process.env.BASE_URL}/signin`);
    await this.continueAsGuestButton.click();
    await page.waitForURL(`${process.env.BASE_URL}/`);
  }
}
