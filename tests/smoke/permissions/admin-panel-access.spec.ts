import { test, expect } from "@/tests/fixtures/index";
import { URLS } from "@/tests/config/urls";

test.describe("Admin panel access: Org Admin", () => {
  test.use({ storageState: URLS.STORAGE_STATE_ORG_ADMIN });

  test("Org admin should NOT see snippets, global prompts, RTB prompts and tabs in admin panel", async ({
    adminSidebar,
  }) => {
    await expect(adminSidebar.usersTab).toBeVisible();
    await expect(adminSidebar.organizationTab).toBeVisible();
    await expect(adminSidebar.tokenUsageTab).toBeVisible();
    await expect(adminSidebar.archivedPromptsTab).toBeVisible();

    await expect(adminSidebar.globalPromptsSection).not.toBeVisible();
    await expect(adminSidebar.snippetsSection).not.toBeVisible();
    await expect(adminSidebar.rtbPromptDropdown).not.toBeVisible();
    await expect(adminSidebar.organizationsPrompts).toBeVisible();
  });
});

test.describe("Admin panel access: Admin", () => {
  test.use({ storageState: URLS.STORAGE_STATE_ADMIN });

  test("Admin should click on each tab and navigate properly", async ({
    adminSidebar,
  }) => {
    await expect(adminSidebar.globalPromptsSection).toBeVisible();
    await expect(adminSidebar.snippetsSection).toBeVisible();
    await expect(adminSidebar.rtbPromptDropdown).toBeVisible();

    await expect(adminSidebar.sectionsTab).toBeVisible();
    await expect(adminSidebar.urlRedirectsTab).toBeVisible();
  });

  test("Tabs in admin panel should lead to the correct pages", async ({
    page,
    adminSidebar,
  }) => {
    await adminSidebar.usersTab.click();
    await expect(page).toHaveURL("/admin/users");

    await adminSidebar.organizationsTab.click();
    await expect(page).toHaveURL(/\/admin\/organizations/);

    await adminSidebar.sectionsTab.click();
    await expect(page).toHaveURL("/admin/sections");

    await adminSidebar.tokenUsageTab.click();
    await expect(page).toHaveURL("/admin/usage");

    await adminSidebar.archivedPromptsTab.click();
    await expect(page).toHaveURL("/admin/prompts/archived");

    await adminSidebar.urlRedirectsTab.click();
    await expect(page).toHaveURL("/admin/url-redirects");
  });
});
