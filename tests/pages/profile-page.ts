import type { Locator, Page } from "@playwright/test";

type CalendarType = "Microsoft" | "Google" | "Apple";

export class ProfilePage {
  readonly page: Page;
  readonly deleteAccountButton: Locator;
  readonly deleteInput: Locator;
  readonly integrationsHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.deleteAccountButton = page.getByRole("button", {
      name: "Delete Account",
    });
    this.deleteInput = page.getByRole("textbox", {
      name: "Type DELETE to confirm:",
    });
    this.integrationsHeader = page.getByText("IntegrationsConnect external");
  }

  getCalendarCard(name: CalendarType): Locator {
    return this.page.locator(".flex.flex-col.gap-4.rounded-lg").filter({
      hasText: new RegExp(`${name} Calendar`),
    });
  }

  getCalendarConnectButton(name: CalendarType): Locator {
    return this.getCalendarCard(name).getByRole("button", { name: "Connect" });
  }

  getCalendarStatus(name: CalendarType): Locator {
    return this.getCalendarCard(name).getByText(/connected/i);
  }
}
