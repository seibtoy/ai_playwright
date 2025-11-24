import { test, expect } from "@playwright/test";
import { StratsyncDashboardPage } from "@/tests/pages/stratsync-dashboard-page";
import { AuthHelper } from "@/tests/helpers/save-session";

test.describe("Verifies visibility and behavior of StratSync dashboard elements", () => {
  let stratsyncDashboardPage: StratsyncDashboardPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    stratsyncDashboardPage = new StratsyncDashboardPage(page);

    await authHelper.loginAsMainUser(page);
    await stratsyncDashboardPage.gotoStratSyncDashboardPage();
  });

  test("Verifies visibility and behavior elements of StratSync dashboard page (company dashboard tab)", async ({
    page,
  }) => {
    await test.step("Checks if title is visible", async () => {
      await expect(
        page.getByRole("heading", { name: "StratSync Dashboard" })
      ).toBeVisible();
    });

    await test.step("Checks if tabs are visible", async () => {
      await expect(stratsyncDashboardPage.myStratSyncTab).toBeVisible();
      await expect(stratsyncDashboardPage.myStratSyncTab).toBeVisible();
    });

    await test.step("Checks if current tab is not clickable and clickable after changing tab", async () => {
      if ((await stratsyncDashboardPage.getCurrentPageTab()) === "company") {
        await expect(
          stratsyncDashboardPage.companyDashboardTab
        ).toHaveAttribute("aria-selected", "true");
        await expect(stratsyncDashboardPage.myStratSyncTab).toHaveAttribute(
          "aria-selected",
          "false"
        );

        await stratsyncDashboardPage.myStratSyncTab.click();
        await expect(
          stratsyncDashboardPage.companyDashboardTab
        ).toHaveAttribute("aria-selected", "false");
        await expect(stratsyncDashboardPage.myStratSyncTab).toHaveAttribute(
          "aria-selected",
          "true"
        );
      } else {
        await expect(stratsyncDashboardPage.myStratSyncTab).toHaveAttribute(
          "aria-selected",
          "true"
        );
        await expect(
          stratsyncDashboardPage.companyDashboardTab
        ).toHaveAttribute("aria-selected", "false");

        await stratsyncDashboardPage.companyDashboardTab.click();
        await expect(stratsyncDashboardPage.myStratSyncTab).toHaveAttribute(
          "aria-selected",
          "false"
        );
        await expect(
          stratsyncDashboardPage.companyDashboardTab
        ).toHaveAttribute("aria-selected", "true");
      }
    });
  });
});
