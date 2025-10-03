import { test as setup } from "@playwright/test";

setup("save admin auth state", async ({ page }) => {
  await page.goto("/signin");

  await page.pause();

  await page
    .context()
    .storageState({ path: "tests/storage/storage-state-admin.json" });
});
