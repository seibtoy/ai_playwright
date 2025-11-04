import { test as setup } from "@playwright/test";
import { URLS } from "@/tests/config/urls";

setup("save admin auth state", async ({ page }) => {
  await page.goto(`${URLS.BASE_URL}/signin`);

  await page.pause();

  await page.context().storageState({ path: URLS.STORAGE_STATE_ADMIN });
});
