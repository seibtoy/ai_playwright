import { Page, type Locator } from "@playwright/test";

export class ProfilePage {
  private readonly page: Page;
  readonly deleteAccountButton: Locator;
  readonly deleteInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.deleteAccountButton = page.getByRole("button", {
      name: "Delete Account",
    });
    this.deleteInput = page.getByRole("textbox", {
      name: "Type DELETE to confirm:",
    });
  }
}