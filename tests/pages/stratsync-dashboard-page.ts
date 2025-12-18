import type { Locator, Page } from '@playwright/test';

export class StratsyncDashboardPage {
  private readonly page: Page;
  readonly companyDashboardTab: Locator;
  readonly myStratSyncTab: Locator;
  readonly createNewCompanyDashboardButton: Locator;
  readonly createStratSyncDashboardButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.companyDashboardTab = page.getByRole('tab', {
      name: 'Company Dashboard',
    });
    this.myStratSyncTab = page.getByRole('tab', { name: 'My StratSync' });
    this.createNewCompanyDashboardButton = page.getByRole('button', {
      name: 'Paste or Create New Company',
    });
    this.createStratSyncDashboardButton = page.getByRole('button', {
      name: 'Create My StratSync Dashboard',
    });
  }

  async getCurrentPageTab() {
    const currentUrl = this.page.url();
    if (
      currentUrl.includes('/dashboard/stratsync') ||
      currentUrl.includes('/dashboard/stratsync?tab=company')
    )
      return 'company';
    if (currentUrl.includes('/dashboard/stratsync?tab=personal'))
      return 'stratsync';
  }

  async gotoStratSyncDashboardPage() {
    if ((await this.getCurrentPageTab()) === 'stratsync') return;
    await this.page.goto(`${process.env.BASE_URL}/dashboard/stratsync`);
    await this.page.waitForURL(`${process.env.BASE_URL}/dashboard/stratsync`);
  }

  async gotoCompanyDashboard() {
    if ((await this.getCurrentPageTab()) === 'company') {
      return;
    }
    await this.companyDashboardTab.click();
    await this.page.waitForURL(
      `${process.env.BASE_URL}/dashboard/stratsync?tab=company`,
    );
  }
  async gotoMyStratSync() {
    if ((await this.getCurrentPageTab()) === 'stratsync') return;
    await this.myStratSyncTab.click();
    await this.page.waitForURL(
      `${process.env.BASE_URL}/dashboard/stratsync?tab=personal`,
    );
  }
}
