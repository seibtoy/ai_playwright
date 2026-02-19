import { expect, test } from "@/tests/fixtures/index";
import { URLS } from "@/tests/config/urls";

test.describe("Permissions in Alignment Optimizer: Admin", () => {
  test.use({ storageState: URLS.STORAGE_STATE_ADMIN });

  test("Admin should be able to create AO prompt", async ({
    page,
    chatPage,
  }) => {
    // AO prompts cannot be deleted via UI, so we use a pre-created test prompt
    // instead of creating a new one each run to avoid polluting the page.
    // If this test fails, verify that the test prompt still exists on staging.
    await test.step("Navigate to AO page and verify that at least one AO is exists", async () => {
      await chatPage.alignmentOptimizerLink.click();
      await expect(
        page.getByRole("link", { name: "No responses yet Share" }),
      ).toBeVisible();
    });

    await test.step("Admin should be able to edit the AO prompt", async () => {
      await expect(
        page
          .getByLabel("My Alignment Optimizers")
          .getByRole("button")
          .filter({ hasText: /^$/ }),
      ).toBeVisible();
    });

    await test.step("Admin should be able to edit prompts in organization", async () => {
      await page
        .getByRole("tab", { name: "My team’s Alignment Optimizers" })
        .click();
      await expect(
        page.getByRole("link", { name: "No responses yet Share" }).first(),
      ).toBeVisible();
      await expect(
        page
          .getByLabel("My Alignment Optimizers")
          .getByRole("button")
          .filter({ hasText: /^$/ })
          .first(),
      ).toBeVisible();
    });
  });
});

test.describe("Permissions in Alignment Optimizer: Org admin", () => {
  test.use({ storageState: URLS.STORAGE_STATE_ORG_ADMIN });

  test("Org Admin should be able to create AO prompt", async ({
    page,
    chatPage,
  }) => {
    // AO prompts cannot be deleted via UI, so we use a pre-created test prompt
    // instead of creating a new one each run to avoid polluting the page.
    // If this test fails, verify that the test prompt still exists on staging.
    await test.step("Navigate to AO page and verify that at least one AO is exists", async () => {
      await chatPage.alignmentOptimizerLink.click();
      await expect(
        page.getByRole("link", { name: "No responses yet Share" }),
      ).toBeVisible();
    });

    await test.step("Org Admin should be able to edit the AO prompt", async () => {
      await expect(
        page
          .getByLabel("My Alignment Optimizers")
          .getByRole("button")
          .filter({ hasText: /^$/ }),
      ).toBeVisible();
    });

    await test.step("Org Admin should be able to edit prompts in organization", async () => {
      await page
        .getByRole("tab", { name: "My team’s Alignment Optimizers" })
        .click();
      await expect(
        page.getByRole("link", { name: "No responses yet Share" }).first(),
      ).toBeVisible();
      await expect(
        page
          .getByLabel("My Alignment Optimizers")
          .getByRole("button")
          .filter({ hasText: /^$/ })
          .first(),
      ).toBeVisible();
    });
  });
});

test.describe("Permissions in Alignment Optimizer: User", () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  test("User should be able to create AO prompt", async ({
    page,
    chatPage,
  }) => {
    // AO prompts cannot be deleted via UI, so we use a pre-created test prompt
    // instead of creating a new one each run to avoid polluting the page.
    // If this test fails, verify that the test prompt still exists on staging.
    await test.step("Navigate to AO page and verify that at least one AO is exists", async () => {
      await chatPage.alignmentOptimizerLink.click();
      await expect(
        page.getByRole("link", { name: "No responses yet Share" }),
      ).toBeVisible();
    });

    await test.step("User shouldn't be able to edit the AO prompt", async () => {
      await expect(
        page
          .getByLabel("My Alignment Optimizers")
          .getByRole("button")
          .filter({ hasText: /^$/ }),
      ).not.toBeVisible();
    });

    await test.step("User shouldn't be able to edit prompts in organization", async () => {
      await page
        .getByRole("tab", { name: "My team’s Alignment Optimizers" })
        .click();
      await expect(
        page.getByRole("link", { name: "No responses yet Share" }).first(),
      ).toBeVisible();
      await expect(
        page
          .getByLabel("My Alignment Optimizers")
          .getByRole("button")
          .filter({ hasText: /^$/ })
          .first(),
      ).not.toBeVisible();
    });
  });
});
