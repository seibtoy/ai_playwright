import { type Page, type Locator } from "@playwright/test";
import { URLS } from "@/tests/config/urls";

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
    this.emailInput = page.locator('input[name="email"]');
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
    await page.goto(`${URLS.BASE_URL}/signin`);
    await this.continueAsGuestButton.click();
    await page.waitForURL(`${URLS.BASE_URL}/`);

    await page.waitForLoadState("domcontentloaded");
  }
}
