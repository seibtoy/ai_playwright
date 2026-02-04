import { test as setup } from '@playwright/test';
import { URLS } from '@/tests/config/urls';

setup('save admin auth state', async ({ page }) => {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error('BASE_URL environment variable is not set');
  }
  await page.goto(`${baseUrl}/signin`);

  // eslint-disable-next-line playwright/no-page-pause
  await page.pause();

  await page.context().storageState({ path: URLS.STORAGE_STATE_ADMIN });
});