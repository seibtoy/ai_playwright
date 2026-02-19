import { type Locator, type Page } from "@playwright/test";

export class AdminSidebar {
  protected readonly page: Page;

  readonly backToAppButton: Locator;

  readonly usersTab: Locator;
  readonly organizationTab: Locator; // tab for org admin
  readonly organizationsTab: Locator; // tab for global admin
  readonly sectionsTab: Locator;
  readonly tokenUsageTab: Locator;
  readonly archivedPromptsTab: Locator;
  readonly urlRedirectsTab: Locator;

  readonly globalPromptsSection: Locator;
  readonly snippetsSection: Locator;

  readonly rtbPromptDropdown: Locator;
  readonly organizationsPrompts: Locator;

  constructor(page: Page) {
    this.page = page;

    this.backToAppButton = page.getByRole("link", { name: "Back to app" });

    this.usersTab = page.getByRole("link", { name: "Users", exact: true });

    this.organizationTab = page.getByRole("link", {
      name: "Organization",
      exact: true,
    });
    this.organizationsTab = page.getByRole("link", {
      name: "Organizations",
      exact: true,
    });
    this.sectionsTab = page.getByRole("link", {
      name: "Sections",
      exact: true,
    });
    this.tokenUsageTab = page.getByRole("link", {
      name: "Token Usage",
      exact: true,
    });
    this.archivedPromptsTab = page.getByRole("link", {
      name: "Archived Prompts",
      exact: true,
    });
    this.urlRedirectsTab = page.getByRole("link", {
      name: "URL Redirects",
      exact: true,
    });

    this.globalPromptsSection = page.getByText("Global Prompts").first();
    this.snippetsSection = page.getByText("Snippets");

    this.rtbPromptDropdown = page.getByRole("button", {
      name: "Global Prompts",
    });
    this.organizationsPrompts = page.getByRole("button", {
      name: "Organization Prompts",
    });
  }
}
