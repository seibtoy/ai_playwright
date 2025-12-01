import { type Page, type Locator, expect } from "@playwright/test";

export class Sidebar {
  protected readonly page: Page;
  readonly createAccountButton: Locator;
  readonly toggleThemeButton: Locator;
  readonly termsOfServiceLink: Locator;
  readonly verificationCodeInputGroup: Locator;

  readonly logoLink: Locator;
  readonly takeAssessmentLink: Locator;
  readonly runBusinessLink: Locator;
  readonly importExternalMemoryButton: Locator;
  readonly toggleButton: Locator;
  readonly sidebar: Locator;
  readonly settingsDropdown: Locator;
  readonly adminMenuItem: Locator;
  readonly responseAggregationLink: Locator;

  readonly chatActionsDropdown: Locator;
  readonly deleteChatButton: Locator;
  readonly confirmDeleteChatButton: Locator;

  readonly moreChatDropdown: Locator;

  constructor(page: Page) {
    this.page = page;

    this.createAccountButton = page.getByRole("button", {
      name: "Sign In / Create Account",
    });
    this.toggleThemeButton = page.getByRole("button", { name: "Toggle theme" });
    this.termsOfServiceLink = page.getByRole("link", {
      name: "Terms of Service",
    });
    this.verificationCodeInputGroup = page.getByRole("group", {
      name: "Verification code",
    });

    this.logoLink = page.getByRole("link", { name: "Logo" });
    this.takeAssessmentLink = page.getByRole("link", {
      name: "Take the Assessment",
    });
    this.runBusinessLink = page.getByRole("link", { name: "Run the Business" });
    this.importExternalMemoryButton = page.getByRole("button", {
      name: "Import External Memory",
    });
    this.toggleButton = page
      .locator("header")
      .getByRole("button")
      .filter({ hasText: /^$/ });
    this.sidebar = page.locator('div[data-slot="sidebar"]');
    this.settingsDropdown = page.locator(
      'button[data-sidebar="menu-button"][data-slot="dropdown-menu-trigger"]'
    );
    this.adminMenuItem = page.getByRole("menuitem", { name: "Admin" });
    this.responseAggregationLink = page.getByRole("link", {
      name: "Response Aggregation",
    });
    this.chatActionsDropdown = page.locator(
      "button[data-sidebar='menu-action'][data-slot='dropdown-menu-trigger']"
    );
    this.deleteChatButton = page.getByRole("menuitem", { name: "Delete" });
    this.confirmDeleteChatButton = page.getByRole("button", {
      name: "Continue",
    });
    this.moreChatDropdown = page.getByRole("menu", { name: "More" });
  }

  async getTheme(): Promise<string> {
    return this.page.evaluate(() => {
      return getComputedStyle(document.documentElement).colorScheme;
    });
  }

  async openSettings() {
    await this.settingsDropdown.click();
  }

  async clickMenuLinkAndAssertPopup(name: string, expectedUrl: string) {
    await this.openSettings();
    const popupPromise = this.page.waitForEvent("popup");

    await this.page.getByRole("menuitem", { name }).click();

    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");

    await expect(popup).toHaveURL(expectedUrl);
    await popup.close();
  }

  async clickMenuLinkAndAssertRedirect(name: string, expectedUrl: string) {
    await this.openSettings();
    await this.page.getByRole("menuitem", { name }).click();
    await expect(this.page).toHaveURL(expectedUrl);
  }

  async logout() {
    await this.openSettings();
    await this.page.getByRole("menuitem", { name: "Sign out" }).click();
    await this.page.waitForURL(`${process.env.BASE_URL!}/signin`, {
      timeout: 1500,
    });
  }
}
