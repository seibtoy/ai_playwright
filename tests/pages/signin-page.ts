import { type Page, type Locator } from "@playwright/test";

export class SigninPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly sendCodeButton: Locator;
  readonly termsOfServiceLink: Locator;
  readonly resendCodeButton: Locator;
  readonly useDifferentEmailButton: Locator;

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
  }
}
