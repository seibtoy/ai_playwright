import { expect, type Page } from "@playwright/test";
import { SigninPage } from "@/tests/pages/signin-page";

export class Auth extends SigninPage {
  constructor(page: Page) {
    super(page);
  }

  private async completeLogin(page: Page, userEmail: string) {
    await page.goto(`${process.env.BASE_URL!}/signin`);
    await this.emailInput.fill(userEmail);
    await this.sendCodeButton.click();

    await expect(this.verificationCodeInputGroup.first()).toBeVisible();
    const inputs = this.verificationCodeInputGroup;

    for (let i = 0; i < process.env.AUTH_CODE!.length; i++) {
      await inputs.nth(i).fill(process.env.AUTH_CODE![i]);
    }
  }

  async loginAsMainUser(page: Page) {
    await this.completeLogin(page, process.env.MAIN_USER_EMAIL!);
    await page.waitForURL(`${process.env.BASE_URL!}/`);
  }

  async loginAsTestUser(page: Page) {
    await this.completeLogin(page, process.env.TEST_USER_EMAIL!);
    await page.waitForURL(`${process.env.BASE_URL!}/`);
  }
}
