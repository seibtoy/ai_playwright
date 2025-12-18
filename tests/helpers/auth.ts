import { expect, type Page } from "@playwright/test";
import { SigninPage } from "@/tests/pages/signin-page";

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

  async loginAsMainUser(page: Page) {
    const mainUserEmail = process.env.MAIN_USER_EMAIL;
    if (!mainUserEmail) {
      throw new Error("MAIN_USER_EMAIL environment variable is not set");
    }
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      throw new Error("BASE_URL environment variable is not set");
    }
    await this.completeLogin(page, mainUserEmail);
    await page.waitForURL(`${baseUrl}/`);
  }

  async loginAsTestUser(page: Page) {
    const testUserEmail = process.env.TEST_USER_EMAIL;
    if (!testUserEmail) {
      throw new Error("TEST_USER_EMAIL environment variable is not set");
    }
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      throw new Error("BASE_URL environment variable is not set");
    }
    await this.completeLogin(page, testUserEmail);
    await page.waitForURL(`${baseUrl}/`);
  }
}
