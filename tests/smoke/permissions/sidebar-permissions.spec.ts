import { expect, test } from "@/tests/fixtures/index";
import { URLS } from "@/tests/config/urls";

test.describe("Sidebar permissions — User", () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  test("Should NOT see Admin button and Response Aggregation", async ({
    chatPage,
  }) => {
    await expect(chatPage.responseAggregation).not.toBeVisible();
    await chatPage.openSettings();
    await expect(chatPage.adminMenuItem).not.toBeVisible();
  });
});

test.describe("Sidebar permissions — Org Admin", () => {
  test.use({ storageState: URLS.STORAGE_STATE_ORG_ADMIN });

  test("Should see Admin button but NOT Response Aggregation", async ({
    chatPage,
  }) => {
    await expect(chatPage.responseAggregation).not.toBeVisible();
    await chatPage.openSettings();
    await expect(chatPage.adminMenuItem).toBeVisible();
  });
});

test.describe("Sidebar permissions — Admin", () => {
  test.use({ storageState: URLS.STORAGE_STATE_ADMIN });

  test("Should see Admin button and Response Aggregation", async ({
    chatPage,
  }) => {
    await expect(chatPage.responseAggregation).toBeVisible();
    await chatPage.openSettings();
    await expect(chatPage.adminMenuItem).toBeVisible();
  });
});
