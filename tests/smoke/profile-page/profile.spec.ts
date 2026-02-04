import { expect, test } from '@playwright/test';
import { URLS } from '@/tests/config/urls';
import { ProfilePage } from '@/tests/pages/profile-page';

test.describe('Verify all profile page elements are visible and work correctly', () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await page.goto(`${process.env.BASE_URL}/profile`);
  });

  test('Verify all profile page elements are visible', async ({ page }) => {
    const currentUserInboxName = process.env.MAIN_USER_EMAIL;
    if (!currentUserInboxName) {
      throw new Error('MAIN_USER_EMAIL environment variable is not set');
    }

    await test.step('Check if header if visible', async () => {
      await expect(
        page.getByRole('heading', { name: 'My Account' }),
      ).toBeVisible();
    });

    await test.step('Check if profile information block is visible', async () => {
      await expect(page.getByText('Profile Information')).toBeVisible();
      await expect(page.getByText('Email')).toBeVisible();
      await expect(
        page.getByRole('paragraph').filter({ hasText: currentUserInboxName }),
      ).toContainText(currentUserInboxName);

      await expect(
        page.getByRole('main').getByRole('img', { name: currentUserInboxName }),
      ).toBeVisible();
    });

    await test.step('Check if danger zone block is visible', async () => {
      await expect(
        page.getByText(
          'Danger ZoneIrreversible and destructive actionsDelete AccountPermanently delete',
        ),
      ).toBeVisible();
      await expect(page.getByText('Danger Zone')).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Delete Account' }),
      ).toBeVisible();
      await expect(page.getByText('Permanently delete your')).toBeVisible();
      await expect(profilePage.deleteAccountButton).toBeVisible();
    });
  });

  test('Verify delete account buttons shows modal with correct content', async ({
    page,
  }) => {
    await test.step('Open delete account modal', async () => {
      await profilePage.deleteAccountButton.click();
      await expect(
        page.getByRole('alertdialog', { name: 'Delete Account' }),
      ).toBeVisible();
    });
    await test.step('Check if modal content is visible and correct', async () => {
      const currentUserInboxName = process.env.MAIN_USER_EMAIL;
      if (!currentUserInboxName) {
        throw new Error('MAIN_USER_EMAIL environment variable is not set');
      }

      await expect(
        page.getByRole('heading', { name: 'Delete Account' }),
      ).toBeVisible();
      await expect(
        page.getByText(
          'This action cannot be undone. This will permanently delete your account and',
        ),
      ).toBeVisible();
      await expect(page.getByText('All chat conversations,')).toBeVisible();
      await expect(
        page.getByText('All votes and interactions on'),
      ).toBeVisible();
      await expect(page.getByText('Generated reports,')).toBeVisible();
      await expect(page.getByText('All saved documents,')).toBeVisible();
      await expect(page.getByText('User preferences and memory')).toBeVisible();
      await expect(page.getByText('Authentication sessions and')).toBeVisible();
      await expect(page.getByText('Follow-up emails and')).toBeVisible();
      await expect(
        page.getByText('All other personal and usage'),
      ).toBeVisible();
      await expect(page.getByText(/Account:/)).toContainText(
        currentUserInboxName,
      );

      await expect(page.getByText('Type DELETE to confirm:')).toBeVisible();
      await expect(profilePage.deleteInput).toBeVisible();

      await expect(
        page.getByRole('button', { name: 'Delete Account' }),
      ).toBeVisible();

      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    });

    await test.step('Verify that button is disabled before input is filled with correct value', async () => {
      await expect(profilePage.deleteInput).toHaveValue('');
      await expect(profilePage.deleteAccountButton).toBeDisabled();

      await profilePage.deleteInput.fill('DELETE');
      await expect(profilePage.deleteAccountButton).toBeEnabled();
    });
  });
});