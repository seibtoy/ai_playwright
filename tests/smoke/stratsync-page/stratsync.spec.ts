import { expect, test } from "@playwright/test";
import { URLS } from "@/tests/config/urls";
import { StratsyncDashboardPage } from "@/tests/pages/stratsync-dashboard-page";

test.describe("StratSync: dashboard elements", () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  let stratsyncDashboardPage: StratsyncDashboardPage;

  test.beforeEach(async ({ page }) => {
    stratsyncDashboardPage = new StratsyncDashboardPage(page);

    await stratsyncDashboardPage.gotoStratSyncDashboardPage();
  });

  test("Should display and interact with StratSync dashboard tabs", async ({
    page,
  }) => {
    await test.step("Verify title is visible", async () => {
      await expect(
        page.getByRole("heading", { name: "StratSync" }),
      ).toBeVisible();
    });

    await test.step("Verify tabs are visible", async () => {
      await expect(stratsyncDashboardPage.myStratSyncTab).toBeVisible();
      await expect(stratsyncDashboardPage.companyDashboardTab).toBeVisible();
    });

    await test.step("Verify Company Dashboard tab is selected by default", async () => {
      await expect(
        stratsyncDashboardPage.companyDashboardTab,
      ).toHaveAttribute("aria-selected", "true");
      await expect(stratsyncDashboardPage.myStratSyncTab).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });

    await test.step("Switch to My StratSync tab and verify selection", async () => {
      await stratsyncDashboardPage.myStratSyncTab.click();
      await expect(
        stratsyncDashboardPage.companyDashboardTab,
      ).toHaveAttribute("aria-selected", "false");
      await expect(stratsyncDashboardPage.myStratSyncTab).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    await test.step("Switch back to Company Dashboard tab and verify selection", async () => {
      await stratsyncDashboardPage.companyDashboardTab.click();
      await expect(
        stratsyncDashboardPage.companyDashboardTab,
      ).toHaveAttribute("aria-selected", "true");
      await expect(stratsyncDashboardPage.myStratSyncTab).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });
  });
});
