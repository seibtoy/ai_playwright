import { expect, test } from '@playwright/test';
import { URLS } from '@/tests/config/urls';
import { StratsyncDashboardPage } from '@/tests/pages/stratsync-dashboard-page';

test.describe('Verifies visibility and behavior of StratSync dashboard elements', () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  let stratsyncDashboardPage: StratsyncDashboardPage;

  test.beforeEach(async ({ page }) => {
    stratsyncDashboardPage = new StratsyncDashboardPage(page);

    await stratsyncDashboardPage.gotoStratSyncDashboardPage();
  });

  test('Verifies visibility and behavior elements of StratSync dashboard page (company dashboard tab)', async ({
    page,
  }) => {
    await test.step('Checks if title is visible', async () => {
      await expect(
        page.getByRole('heading', { name: 'StratSync Dashboard' }),
      ).toBeVisible();
    });

    await test.step('Checks if tabs are visible', async () => {
      await expect(stratsyncDashboardPage.myStratSyncTab).toBeVisible();
      await expect(stratsyncDashboardPage.myStratSyncTab).toBeVisible();
    });

    await test.step('Checks if current tab is not clickable and clickable after changing tab', async () => {
      // eslint-disable-next-line playwright/no-conditional-in-test
      if ((await stratsyncDashboardPage.getCurrentPageTab()) === 'company') {
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(
          stratsyncDashboardPage.companyDashboardTab,
        ).toHaveAttribute('aria-selected', 'true');
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(stratsyncDashboardPage.myStratSyncTab).toHaveAttribute(
          'aria-selected',
          'false',
        );

        await stratsyncDashboardPage.myStratSyncTab.click();
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(
          stratsyncDashboardPage.companyDashboardTab,
        ).toHaveAttribute('aria-selected', 'false');
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(stratsyncDashboardPage.myStratSyncTab).toHaveAttribute(
          'aria-selected',
          'true',
        );
      } else {
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(stratsyncDashboardPage.myStratSyncTab).toHaveAttribute(
          'aria-selected',
          'true',
        );
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(
          stratsyncDashboardPage.companyDashboardTab,
        ).toHaveAttribute('aria-selected', 'false');

        await stratsyncDashboardPage.companyDashboardTab.click();
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(stratsyncDashboardPage.myStratSyncTab).toHaveAttribute(
          'aria-selected',
          'false',
        );
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(
          stratsyncDashboardPage.companyDashboardTab,
        ).toHaveAttribute('aria-selected', 'true');
      }
    });
  });
});