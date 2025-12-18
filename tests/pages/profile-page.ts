import type { Locator, Page } from '@playwright/test';

export class ProfilePage {
  readonly deleteAccountButton: Locator;
  readonly deleteInput: Locator;

  constructor(page: Page) {
    this.deleteAccountButton = page.getByRole('button', {
      name: 'Delete Account',
    });
    this.deleteInput = page.getByRole('textbox', {
      name: 'Type DELETE to confirm:',
    });
  }
}
