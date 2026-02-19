import { expect, test } from "@playwright/test";
import { SigninPage } from "@/tests/pages/signin-page";
import { ChatPage } from "@/tests/pages/chat-page";

test.describe("Guest user permissions: restrictions", () => {
  let signinPage: SigninPage;
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    signinPage = new SigninPage(page);
    chatPage = new ChatPage(page);
    await signinPage.continueAsGuest(page);
  });
  test("Should NOT have access to AO prompts, Admin Panel and NOT able to upload files", async ({
    page,
  }) => {
    await test.step("Should NOT have access to AO prompts", async () => {
      await expect(chatPage.alignmentOptimizerLink).not.toBeVisible();
    });

    await test.step("Should NOT have access to Admin panel", async () => {
      await expect(chatPage.settingsDropdown).not.toBeVisible();
    });

    await test.step("Should NOT be able to upload files", async () => {
      await chatPage.attachmentsButton.click();

      const notification = page
        .getByRole("region", { name: "Notifications alt+T" })
        .getByRole("listitem");

      await expect(notification).toBeVisible();
      await expect(notification).toContainText("Sign in to attach files");
    });

    await test.step("Should NOT have access to Response Aggregation", async () => {
      await expect(chatPage.responseAggregation).not.toBeVisible();
    });
  });
});
