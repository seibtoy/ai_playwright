import { type Page, type Locator, expect } from "@playwright/test";
import { ChatPage } from "./chat-page";

export class Sidebar extends ChatPage {
  readonly logoLink: Locator;
  readonly takeAssessmentLink: Locator;
  readonly runBusinessLink: Locator;
  readonly importExternalMemoryButton: Locator;
  readonly toggleButton: Locator;
  readonly sidebar: Locator;
  readonly settingsDropdown: Locator;
  readonly adminMenuItem: Locator;
  readonly responseAggregationLink: Locator;

  constructor(page: Page) {
    super(page);
    this.logoLink = page.getByRole("link", { name: "AI Thought Partner™" });
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
}
