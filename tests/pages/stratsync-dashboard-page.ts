import { Page, type Locator } from "@playwright/test";

export class StratsyncDashboardPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}
