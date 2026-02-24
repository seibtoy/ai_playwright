import { expect, type Page } from "@playwright/test";
import { SigninPage } from "@/tests/pages/signin-page";

type LoginTypes = "Admin" | "OrgAdmin" | "User" | "TestUser";

export class Auth extends SigninPage {
  private async completeLogin(page: Page, userEmail: string) {
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      throw new Error("BASE_URL environment variable is not set");
    }
    await page.goto(`${baseUrl}/signin`);
    await this.emailInput.fill(userEmail);
    await this.sendCodeButton.click();

    await expect(this.verificationCodeInputGroup.first()).toBeVisible();
    const inputs = this.verificationCodeInputGroup;

    const authCode = process.env.AUTH_CODE;
    if (!authCode) {
      throw new Error("AUTH_CODE environment variable is not set");
    }
    for (let i = 0; i < authCode.length; i++) {
      await inputs.nth(i).fill(authCode[i]);
    }
  }

  async login(page: Page, role: LoginTypes) {
    let email: string | undefined;
    switch (role) {
      case "User":
        email = process.env.MAIN_USER_EMAIL;
        break;
      case "TestUser":
        email = process.env.TEST_USER_EMAIL;
        break;
      case "Admin":
        email = process.env.ADMIN_USER_EMAIL;
        break;
      case "OrgAdmin":
        email = process.env.ORG_ADMIN_USER_EMAIL;
        break;
    }

    if (!email) {
      throw new Error(`${role} environment variable is not set`);
    }
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      throw new Error("BASE_URL environment variable is not set");
    }

    await this.completeLogin(page, email);
    await page.waitForURL(`${baseUrl}/`);
  }
}
